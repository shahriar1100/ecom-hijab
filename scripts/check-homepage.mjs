import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = process.env.PREVIEW_URL || "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const output = new URL("../output/qa/", import.meta.url);
await mkdir(output, { recursive: true });
const reports = [];
const errors = [];

try {
  for (const width of [360, 390, 768, 834, 1024, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${width}px: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${width}px: ${message.text()}`); });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1, name: "Everyday Elegance" }).waitFor();

    // Walk the page so the real lazy-loaded photographs are included in screenshots.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    });
    await page.waitForFunction(() => Array.from(document.images).every((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width === 0 || rect.right <= 0 || rect.left >= innerWidth || (image.complete && image.naturalWidth > 0);
    }), { timeout: 30000 });

    const layout = await page.evaluate(() => {
      const columns = (selector) => getComputedStyle(document.querySelector(selector)).gridTemplateColumns.split(" ").length;
      const nav = document.querySelector(".mobile-bottom-nav");
      const cards = Array.from(document.querySelectorAll(".for-you-grid .product-card")).filter((card) => card.getBoundingClientRect().width > 0);
      const lastCard = cards.at(-1).getBoundingClientRect();
      const categoryYs = Array.from(document.querySelectorAll(".category-item")).map((item) => Math.round(item.getBoundingClientRect().top));
      return {
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        recommendationColumns: columns(".for-you-grid"),
        saleColumns: columns(".sale-grid"),
        categoryRows: new Set(categoryYs).size,
        navVisible: getComputedStyle(nav).display !== "none",
        navClearance: nav.getBoundingClientRect().top - lastCard.bottom,
        sections: Array.from(document.querySelectorAll("main > section")).map((section) => section.getAttribute("aria-label") || section.querySelector("h1, h2")?.textContent),
      };
    });
    assert.ok(layout.documentWidth <= width, `Page overflow at ${width}px: ${layout.documentWidth}px`);
    assert.equal(layout.recommendationColumns, width < 768 ? 2 : width < 1024 ? 3 : 4);
    assert.equal(layout.saleColumns, width < 1024 ? 3 : 6);
    assert.equal(layout.categoryRows, 1, "Categories must remain one row");
    assert.equal(layout.navVisible, width < 1024);
    if (width < 1024) assert.ok(layout.navClearance >= 12, `Bottom navigation overlaps at ${width}px`);
    assert.deepEqual(layout.sections, ["EverydayElegance", "NOOR stories", "Categories", "Top Products", "New Items", "Flash Sale", "Most Popular", "Just For You"]);

    await page.evaluate(() => window.scrollTo(0, 0));
    if ([390, 834, 1440].includes(width)) {
      await page.screenshot({ path: fileURLToPath(new URL(`homepage-${width}.png`, output)), fullPage: true });
      const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const violations = accessibility.violations.map((violation) => ({ id: violation.id, impact: violation.impact, description: violation.description, targets: violation.nodes.map((node) => node.target) }));
      reports.push({ ...layout, accessibilityViolations: violations });
      assert.deepEqual(violations, [], `Accessibility issues at ${width}px: ${JSON.stringify(violations)}`);
    } else reports.push(layout);

    await page.getByRole("link", { name: "Explore Collection", exact: true }).click();
    assert.equal(new URL(page.url()).hash, "#new-items");
    await page.getByRole("button", { name: "See all new items — Coming soon", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Coming soon" }).waitFor();
    await page.getByRole("button", { name: "Dismiss notification" }).click();

    if (width < 1200) {
      await page.getByRole("button", { name: "Open search", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: "Search hijabs, colors or styles" }).fill("olive");
      await dialog.getByRole("button", { name: "Submit search" }).click();
      await dialog.getByRole("status").filter({ hasText: "Coming soon" }).waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), false);
      assert.equal(await page.getByRole("button", { name: "Open search", exact: true }).evaluate((button) => button === document.activeElement), true);
    } else {
      await page.getByRole("textbox", { name: "Search hijabs", exact: true }).fill("olive");
      await page.getByRole("textbox", { name: "Search hijabs", exact: true }).press("Enter");
      await page.getByRole("status").filter({ hasText: "Coming soon" }).waitFor();
    }

    console.log(`PASS ${width}px: no overflow; ${layout.recommendationColumns} recommendation columns; ${layout.saleColumns} sale columns; images and interactions OK`);
    await context.close();
  }
  assert.deepEqual(errors, [], "Browser errors detected");
  console.log("All responsive, accessibility and interaction checks passed.");
} finally {
  await writeFile(new URL("report.json", output), JSON.stringify({ reports, errors }, null, 2));
  await browser.close();
}
