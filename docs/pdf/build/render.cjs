const { chromium } = require("/root/.npm/_npx/9833c18b2d85bc59/node_modules/playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: "/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("file://" + __dirname + "/eazystock.html", { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: "" + __dirname + "/../EazyStock-que-es.pdf", format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
  // preview PNGs of each page
  await page.emulateMedia({ media: "screen" });
  const pages = await page.locator("section.page").count();
  for (let i = 0; i < pages; i++) await page.locator("section.page").nth(i).screenshot({ path: `${__dirname}/preview-${i + 1}.png` });
  console.log("pages", pages);
  await browser.close();
})();
