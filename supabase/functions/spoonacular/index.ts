// Supabase Edge Function: server-side proxy for the Spoonacular API.
//
// Keeps SPOONACULAR_API_KEY out of the client bundle. The app calls this
// function (authorized with the public anon key); the function appends the
// real Spoonacular key, which lives only in a Supabase secret.
//
// Deploy:  supabase functions deploy spoonacular
// Secret:  supabase secrets set SPOONACULAR_API_KEY=...

const SPOONACULAR_KEY = Deno.env.get('SPOONACULAR_API_KEY');
const BASE = 'https://api.spoonacular.com';

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

// Allowlist of endpoints — prevents this from being an open proxy.
function buildUrl(
  endpoint: string,
  params: Record<string, string>,
  id?: string,
): string | null {
  const q = new URLSearchParams(params);
  q.set('apiKey', SPOONACULAR_KEY ?? '');
  switch (endpoint) {
    case 'findByIngredients':
      return `${BASE}/recipes/findByIngredients?${q}`;
    case 'complexSearch':
      return `${BASE}/recipes/complexSearch?${q}`;
    case 'information':
      return id && /^\d+$/.test(id) ? `${BASE}/recipes/${id}/information?${q}` : null;
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!SPOONACULAR_KEY) return json({ error: 'SPOONACULAR_API_KEY not set' }, 500);

  try {
    const { endpoint, params = {}, id } = await req.json();
    const url = buildUrl(endpoint, params, id);
    if (!url) return json({ error: `unsupported endpoint: ${endpoint}` }, 400);

    const res = await fetch(url);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
