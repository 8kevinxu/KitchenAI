// Supabase Edge Function: parse a grocery receipt photo into structured items.
//
// Takes a base64 image, asks Claude (vision) to extract + normalize grocery
// items, and returns JSON. The Anthropic API key stays server-side as a
// Supabase secret (ANTHROPIC_API_KEY) — it never ships in the app bundle.
//
// Deploy:  supabase functions deploy scan-receipt
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// Haiku 4.5 is the cheap, fast vision model (~half a cent/scan). Bump to
// claude-sonnet-4-6 if accuracy on messy receipts isn't good enough.
const MODEL = 'claude-haiku-4-5';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const PROMPT = `You are reading a photo of a grocery store receipt. Extract the FOOD/grocery items the shopper bought and return them as structured data.

Rules:
- Expand abbreviated names into clear, common ingredient names (e.g. "GG ORG BANANA" -> "bananas", "CHKN BRST" -> "chicken breast", "SHRD MOZZ" -> "shredded mozzarella").
- Assign each item to the single best category:
  - "Proteins": meat, poultry, fish, seafood, eggs, tofu, dairy (milk, cheese, yogurt)
  - "Vegetables": vegetables and fruit
  - "Carbs": rice, bread, pasta, grains, cereal, potatoes
  - "Seasonings": oils, sauces, condiments, spices, sugar, salt, baking items
- Include a short quantity ONLY when the line shows a weight, volume, or count (e.g. "2 lb", "12 oz", "1 ct"). The quantity is NEVER the price — if a line shows only a price and no amount, omit quantity entirely.
- IGNORE non-food lines: subtotal, tax, total, change, payment/card, store name/address, phone, dates, loyalty/coupons, bags.
- If you can't read the receipt or it has no grocery items, return an empty items array.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          category: {
            type: 'string',
            enum: ['Proteins', 'Vegetables', 'Carbs', 'Seasonings'],
          },
          quantity: { type: 'string' },
        },
        required: ['name', 'category'],
      },
    },
  },
  required: ['items'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not set' }, 500);

  try {
    const { image, mediaType = 'image/jpeg' } = await req.json();
    if (!image) return json({ error: 'missing image' }, 400);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'anthropic_error', status: res.status, detail }, 502);
    }

    const data = await res.json();
    if (data.stop_reason === 'refusal') return json({ items: [] });

    // With output_config.format, the model's JSON is the text of the first block.
    const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text ?? '{}';
    let parsed: { items?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ error: 'parse_error', raw: text }, 502);
    }
    return json({ items: Array.isArray(parsed.items) ? parsed.items : [] });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
