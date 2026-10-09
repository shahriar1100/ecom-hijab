# Homepage verification

Verified locally on 2026-10-09 with Node.js 22.17, Next.js 16.4, and headless Google Chrome.

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
