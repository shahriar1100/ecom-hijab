# NOOR — homepage phase

A responsive, light-themed hijab boutique homepage built with Next.js App Router, TypeScript and Tailwind CSS. Only `/` is implemented. There are no commerce services, other pages, API routes, authentication, payments or deployment configuration.

## Run locally

Use Node.js 22.13 or newer and npm:

```sh
npm install
npm run dev
```

Open http://localhost:3000. On this Windows machine, PowerShell blocks `npm.ps1`; use `npm.cmd install` and `npm.cmd run dev` instead. This does not require changing the execution policy.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

With the local server running, `npm run check:ui` checks widths 360, 390, 768, 834, 1024 and 1440px in headless Chrome. It checks page overflow, section order, image loading, category rows, grid columns, bottom-navigation clearance, search, Coming soon feedback, and axe accessibility rules. It saves three full-page screenshots and a JSON report in the ignored `output/qa/` folder. The check uses an installed Google Chrome browser; set `PREVIEW_URL` if your server is not at http://localhost:3000.

See [verification results and known demo limitations](docs/verification.md).

## Editing the homepage

- `src/data/store.ts`: typed demo products, prices in BDT, stories, categories, image paths, navigation, demo contacts and the static sale timer.
- `src/types/store.ts`: shared data types.
- `src/components/home/`: homepage sections; `product/`: reusable product card; `layout/`: header, footer and bottom navigation.
- `src/app/globals.css`: brand tokens, layout and responsive styling. The main breakpoints are 768px (tablet), 1024px (desktop), and 1200px (expanded desktop search).
- `public/images/`: optimized local WebP placeholder photos. Replace these files or update the paths and alt text in `store.ts`. Use a wide hero photo with space for text on the left, square portraits, folded fabrics, circular-crop-friendly fabric photos, and an accessories flatlay. The original reference photographs are still needed for an exact photo match.

The placeholders were generated specifically for this mockup using the built-in image-generation tool. No screenshots or screenshot fragments are used as page content. See [demo image provenance and prompts](docs/demo-images.md).

Additional portrait and folded-fabric prompts are recorded in [the additional image notes](docs/additional-demo-images.md).

## Preview behaviour

The hero CTA and navigation links scroll to homepage sections. Search accepts local text and explains that search is coming soon. Product, category, story, saved, account, bag, social and other unfinished controls show accessible Coming soon feedback; they do not change inventory or perform commerce actions. The bag count of 3 is a visual demo, and contact details are explicitly marked as placeholders. The sale timer is a **static demo**, not a live deadline.

Stories directly follow the hero. Categories stay in a single compact circular row. New Items and Most Popular scroll horizontally on mobile, then show three tablet cards and four desktop cards. Flash Sale uses three columns on mobile/tablet and six on desktop. Just For You uses 2/3/4 columns; its curated preview contains four cards on mobile/desktop and six on tablet, following the supplied designs. The desktop footer is replaced by fixed navigation on mobile/tablet, with safe-area and page-bottom padding.

Static page and section content are Server Components. Client components are limited to interactive buttons, the feedback notice, and search. System fonts avoid external font requests.

Setup follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind PostCSS guide](https://tailwindcss.com/docs/installation/using-postcss).
