# Virtual Kitchen 🍳

An AI-powered system for kitchen inventory management and meal planning. Instead
of manually maintaining a pantry list or guessing what to cook, Virtual Kitchen
tracks what you have by scanning grocery receipts, recommends recipes based on
your actual ingredients, and flags items that are missing or expiring — reducing
food waste, easing meal planning, and saving money.

It's aimed at busy individuals and families, students and young professionals
living independently, and people with dietary restrictions who need the right
ingredients on hand.

This repo currently holds the **initial UI build** — all screens are
implemented and navigable with mock data. Receipt scanning, persistence, and AI
recipe suggestions are not wired up yet (see [Roadmap](#roadmap)).

## Screens

| Screen | Description |
|--------|-------------|
| **Home** | Greeting + entry points: Inventory, Scan, Recipes, Grocery List |
| **Inventory** | Ingredients grouped by Proteins / Vegetables / Carbs / Seasonings, with search and `EXPIRED` / `OUT` / `NEW` tags |
| **Ingredient detail** | Status, expiration date, purchase info, and past uses for an item |
| **Cuisines** | Grid of cuisines to browse recipes by |
| **Scan** | Camera-style viewfinder for scanning grocery receipts (mock) |
| **Recipes** | Recommended recipes with "missing ingredient" flags |
| **Recipe detail** | Ingredients ↔ Directions tabs, save recipe, update inventory |
| **Grocery List** | Auto-generated shopping list of out / expired / low-stock items |
| **Profile** | Avatar and saved recipes |

## Tech stack

- [Expo](https://expo.dev) (React Native) with [Expo Router](https://docs.expo.dev/router/introduction) file-based routing
- TypeScript
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

## Project structure

```
app/                 # Screens (file-based routes)
  index.tsx          # Home
  inventory.tsx
  cuisines.tsx
  recipes.tsx
  scan.tsx
  profile.tsx
  recipe/[id].tsx    # Recipe detail (ingredients + directions)
  ingredient/[id].tsx
  grocery.tsx        # Grocery list
components/           # Shared UI (Screen wrapper, Wordmark)
constants/theme.ts   # Colors, fonts, spacing tokens
data/kitchen.ts      # Mock inventory, recipes, cuisines + grocery-list builder
```

## Roadmap

The build is organized around the four key features from the project proposal.
Current status reflects the UI-only milestone.

### 1. AI inventory tracking
- [x] Inventory UI grouped by category with `OUT` / `EXPIRED` / `NEW` tags
- [x] Per-ingredient detail (status, expiration, purchase history, past uses)
- [ ] Real receipt scanning (expo-camera) + OCR/barcode parsing → automatic updates
- [ ] Shelf-life estimation and soon-to-expire alerts

### 2. Recipe recommendations
- [x] Recipe list with "missing ingredient" flags + recipe detail
- [x] Browse by cuisine
- [ ] Rank recipes by what's actually in inventory (maximize use of on-hand items)
- [ ] Filters: dietary needs, cuisine, craving, meal complexity

### 3. Grocery list generator
- [x] Auto-generated list from out / expired / low-stock items
- [ ] User-set restock thresholds for staples
- [ ] Fold in ingredients missing from saved/planned recipes
- [ ] Share / export list

### 4. Personalized experience & AI adaptation
- [x] Profile with saved recipes
- [ ] Learn liked / frequently cooked meals to tune suggestions
- [ ] Customizable alerts, meal-plan notifications, ratings, budgeting
- [ ] Voice-assistant integration (Alexa, Google Assistant)

### Foundations
- [x] Persist inventory, saved recipes, and grocery state (AsyncStorage + zustand)
- [ ] Sync to a backend / account
- [ ] Custom iconography to replace placeholder emoji
