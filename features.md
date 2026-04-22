# Delta Academy Finance — Feature Catalog

Grouped by navigation section. Every feature runs entirely in the browser against `localStorage`, except password-reset OTP and email-report sending, which go through the Node server.

## 1. Authentication

| Feature             | Behavior                                                                           |
|---------------------|------------------------------------------------------------------------------------|
| Login               | `doLogin()` — username + password checked against LocalStorage `users`             |
| Forgot password     | `doSendOtp()` → `POST /send-otp` → email containing 6-digit OTP                    |
| OTP verification    | `doVerifyOtp()` → `POST /verify-otp`; on success, user may set a new password      |
| Logout              | `doLogout()` — clears session key, returns to login screen                         |
| Session persistence | LocalStorage key (no JWT, no server-side session)                                  |

## 2. Dashboard

Read-only summary tiles — no mutations.

- Total revenue, total expenses, net profit, total payroll
- Currency toggle: AED / USD / INR (uses `settings.rates`)
- Recent activity preview

## 3. Treasury Accounts

CRUD for four account types: **Bank**, **PSP**, **Cash**, **Exchanger**.

| Action         | Function              |
|----------------|-----------------------|
| Add account    | `saveAccount('')`     |
| Edit account   | `saveAccount(id)`     |
| Delete account | `confirmDelete('account', id)` |

Each account has: name, type, currency, balance, optional PSP fee %.

## 4. Internal Transfers

Record funds moving between accounts. Applies an FX rate and writes converted amount to the destination account; both balances update atomically in LocalStorage.

- `saveTransfer()` — create transfer
- `confirmDelete('transfer', id)` — delete transfer; reverses both balances

## 5. FX Rates

Single settings form: USD→AED, USD→INR. Used for every conversion across the app.

- `saveFX()`
- `setCur('AED'|'USD'|'INR')` — switch display currency globally

## 6. Students

Enrollment and fee tracking.

| Action  | Function                   |
|---------|----------------------------|
| Create  | `saveStudent('')`          |
| Update  | `saveStudent(id)`          |
| Delete  | `confirmDelete('student', id)` |

Student record ties to a program, a per-student fee, and currency.

## 7. Programs

Course/training programs with capacity tracking.

- Fields: name, fee, currency, schedule, capacity
- `saveProgram('')`, `saveProgram(id)`, `confirmDelete('program', id)`

## 8. Payments

Record student fee payments, upload proof, generate invoices.

| Action          | Function                        |
|-----------------|---------------------------------|
| Record payment  | `savePayment()` — credits target account |
| Delete payment  | `confirmDelete('payment', id)` — reverses account credit |
| View proof      | `viewProof(id)` — opens base64 image in modal |
| Print invoice   | `generateInvoice(id)` — opens printable invoice |

Proof images are stored base64-encoded in LocalStorage (quota risk — see `mistakes.md`).

## 9. Expenses

Expense logging with category/subcategory and approval workflow.

| Action        | Function                             |
|---------------|--------------------------------------|
| Log expense   | `saveExpense()` — debits account     |
| Delete        | `confirmDelete('expense', id)` — reverses |
| Approve       | `approveExpense(id)` — sets status=approved |
| View proof    | `viewExpenseProof(id)`               |

### Categories & Subcategories

- `addCategory()`, `renameCatPrompt(id)`, `deleteCat(id)`
- `addSubcategory(id)`, `renameSubPrompt(id)`, `deleteSub(id)`
- Categories carry a color marker used in the UI.

## 10. Payroll

Staff directory plus monthly payroll runs.

| Action     | Function                      |
|------------|-------------------------------|
| Add staff  | `saveStaff('')`               |
| Edit staff | `saveStaff(id)`               |
| Delete     | `confirmDelete('staff', id)`  |
| Run payroll| `runPayroll()` — debits account, logs record |

## 11. Reminders

Lists overdue and upcoming student payments. Copy reminder text to clipboard for manual send. (No automatic reminder scheduling.)

## 12. Reports

Filter financial data and export.

| Action              | Function                  |
|---------------------|---------------------------|
| Filtered CSV        | `exportFilteredCSV()`     |
| Statement CSV       | `exportStatementCSV()`    |
| Statement PDF       | `exportStatementPDF()` — browser print dialog |
| Copy report text    | `copyReportText()`        |
| Email report        | `sendEmailReport()` → `POST /send-email` |

## 13. Users (Admin)

Only admin role.

| Action                         | Function                              |
|--------------------------------|---------------------------------------|
| Create user                    | `saveUser('')`                        |
| Update user                    | `saveUser(id)`                        |
| Delete user                    | `confirmDelete('user', id)`           |
| Toggle active                  | `toggleUserActive(id)`                |
| Change password                | `changePassword(id)` — updates hash in LocalStorage |

## 14. Settings

- Academy name
- FX rates (USD→AED, USD→INR)
- Display currency selector

## 15. Reconciliation (manual-only, per-day segregated)

Per-account bank-statement matching.

**Storage shape:** `DB.reconciliations[accountId] = { "YYYY-MM-DD": [rows] }` — each day's rows live in their own bucket (legacy flat arrays are auto-wiped on load).

**UI:** one card per date that has either internal txns or uploaded statement rows. Each card has two columns: **Internal transactions** (left, read-only) and **Statement rows** (right, with per-row Match / Ignore / Unmatch / Delete). A per-day "↑ Upload for this day" button forces every row in the upload into that day's bucket; the global "↑ Upload statement (any day)" lets rows file into their own date.

| Action                        | Function                               |
|-------------------------------|----------------------------------------|
| Upload statement (CSV/TSV)    | `triggerStatementUpload(forDate?)` → `handleStatementUpload()` |
| Parse flexible date formats   | `parseFlexDate()` (ISO, DD/MM/YYYY, DD-Mon-YYYY, native) |
| Manual match a row            | `modalMatchTxn()` → `confirmManualMatch()` |
| Ignore / unmatch / delete row | `ignoreReconRow()` / `unmatchReconRow()` / `deleteReconRow()` |
| Flat iteration helper         | `getAllStmtRows(accountId)` — summary stats, CSV export |
| Bucketed lookup helper        | `findStmtRow(accountId, rowId)` — returns `{ row, date }` |
| Export                        | `exportReconCSV()`                     |

Summary bar shows Account, days with data, matched / unmatched / ignored counts, statement balance vs. internal balance, and a **Difference** tile that turns green when balanced.

**Auto-matching has been removed** — every match is confirmed manually through the row-level `Match` button.

## 16. Scheduled email reports

- `DB.reportSettings = { email, frequency, time, enabled, lastSent }` (LocalStorage)
- `scheduleReportReminder()` wires a 60s-tick interval; when `hh:mm` matches the configured time it fires a browser `Notification`
- "Send now" posts to `POST /send-email` with a plaintext + HTML body built from `buildEmailReportText()`
- "Copy report" puts the same text on the clipboard for manual paste

## 17. Payment & expense proof attachments

- Both `modalAddPayment()` and `modalAddExpense()` have a drag-and-drop file zone (2 MB cap, image/PDF)
- File is read as base64 (`FileReader.readAsDataURL`) and stored on the record
- `viewProof(paymentId)` / `viewExpenseProof(expenseId)` open a lightbox with a download link

## 18. Per-account statement overlay

- Full-screen overlay (`#stmt-overlay`) opened from any treasury-account card
- Date-range + type + search filters; running balance in the right-most column
- `exportStatementCSV()` and `exportStatementPDF()` (browser print dialog)

## 19. Data Sync / Backup

- `GET /db` — download the JSON blob the server has
- `PUT /db` — replace server's JSON blob with current state
- Invoked from functions around `index.html:1595` and `index.html:1604`

**This is the only server-side persistence** — everything else is browser LocalStorage.
