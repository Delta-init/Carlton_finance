import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: 'networkidle0' });
const clicked = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(
    n => n.childNodes.length === 1 && n.textContent?.trim() === 'Forgot password?'
  );
  if (el) { el.click(); return true; }
  return false;
});
console.log('forgot clicked:', clicked);
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: 'screenshots/13-forgot-password.png' });
await browser.close();
console.log('done');
