import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await page.type('input[placeholder="Enter username"]', 'admin');
await page.type('input[placeholder="Enter password"]', 'admin123');
await Promise.all([ page.click('button'), new Promise(r=>setTimeout(r,800)) ]);
// Click reconciliation
const clicked = await page.evaluate(()=>{
  const el = document.getElementById('nav-reconciliation');
  if(el){ el.click(); return true; }
  return false;
});
console.log('recon nav clicked:', clicked);
await new Promise(r=>setTimeout(r,700));
await page.screenshot({ path: 'screenshots/14-reconciliation.png' });
const errs = await page.evaluate(()=> window.__errs || []);
console.log('errors:', errs.length);
await browser.close();
console.log('done');
