# SFI26 Calculator

> Free, mobile-first calculator for the **Sustainable Farming Incentive 2026**.
> Enter your land, pick the actions you want to do, see your estimated annual payment.

🌐 **Live:** https://sfi26-calculator.vercel.app

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What it does

SFI26 has 71 actions across 14 categories, a 25% area cap on 10 of those
actions, a £100,000 annual cap per agreement, and a set of supplemental
actions that must be paired with base actions. This calculator handles
all of that for you in about two minutes:

1. **Eligibility check** — confirms you have ≥ 3 ha and tells you which
   window (June 2026 or September 2026) opens first for you.
2. **Land entry** — add parcels by type (arable, grassland, moorland,
   horticultural, top fruit, rough grazing) plus farm-level features
   (hedgerows, walls, ponds, ditches, traditional buildings,
   organic status, precision farming).
3. **Action selector** — automatically filters the 71 actions down to
   the ones your land is eligible for, with sensible default quantities
   and a live running total.
4. **Results** — annual estimate, 3-year total, full breakdown,
   warnings when caps trigger, and a "money you might be missing"
   section ranking high-value actions you haven't selected.

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- Client-side only — no database. All 71 actions live in
  [`app/data/sfi26-actions.ts`](app/data/sfi26-actions.ts) as typed JSON.
- Hosted on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Project layout

```
app/
├── data/sfi26-actions.ts        # All 71 SFI26 actions
├── lib/
│   ├── types.ts                 # Shared TypeScript types
│   └── calculator.ts            # Eligibility + payment + cap logic
├── calculator/
│   ├── CalculatorFlow.tsx       # 4-step flow controller
│   └── components/              # Eligibility, Land, Actions, Results
├── page.tsx                     # Landing page
└── layout.tsx
```

## Data sources

- **GOV.UK SFI26 publication** (6 May 2026)
- **DEFRA Farming Blog** (8 Jan, 24 Feb, 6 May 2026)
- AHDB, CXCS, Norfolk FWAG, The Andersons Centre stacking summaries

SFI26 scheme data is published under the
[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## Disclaimer

This calculator provides **estimates only** based on published SFI26
payment rates. It is **not financial advice**. Always verify eligibility
and payment amounts with the Rural Payments Agency before submitting
your application.

JR Data Solutions is not affiliated with DEFRA, the RPA, or the UK
Government.

## License

[MIT](LICENSE) © James Riggall / JR Data Solutions.
