# Storefront verification

Verified locally on 2026-10-09 with Node.js 22.17, Next.js 16.4, and headless Google Chrome.

## Shop phase

The new route is `/shop`; the homepage's design, photos, section order and product selections are preserved. No new images or dependencies were added. The catalogue has 28 typed local demo products, shared with homepage selections, and all image URLs remain in the data layer. The complete shop browser suite passed against the production build on local port 3100, with no unexpected console or runtime errors.

| Check | Result |
| --- | --- |
| ESLint / TypeScript / production build | Passed; `/` and `/shop` are static routes |
| Responsive shop | 2 mobile, 3 tablet, 4 desktop columns; no page overflow at 320, 360, 390, 768, 834, 1024 or 1440px in either theme |
| Filter presentation | Desktop sidebar; mobile/tablet modal drawer with draft selections, Apply, Clear and cancel |
| Keyboard | Drawer initial focus, Tab/Shift+Tab containment, Escape and focus restoration passed |
| Combined filters | OR within a group, AND across category/fabric/colour/price/search; counts and removable chips passed |
| Search / sort | Fast typing, editing within text, empty-state clearing, header search and all five sort choices passed |
| Load More | 12 → 24 → 28 distinct products, correct completion and reset on filter/sort changes |
| Navigation | All five homepage category links, Shop link, URL reload and Back/Forward passed |
| Images / product controls | Local images load; simulated missing images show the styled fallback; product controls show Coming soon |
| Automated accessibility | No axe WCAG 2 A/AA or 2.1 AA violations at 390, 834 or 1440px in either theme, in the drawer or in the empty state |
| Visual review | Mobile, tablet, desktop and drawer captures inspected in light/dark themes; footer remains clear of mobile navigation |
| Homepage regression | Existing `check:ui` suite passed at all eight widths in both themes after the shared component changes |

Run `npm run check:shop` against a running local server (`PREVIEW_URL` selects a different URL). Shop screenshots and reports are in the ignored `output/shop-qa/` folder. Full-page captures show fixed navigation at the original viewport edge; maximum-scroll measurements verify footer clearance. These are local demo interactions, with no backend, cart, checkout, authentication or product-detail routes.

## Homepage and theme checks

| Check | Result |
| --- | --- |
| ESLint | Passed, no errors or warnings |
| TypeScript (`tsc --noEmit`) | Passed |
| Production build (`next build`) | Passed; homepage prerendered as static content |
| Browser console and runtime errors | None |
| Image loading | All rendered local images loaded |
| Section order | Matches the requested order |
| Page overflow | None at 320, 360, 390, 768, 834, 1024, 1200, or 1440px in either theme |
| Categories | One horizontal circular row at every tested width |
| Just For You | 2 mobile, 3 tablet, 4 desktop columns |
| Flash Sale | 3 mobile/tablet, 6 desktop columns |
| Footer | Visible on every tested screen size; two-column mobile, four-column tablet and five-column desktop layouts |
| Bottom navigation | Hidden on desktop; more than 26px clearance below the footer content on mobile/tablet at maximum scroll |
| Dark mode | Header toggle works in both themes; preference persists after reload, follows system changes before manual selection, and synchronizes across tabs |
| Theme resilience | Keyboard toggling and blocked-storage behaviour passed; no hydration or runtime errors |
| Interactions | CTA scroll, Coming soon feedback, dismissal, search input and feedback, Escape and search focus restoration passed |
| Automated accessibility | No axe WCAG 2 A/AA or 2.1 AA violations in either theme at 390, 834, or 1440px; mobile search dialog also checked in both themes |
| Visual review | Light and dark homepage/footer captures inspected, including mobile footer clearance |

Raw reports and screenshots are in the ignored local `output/qa/` folder. Full-page screenshots show the fixed bottom navigation at the original viewport edge; separate footer screenshots and clearance measurements verify that all footer content is reachable and visible above the navigation.

The 15 pre-existing local placeholder photos are unchanged in the footer/theme update. No new pictures were created; future work must use provided or existing images unless image generation is explicitly requested. Prices, bag count, static sale countdown and contacts are demo data.

The production dependency audit is clean. npm currently reports five advisory entries in the development-only Next ESLint dependency chain (`braces` / `micromatch` / `fast-glob`); npm's suggested fix would downgrade Next's lint configuration across major versions and was not applied. ESLint 9 is retained to satisfy the current Next lint plugins' peer ranges.
