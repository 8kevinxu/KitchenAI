# Virtual Kitchen 🍳

An AI-powered kitchen companion that tracks your ingredient inventory, scans
groceries, and recommends recipes you can actually make with what you have.

This repo currently holds the **initial UI build** — all screens are
implemented and navigable with mock data. Camera scanning, persistence, and AI
recipe suggestions are not wired up yet.

## Screens

| Screen | Description |
|--------|-------------|
| **Home** | Greeting + entry points: Inventory, Scan, Recipes |
| **Inventory** | Ingredients grouped by Proteins / Vegetables / Carbs / Seasonings, with search and `EXPIRED` / `OUT` / `NEW` tags |
| **Ingredient detail** | Status, expiration date, purchase info, and past uses for an item |
| **Cuisines** | Grid of cuisines to browse recipes by |
| **Scan** | Camera-style viewfinder for scanning groceries (mock) |
| **Recipes** | Recommended recipes with "missing ingredient" flags |
| **Recipe detail** | Ingredients ↔ Directions tabs, save recipe, update inventory |
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
components/           # Shared UI (Screen wrapper, Wordmark)
constants/theme.ts   # Colors, fonts, spacing tokens
data/kitchen.ts      # Mock inventory, recipes, cuisines
```

## Roadmap

- [ ] Real camera scanning (expo-camera) + receipt/barcode parsing
- [ ] Persist inventory and saved recipes (local storage / backend)
- [ ] AI recipe suggestions based on current ingredients
- [ ] Custom iconography to replace placeholder emoji
