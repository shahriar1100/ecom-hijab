# NOOR — homepage phase

A responsive hijab boutique homepage with light and dark themes, built with Next.js App Router, TypeScript and Tailwind CSS. Only `/` is implemented. There are no commerce services, other pages, API routes, authentication, payments or deployment configuration.

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

With the local server running, `npm run check:ui` checks widths 320, 360, 390, 768, 834, 1024, 1200 and 1440px in both themes using headless Chrome. It checks overflow, section order, images, grids, footer visibility, bottom-navigation clearance, search, feedback and axe accessibility rules. It also verifies theme persistence, system preference changes, cross-tab synchronization, keyboard toggling and blocked browser storage. Full-page and footer screenshots plus a JSON report are saved in the ignored `output/qa/` folder. The check uses an installed Google Chrome browser; set `PREVIEW_URL` if your server is not at http://localhost:3000.

See [verification results and known demo limitations](docs/verification.md).

## Editing the homepage

- `src/data/store.ts`: typed demo products, prices in BDT, stories, categories, image paths, navigation, demo contacts and the static sale timer.
- `src/types/store.ts`: shared data types.
- `src/components/home/`: homepage sections; `product/`: reusable product card; `layout/`: header, footer and bottom navigation.
- `src/app/globals.css`: brand tokens, layout and responsive styling. The main breakpoints are 768px (tablet), 1024px (desktop), and 1200px (expanded desktop search).
- `public/images/`: optimized local WebP placeholder photos. Replace these files or update the paths and alt text in `store.ts`. Use a wide hero photo with space for text on the left, square portraits, folded fabrics, circular-crop-friendly fabric photos, and an accessories flatlay. The original reference photographs are still needed for an exact photo match.

The placeholders were generated specifically for this mockup using the built-in image-generation tool. No screenshots or screenshot fragments are used as page content. See [demo image provenance and prompts](docs/demo-images.md).

Additional portrait and folded-fabric prompts are recorded in [the additional image notes](docs/additional-demo-images.md).

For future changes, use supplied or existing images only. Do not generate new images unless explicitly requested. Image references remain centralized for the planned dynamic data source; this phase does not add that backend.

## Preview behaviour

The hero CTA and navigation links scroll to homepage sections. Search accepts local text and explains that search is coming soon. Product, category, story, saved, account, bag, social and other unfinished controls show accessible Coming soon feedback; they do not change inventory or perform commerce actions. The bag count of 3 is a visual demo, and contact details are explicitly marked as placeholders. The sale timer is a **static demo**, not a live deadline.

Stories directly follow the hero. Categories stay in a single compact circular row. New Items and Most Popular scroll horizontally on mobile, then show three tablet cards and four desktop cards. Flash Sale uses three columns on mobile/tablet and six on desktop. Just For You uses 2/3/4 columns; its curated preview contains four cards on mobile/desktop and six on tablet, following the supplied designs. The footer is visible on every device. Mobile/tablet also retain fixed navigation, with safe-area padding below the footer to keep its content accessible.

The header's moon/sun button toggles dark mode. On the first visit, the page follows the device's colour preference; a manual choice is saved in `localStorage` under `noor-theme` and synchronized between tabs. A small head script applies the theme before the first paint. With storage blocked, the toggle still works for the current visit. Theme colours are CSS variables in `globals.css`; existing photographs retain their natural colours.

Static page and section content are Server Components. Client components are limited to interactive buttons, the feedback notice, search, and the theme toggle. The toggle subscribes to browser state with React's [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore); the initial theme follows [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme). System fonts avoid external font requests.

Setup follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) and [Tailwind PostCSS guide](https://tailwindcss.com/docs/installation/using-postcss).
