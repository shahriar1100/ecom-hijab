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
| Page overflow | None at 360, 390, 768, 834, 1024, or 1440px |
| Categories | One horizontal circular row at every tested width |
| Just For You | 2 mobile, 3 tablet, 4 desktop columns |
| Flash Sale | 3 mobile/tablet, 6 desktop columns |
| Bottom navigation | Hidden on desktop; about 29px clearance below the last card on mobile/tablet at maximum scroll |
| Interactions | CTA scroll, Coming soon feedback, dismissal, search input and feedback, Escape and search focus restoration passed |
| Automated accessibility | No axe WCAG 2 A/AA or 2.1 AA violations at 390, 834, or 1440px |
| Visual review | Full-page mobile, tablet and desktop captures reviewed against the supplied references |

Raw reports and screenshots are in the ignored local `output/qa/` folder. Full-page screenshots show the fixed bottom navigation at the original viewport edge; clearance is also checked at maximum scroll, where the final card remains completely visible.

The original product photos were not supplied separately. The 15 local AI-generated photos are documented replacements, so photo fidelity is approximate. Prices, bag count, static sale countdown and contacts are demo data.

The production dependency audit is clean. npm currently reports five advisory entries in the development-only Next ESLint dependency chain (`braces` / `micromatch` / `fast-glob`); npm's suggested fix would downgrade Next's lint configuration across major versions and was not applied. ESLint 9 is retained to satisfy the current Next lint plugins' peer ranges.
