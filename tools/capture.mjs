// Drive the Carlton Finance UI and capture PNGs of each page.
// Not part of the app — ad-hoc tool for the testing report.

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4173/';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const pages = [
  { id: 'dashboard', file: '02-dashboard.png' },
  { id: 'treasury', file: '03-accounts.png' },
  { id: 'transfers', file: '04-transfers.png' },
  { id: 'fx', file: '05-fx-rates.png' },
  { id: 'students', file: '06-students.png' },
  { id: 'programs', file: '07-programs.png' },
  { id: 'payments', file: '08-payments.png' },
  { id: 'expenses', file: '09-expenses.png' },
  { id: 'payroll', file: '10-payroll.png' },
  { id: 'reports', file: '11-reports.png' },
  { id: 'reconciliation', file: '14-reconciliation.png' },
  { id: 'users', file: '12-users.png' },
];

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// 1. Load app, take login screenshot (also already captured via headless chrome, redo for consistency)
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${OUT}/01-login.png` });
console.log('✅ 01-login');

// 2. Sign in with seeded admin/admin123
await page.type('input[placeholder="Enter username"]', 'admin');
await page.type('input[placeholder="Enter password"]', 'admin123');
await Promise.all([
  page.click('button'),
  new Promise(r => setTimeout(r, 800)),
]);

// 3. Tour each nav page
for (const { id, file } of pages) {
  await page.evaluate((id) => {
    const el = document.getElementById(`nav-${id}`);
    if (el) el.click();
  }, id);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`✅ ${file}`);
}

// 4. Forgot-password screen for bonus coverage
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: 'networkidle0' });
// Click Forgot password link
const forgot = await page.$x("//*[contains(text(),'Forgot password')]").catch(() => []);
if (forgot.length) {
  await forgot[0].click();
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/13-forgot-password.png` });
  console.log('✅ 13-forgot-password');
}

await browser.close();
console.log('done');
