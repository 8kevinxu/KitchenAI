# Virtual Kitchen 🍳

An AI-powered system for kitchen inventory management and meal planning. Instead
of manually maintaining a pantry list or guessing what to cook, Virtual Kitchen
tracks what you have by scanning grocery receipts, recommends recipes based on
your actual ingredients, and flags items that are missing or expiring — reducing
food waste, easing meal planning, and saving money.

It's aimed at busy individuals and families, students and young professionals
living independently, and people with dietary restrictions who need the right
ingredients on hand.

**Current state:** all screens are built and navigable, with state persisted
locally (AsyncStorage) and synced to a hosted Supabase Postgres backend. The
core features are working end-to-end:

- **Receipt scanning** — the camera captures a receipt and Claude (vision)
  extracts & normalizes the grocery items; you review them, then they're added
  to inventory.
- **Recipe recommendations** — real dishes ranked by how much of your inventory
  each uses (with missing-ingredient flags), pulling from TheMealDB and
  Spoonacular, and browsable by cuisine.
- **Inventory** — freshness + abundance indicators and a "use soon" strip.
- **Grocery list** — auto-built from out / expired / low-stock items, editable,
  and shareable.

Still ahead: user accounts, recipe filters, and expiration alerts (see
[Roadmap](#roadmap)).

## Screens

| Screen | Description |
|--------|-------------|
| **Home** | Greeting, a soon-to-expire alert banner, + entry points: Inventory, Scan, Recipes, Grocery List |
| **Inventory** | Ingredients grouped by Proteins / Vegetables / Carbs / Seasonings, with search, freshness dots, abundance meters, a "use soon" strip, and a summary line |
| **Ingredient detail** | Status, expiration date, purchase info, and past uses for an item |
| **Use it up** | Soon-to-expire / expired items to act on — cook with it, mark used up (→ grocery), dismiss, or bundle them all to find recipes that use them |
| **Cuisines** | Grid of cuisines to browse recipes by |
| **Scan** | Live camera capture; sends the receipt to Claude vision to extract groceries |
| **Scan review** | Confirm / uncheck / remove the parsed items before adding them to inventory |
| **Recipes** | Recommended recipes ranked by inventory fit, with "missing ingredient" flags and dietary / time filter chips |
| **Recipe detail** | Ingredients ↔ Directions tabs; per-ingredient indicators (in your kitchen / need to buy / use soon), add missing to grocery, save recipe, update inventory |
| **Grocery List** | Auto-built from out / expired / low-stock items; add/remove custom items, select, and share |
| **Profile** | Avatar and saved recipes |

## Tech stack

- [Expo](https://expo.dev) (React Native) + [Expo Router](https://docs.expo.dev/router/introduction) file-based routing, TypeScript
- State: [Zustand](https://github.com/pmndrs/zustand) persisted to AsyncStorage
- Backend: [Supabase](https://supabase.com) (Postgres + Edge Functions) — optional
- AI: [Claude](https://www.anthropic.com) (Haiku 4.5, vision) for receipt parsing, via an Edge Function
- Recipes: TheMealDB + Spoonacular
- Camera: `expo-camera`
- Fonts: Inria Serif (wordmark / display) + Jost (headings & body)

## Get started

```bash
npm install
npx expo start
```

Then open the app in:

- **Expo Go** on your phone (scan the QR code) — easiest
- an iOS simulator (`i`) or Android emulator (`a`)
- the web build (`w`)

## Backend (optional)

The app persists locally with AsyncStorage and runs fully **without** a backend.
If you add Supabase, state also syncs to a hosted Postgres database (single
shared dataset for now; the schema is user-ready for accounts later).

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
   (Upgrading an older database? It also includes the one-line `alter table`
   to add the `added_on` column used for live expiry dates.)
3. Copy `.env.example` to `.env` and fill in your project URL + anon key
   (Project Settings → API).

On launch the app seeds an empty database, then reads it as the source of
truth and writes through on every change. Without `.env`, it silently falls
back to local-only mode.

### Spoonacular proxy (optional)

The Spoonacular recipe source is reached through a Supabase Edge Function
([`supabase/functions/spoonacular`](./supabase/functions/spoonacular)) so the
API key stays server-side instead of shipping in the client bundle. Deploy it
and set the secret:

```bash
supabase functions deploy spoonacular
supabase secrets set SPOONACULAR_API_KEY=your-key
```

(Or deploy via the dashboard's Edge Functions editor + Secrets.) If it isn't
deployed, the app just uses TheMealDB.

### Receipt scanning (optional)

Receipt scanning runs through a Supabase Edge Function
([`supabase/functions/scan-receipt`](./supabase/functions/scan-receipt)) that
calls Claude (vision). Get an API key from [console.anthropic.com](https://console.anthropic.com),
then deploy the function and set the secret:

```bash
supabase functions deploy scan-receipt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The key stays server-side; the app only ever sends the photo. Without it,
scanning shows a "couldn't scan" message. The model (`claude-haiku-4-5`,
~half a cent/scan) is a one-line swap inside the function.

## Project structure

```
app/                 # Screens (file-based routes)
  index.tsx          # Home
  inventory.tsx
  cuisines.tsx
  recipes.tsx
  profile.tsx
  recipe/[id].tsx    # Recipe detail (ingredients + directions)
  ingredient/[id].tsx
  grocery.tsx        # Grocery list
  scan.tsx           # Camera capture (receipt scanning)
  scan-review.tsx    # Confirm scanned items before adding to inventory
components/           # Shared UI (Screen wrapper, Wordmark)
constants/theme.ts   # Colors, fonts, spacing tokens
data/kitchen.ts      # Seed inventory, recipes, cuisines + grocery-list builder
store/kitchen-store.ts  # Zustand store (AsyncStorage + Supabase sync)
lib/supabase.ts      # Supabase client
lib/api.ts           # Data layer: store shapes <-> Postgres rows
lib/recipes/         # Recipe providers + inventory matcher
  types.ts           #   internal Recipe types + RecipeProvider interface
  match.ts           #   rank recipes by inventory overlap
  themealdb.ts       #   TheMealDB provider
  spoonacular.ts     #   Spoonacular provider (optional, key-gated)
  index.ts           #   recommendRecipes() / recommendByCuisine() / getRecipeDetail()
lib/scan.ts          # Receipt-scan invoke helper + parsed-item -> ingredient
supabase/schema.sql  # Database schema + RLS policies
supabase/functions/spoonacular/   # Edge Function: Spoonacular proxy
supabase/functions/scan-receipt/  # Edge Function: Claude-vision receipt parser
```

## Roadmap

The build is organized around the four key features from the project proposal.

### 1. AI inventory tracking
- [x] Inventory UI grouped by category with freshness + abundance indicators and a "use soon" strip
- [x] Per-ingredient detail (status, expiration, purchase history, past uses)
- [x] Real receipt scanning — camera → Claude vision (Haiku 4.5) extracts & normalizes items → review → inventory
- [x] Expiration alerts — home banner + "use it up" review flow (cook / mark used-up → grocery / dismiss)
- [x] Cook-from-expiring — bundle the expiring items and surface recipes that use them (or "no recipes")
- [x] Live expiry dates — purchase date + per-item shelf-life estimate → days-left computed from today (scanned/added items dated automatically; re-stocking resets the clock)
- [ ] Barcode scanning for single items
- [ ] Push notifications for soon-to-expire items (needs a dev build)

### 2. Recipe recommendations
- [x] Rank recipes by what's actually in inventory (uses-most / missing-fewest)
- [x] Pull recipes from external bases (TheMealDB + Spoonacular), source-agnostic layer
- [x] Recipe list with "missing ingredient" flags + recipe detail
- [x] Browse by cuisine (each cuisine returns on-cuisine recipes, ranked by inventory)
- [x] Filters: dietary needs (vegetarian/vegan), intolerances (gluten/dairy), quick (≤30 min)
- [ ] More filters: craving, additional intolerances, calorie/nutrition targets

### 3. Grocery list generator
- [x] Auto-generated list from out / expired / low-stock items
- [x] Add / remove custom items; select items and share via the native share sheet
- [ ] User-set restock thresholds for staples
- [ ] Fold in ingredients missing from saved/planned recipes
- [ ] Sync custom grocery items to Supabase (currently local-only)

### 4. Personalized experience & AI adaptation
- [x] Profile with saved recipes
- [ ] Learn liked / frequently cooked meals to tune suggestions
- [ ] Customizable alerts, meal-plan notifications, ratings, budgeting
- [ ] Voice-assistant integration (Alexa, Google Assistant)

### Foundations
- [x] Persist inventory, saved recipes, and grocery state (AsyncStorage + zustand)
- [x] Sync to a hosted backend (Supabase / Postgres)
- [ ] User accounts (Supabase Auth) — schema is already user-ready
- [ ] Custom iconography to replace placeholder emoji
