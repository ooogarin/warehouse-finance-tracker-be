# USER FLOWS & PAGE SPECIFICATIONS

## TABLE OF CONTENTS

1. [Onboarding Flow](#1-onboarding-flow)
2. [Authentication](#2-authentication)
3. [Suppliers Management](#3-suppliers-management)
4. [Purchase Orders](#4-purchase-orders)
5. [Stock Management](#5-stock-management)
6. [Cash Management](#6-cash-management)
7. [Debt Management](#7-debt-management)
8. [Dashboard](#8-dashboard)
9. [Reports & Analytics](#9-reports--analytics)
10. [Settings](#10-settings)

---

## 1. ONBOARDING FLOW

### Step 1: Register / Sign Up

**User Goal:** Create account baru

**Form Fields:**

- [ ] Full Name (text input, required)
- [ ] Email (email input, required, unique)
- [ ] Password (password input, required, min 8 chars)
- [ ] Confirm Password (password input, required)
- [ ] Business Phone (tel input, optional)
- [ ] Terms & Conditions checkbox (required)

**Actions:**

- [ ] Submit button → Create account
- [ ] "Already have account?" link → Redirect to Login

**Validation:**

- Email format valid
- Password min 8 characters
- Password & confirm password match
- Terms accepted

**Success State:**

- Account created
- Auto login
- Redirect to Onboarding Step 2

---

### Step 2: Setup Resto Profile

**User Goal:** Input data resto/bisnis

**Form Fields:**

- [ ] Resto Name (text input, required)
- [ ] Business Type (dropdown: restaurant, cafe, catering, other)
- [ ] Address (textarea, optional)
- [ ] Phone (tel input, optional)
- [ ] Operating Hours (time range picker, optional)
- [ ] Logo Upload (image upload, optional)

**Actions:**

- [ ] Save & Continue → Step 3
- [ ] Skip → Step 3

**Display:**

- Show resto info preview

**Success State:**

- Resto created
- Navigate to Step 3

---

### Step 3: Initial Cash Balance

**User Goal:** Set starting cash balance

**Form Fields:**

- [ ] Starting Cash Balance (number input, required, min 0)
- [ ] Currency (dropdown: IDR, USD, etc - default: IDR)

**Actions:**

- [ ] Set Balance → Confirm
- [ ] Skip (use 0) → Continue

**Display:**

- Show balance preview
- Confirmation: "Your starting balance is Rp XXX"

**Success State:**

- Balance saved
- Navigate to Step 4

---

### Step 4: Add First Supplier (Optional)

**User Goal:** Add initial suppliers

**Display:**

- List of common suppliers (Toko A, Toko B, Toko C, etc)
- [ ] Add Custom Supplier option

**Form Fields (if add custom):**

- [ ] Supplier Name (text input, required)
- [ ] Phone (tel input, optional)
- [ ] Address (textarea, optional)

**Actions:**

- [ ] Select supplier → Add
- [ ] Add Multiple → Keep adding
- [ ] Skip → Finish onboarding

**List Display:**

- Show added suppliers
- Remove button for each

**Success State:**

- Suppliers added
- Complete onboarding
- Navigate to Dashboard

---

## 2. AUTHENTICATION

### Login Page

**User Goal:** Access aplikasi dengan existing account

**Form Fields:**

- [ ] Email (email input, required)
- [ ] Password (password input, required)
- [ ] Remember Me (checkbox, optional)

**Actions:**

- [ ] Login button → Authenticate
- [ ] Forgot Password link → Password reset flow
- [ ] Sign Up link → Redirect to register

**Validation:**

- Email format
- Password not empty

**Success State:**

- Login successful
- Store JWT token
- Redirect to Dashboard

**Error State:**

- Show error message: "Invalid email or password"

---

### Forgot Password

**User Goal:** Reset password if forgotten

**Step 1: Enter Email**

- [ ] Email input (required)
- [ ] Submit button → Send reset link

**Step 2: Check Email**

- Display message: "Check your email for reset link"
- Countdown timer (5 minutes)

**Step 3: Reset Password (from email link)**

- [ ] New Password (password input)
- [ ] Confirm Password (password input)
- [ ] Submit button → Save new password

**Success State:**

- Password reset successful
- Redirect to Login

---

## 3. SUPPLIERS MANAGEMENT

### Suppliers List Page

**User Goal:** View semua suppliers

**Display:**

- [ ] Search bar (search by name, phone)
- [ ] Filter options (sort by: name, phone, recent)
- [ ] Add New Supplier button (+ icon)

**Suppliers List:**

- [ ] Supplier Card with:
  - Name (bold)
  - Phone (if available)
  - Address (if available)
  - Last Order Date (if exist)
  - Action buttons: Edit, Delete, WhatsApp

**Actions:**

- [ ] Click on supplier → Open detail page
- [ ] Edit button → Open edit form
- [ ] Delete button → Confirm delete (soft delete)
- [ ] WhatsApp button → Open WhatsApp chat

**Empty State:**

- "No suppliers yet. Add your first supplier!"
- Add Supplier button (prominent)

---

### Add Supplier Page

**User Goal:** Tambah supplier baru

**Form Fields:**

- [ ] Supplier Name (text input, required)
- [ ] Phone (tel input, optional)
- [ ] Address (textarea, optional)
- [ ] Notes (textarea, optional - e.g., "Buka sampai jam 9 malam", "Bisa kredit")

**Actions:**

- [ ] Save Supplier button → Create & redirect to list
- [ ] Cancel button → Back to list

**Validation:**

- Name required & unique
- Phone valid format (if filled)

**Success State:**

- Show toast: "Supplier added successfully"
- Redirect to Suppliers List

---

### Edit Supplier Page

**User Goal:** Update supplier data

**Form Fields:**

- [ ] All fields from Add Supplier (pre-filled)
- [ ] Last Order Info (read-only, for reference)

**Actions:**

- [ ] Save Changes button → Update & redirect
- [ ] Cancel button → Back to list

**Success State:**

- Show toast: "Supplier updated"
- Redirect to Suppliers List

---

## 4. PURCHASE ORDERS

### Purchase Orders List Page

**User Goal:** View semua PO

**Display:**

- [ ] Filter: Status (All, Draft, Confirmed, Received, Cancelled)
- [ ] Filter: Date Range (Today, This Week, This Month, Custom)
- [ ] Search: By supplier name, invoice number
- [ ] Sort: By date (newest first), amount, status

**PO List:**

- [ ] PO Card with:
  - Invoice Number (#PO-001)
  - Supplier Name
  - Amount (Rp XXX)
  - Date
  - Status badge (color coded: draft=gray, confirmed=blue, received=green)
  - Payment status (Paid/Partial/Unpaid)
  - Action buttons: View, Edit, Receive, Cancel

**Actions:**

- [ ] Click on PO → Open detail page
- [ ] View button → Open read-only detail
- [ ] Edit button → Open edit form (if draft)
- [ ] Receive button → Mark as received (modal confirmation)
- [ ] Cancel button → Cancel PO (modal confirmation)

**Empty State:**

- "No purchase orders yet. Create your first order!"

---

### Create Purchase Order Page

**User Goal:** Buat PO baru

**Step 1: Select Supplier**

- [ ] Supplier dropdown (search & select)
- [ ] OR Quick add supplier link

**Step 2: Add Items**

- [ ] Item table with columns:
  - Ingredient name (dropdown or search)
  - Quantity (number input)
  - Unit (dropdown: kg, liter, pcs, dll)
  - Unit Price (number input)
  - Subtotal (auto-calculated, read-only)
  - Action: Remove item

**Actions in Items:**

- [ ] Add Item button → Add new row
- [ ] Remove button → Delete row
- [ ] Change quantity/price → Auto-update subtotal

**Step 3: Summary**

- [ ] Total Amount (read-only, auto-calculated)
- [ ] Payment Options:
  - [ ] Bayar Tunai (full cash payment)
  - [ ] Bayar Sebagian (partial + hutang)
  - [ ] Hutang (full credit)

**If Bayar Tunai:**

- [ ] Payment Amount input (pre-filled with total)
- [ ] Confirm payment

**If Bayar Sebagian:**

- [ ] Amount to Pay (number input)
- [ ] Amount as Debt (auto-calculated)
- [ ] Due Date (date picker, optional)

**If Hutang:**

- [ ] Due Date (date picker, optional)

**Step 4: Confirmation**

- [ ] Review all details
- [ ] Notes field (optional)
- [ ] Create PO button → Submit
- [ ] Cancel button → Back

**Success State:**

- Show toast: "Purchase order created successfully"
- Redirect to PO List
- If paid: Update cash balance
- Stock automatically increased

---

### PO Detail Page

**User Goal:** Lihat detail PO

**Display - Header:**

- [ ] Invoice Number
- [ ] Supplier Name (link to supplier)
- [ ] Status badge
- [ ] Date

**Display - Items Table:**

- [ ] Ingredient name
- [ ] Quantity
- [ ] Unit Price
- [ ] Subtotal
- [ ] (all read-only)

**Display - Summary:**

- [ ] Total Amount
- [ ] Payment Status (Paid, Partial, Unpaid)
- [ ] Paid Amount
- [ ] Remaining Debt (if any)
- [ ] Due Date (if hutang)

**Display - Payment History:**

- [ ] Table: Date, Amount, Method, Reference
- [ ] If unpaid: Show "Pay Remaining" button

**Actions:**

- [ ] Pay Remaining button (if unpaid) → Payment modal
- [ ] Edit button (if draft) → Go to edit page
- [ ] Receive button (if confirmed) → Modal confirmation
- [ ] Cancel button (if not received) → Modal confirmation
- [ ] Back button → Go to PO List

---

## 5. STOCK MANAGEMENT

### Stock List Page

**User Goal:** Monitor stok bahan baku

**Display - Top Section:**

- [ ] Filter: Category (All, Vegetables, Meat, Seafood, etc)
- [ ] Filter: Status (All, Normal, Low, Critical)
- [ ] Search: By ingredient name
- [ ] Sort: By name, quantity, last updated

**Stock Table:**

- [ ] Ingredient name
- [ ] Category
- [ ] Current Quantity + Unit
- [ ] Min Stock
- [ ] Status badge (color coded):
  - Green = Normal (> min_stock)
  - Yellow = Low (< min_stock)
  - Red = Critical (very low or empty)
- [ ] Last Updated
- [ ] Action buttons: View, Use, Adjust

**Summary Bar:**

- [ ] Total items
- [ ] Items in stock
- [ ] Low stock alerts count
- [ ] Critical alerts count

**Actions:**

- [ ] Click on ingredient → Open detail page
- [ ] Use button → Quick input usage modal
- [ ] Adjust button → Adjustment modal
- [ ] Add Ingredient button (+ icon) → Add new

---

### Add Ingredient Page

**User Goal:** Tambah bahan baku baru

**Form Fields:**

- [ ] Ingredient Name (text input, required)
- [ ] Category (dropdown, required)
- [ ] Base Unit (dropdown: kg, liter, pcs, etc, required)
- [ ] Minimum Stock (number input, required)
- [ ] Current Stock (number input, optional, default 0)
- [ ] Add Multiple Units checkbox

**If Add Multiple Units:**

- [ ] Unit Conversion table:
  - Unit name (dropdown/text)
  - Conversion factor (number - e.g., 1 jerigen = 5 liter)
  - Is Default? (checkbox)

**Actions:**

- [ ] Save Ingredient button → Create & redirect
- [ ] Cancel button → Back to list

**Success State:**

- Show toast: "Ingredient added"
- Redirect to Stock List

---

### Stock Detail Page

**User Goal:** Lihat detail stok & history

**Display - Current Status:**

- [ ] Ingredient name & category
- [ ] Current quantity
- [ ] Min stock level
- [ ] Status indicator (Normal/Low/Critical)
- [ ] Last updated info

**Display - Available Units:**

- [ ] List of units with conversion factors
- [ ] Quantity in each unit (calculated)

**Display - Recent Batches (FIFO):**

- [ ] Table: Purchase Date, Quantity, Cost/Unit, Qty Remaining
- [ ] Oldest batch first (for FIFO calculation)

**Display - Movement History:**

- [ ] Table with columns:
  - Date
  - Type (In/Use/Waste/Adjustment)
  - Quantity
  - Notes
  - Reason (if waste)
- [ ] Filter by type
- [ ] Export to CSV

**Actions:**

- [ ] Use Stock button → Usage modal
- [ ] Report Waste button → Waste modal
- [ ] Adjust Stock button → Adjustment modal
- [ ] Back button → Go to list

---

### Use Stock Modal

**User Goal:** Catat penggunaan bahan

**Form Fields:**

- [ ] Quantity (number input, required)
- [ ] Unit (dropdown, required)
- [ ] Usage Type (dropdown):
  - For cooking
  - For order (select menu)
  - Other (text input)
- [ ] Notes (textarea, optional)

**Actions:**

- [ ] Confirm button → Deduct stock & create log
- [ ] Cancel button → Close modal

**Validation:**

- Quantity > 0
- Quantity <= available stock

**Success State:**

- Show toast: "Stock deducted"
- Update stock display
- Close modal

---

### Report Waste Modal

**User Goal:** Catat barang yang rusak/expired

**Form Fields:**

- [ ] Quantity (number input, required)
- [ ] Unit (dropdown, required)
- [ ] Reason (dropdown, required):
  - Expired/Stale
  - Spilled/Damaged
  - Burnt/Failed cooking
  - Other (text input)
- [ ] Notes (textarea, optional)

**Actions:**

- [ ] Confirm button → Deduct stock as waste & create log
- [ ] Cancel button → Close modal

**Display:**

- Cost impact calculation (Rp XXX wasted)

**Success State:**

- Show toast: "Waste reported"
- Update stock display
- Close modal

---

### Stock Adjustment Modal

**User Goal:** Koreksi stok (inventory opname)

**Form Fields:**

- [ ] Adjustment Type (radio):
  - Add (if counting more than system)
  - Subtract (if counting less than system)
- [ ] Quantity (number input, required)
- [ ] Unit (dropdown, required)
- [ ] Reason (text input, required - e.g., "Monthly inventory opname")

**Display:**

- Current system quantity
- Actual quantity counted (user input)
- Difference (auto-calculated, highlighted if significant)

**Actions:**

- [ ] Confirm Adjustment button → Update stock
- [ ] Cancel button → Close modal

**Success State:**

- Show toast: "Stock adjusted"
- Update stock display
- Close modal

---

## 6. CASH MANAGEMENT

### Cash Dashboard

**User Goal:** Lihat cash flow harian

**Display - Key Metrics (Prominent):**

- [ ] Current Balance (large, color highlight)
- [ ] Today's Cash In (green)
- [ ] Today's Cash Out (red)
- [ ] Net Change Today (green/red)

**Display - Balance History (Chart):**

- [ ] Line chart: Daily balance trend (7-30 days)
- [ ] Hover to see exact amount

**Display - Today's Transactions:**

- [ ] Timeline of transactions (newest first):
  - Type (In/Out)
  - Category
  - Amount
  - Time
  - Who recorded it
- [ ] Total in/out at bottom

**Display - Monthly Summary:**

- [ ] Bar chart: Cash in vs out per week
- [ ] Quick stats: Total in, total out, net profit

**Actions:**

- [ ] Add Cash In button (+ icon, green) → Modal
- [ ] Add Cash Out button (- icon, red) → Modal
- [ ] View Details button → Full transaction list

---

### Add Cash In Modal

**User Goal:** Catat kas masuk

**Form Fields:**

- [ ] Source (dropdown, required):
  - Sales Revenue
  - Capital Injection (owner deposit)
  - Other (text input)
- [ ] Amount (number input, required)
- [ ] Payment Method (dropdown):
  - Cash
  - Transfer
  - Other
- [ ] Notes (textarea, optional)

**Display:**

- Current balance before
- Projected balance after

**Actions:**

- [ ] Save Cash In button → Record & update balance
- [ ] Cancel button → Close modal

**Success State:**

- Show toast: "Cash in recorded"
- Update balance display
- Close modal

---

### Add Cash Out Modal

**User Goal:** Catat kas keluar (non-belanja)

**Form Fields:**

- [ ] Category (dropdown, required):
  - Payment to Supplier (hutang)
  - Gaji Karyawan
  - Listrik/Air/Gas (Utilities)
  - Sewa Tempat (Rent)
  - Maintenance/Perbaikan
  - Ambil Pribadi (Owner withdrawal)
  - Other
- [ ] Amount (number input, required)
- [ ] Description (text input, required)
- [ ] Payment Method (dropdown):
  - Cash
  - Transfer
  - Other
- [ ] Reference Number (text input, optional - for transfers)
- [ ] Notes (textarea, optional)

**Display:**

- Current balance before
- Projected balance after
- Warning if going negative

**Actions:**

- [ ] Save Cash Out button → Record
- [ ] Cancel button → Close modal

**Validation:**

- Amount > 0
- Category selected
- Description filled

**Success State:**

- Show toast: "Cash out recorded"
- Update balance
- Close modal

---

### Cash Report Page

**User Goal:** Lihat laporan kas detail

**Filters:**

- [ ] Date range (Today, This Week, This Month, Custom)
- [ ] Category filter
- [ ] Type filter (In/Out)

**Display - Summary:**

- [ ] Total In (per period)
- [ ] Total Out (per period)
- [ ] Net Balance (per period)
- [ ] Comparison with previous period (% change)

**Display - Category Breakdown:**

- [ ] Pie chart: Spending by category
- [ ] Percentage for each category

**Display - Daily Trend:**

- [ ] Line chart: Daily balance trend
- [ ] Hover for details

**Display - Transaction List:**

- [ ] Table: Date, Category, Type, Amount, Method, Notes
- [ ] Sortable columns
- [ ] Export to CSV/PDF button

--

## 7. DEBT MANAGEMENT

### Debts Dashboard

**User Goal:** Lihat daftar hutang

**Display - Key Metrics:**

- [ ] Total Active Debt (Rp XXX)
- [ ] Debt to Suppliers (Rp XXX)
- [ ] Debt to Owner (Personal withdrawal, Rp XXX)
- [ ] Due This Week (Rp XXX - alert if any)

**Display - Priority Alert:**

- [ ] If any debt overdue: Show big red alert
- [ ] If due today: Show yellow alert
- [ ] List of specific debts with status

**Display - Debts Table:**

- [ ] Creditor (Supplier name or "Owner")
- [ ] Total Amount
- [ ] Paid Amount
- [ ] Remaining
- [ ] Due Date (color: red=overdue, yellow=soon, green=ok)
- [ ] Status (Unpaid, Partial, Paid)
- [ ] Action: Pay, View Details, Edit

**Actions:**

- [ ] Pay button → Open payment modal
- [ ] View Details button → Open debt detail page
- [ ] Edit button → Open edit form (if draft/unpaid)

---

### Debt Detail Page

**User Goal:** Lihat detail hutang & history pembayaran

**Display - Debt Info:**

- [ ] Creditor (Supplier or Owner)
- [ ] Total Amount
- [ ] Paid Amount
- [ ] Remaining
- [ ] Status badge
- [ ] Debt Date
- [ ] Due Date (if set)
- [ ] Days overdue (if applicable, red)

**Display - Related Info:**

- [ ] If supplier debt: Link to supplier detail
- [ ] If from PO: Link to PO detail
- [ ] Original invoice/reference info

**Display - Payment History:**

- [ ] Table: Date, Amount, Method, Reference, Notes
- [ ] Sort by date (newest first)

**Actions:**

- [ ] Pay Remaining button (if not fully paid) → Payment modal
- [ ] Edit button (if not paid) → Edit form
- [ ] Back button → Back to debts list

---

### Payment Modal

**User Goal:** Catat pembayaran hutang

**Form Fields:**

- [ ] Amount to Pay (number input, required)
  - Pre-fill with remaining amount
  - Validate: <= remaining amount
- [ ] Payment Method (dropdown, required):
  - Cash
  - Transfer
  - Other
- [ ] Reference Number (text input, optional - for transfers)
- [ ] Payment Date (date picker, required, default today)
- [ ] Notes (textarea, optional)

**Display:**

- Remaining before
- Remaining after
- Status change (e.g., "Partial" → "Paid")

**Actions:**

- [ ] Confirm Payment button → Record payment
- [ ] Cancel button → Close modal

**Success State:**

- Show toast: "Payment recorded"
- Update debt display
- If paid in full: Show "Debt Paid!" message
- Close modal

---

## 8. DASHBOARD

### Main Dashboard

**User Goal:** Overview kasir dan stok

**Top Section - Key Metrics:**

- [ ] Current Cash Balance (Rp XXX) - highlight with color
- [ ] Cash In Today (Rp XXX - green)
- [ ] Cash Out Today (Rp XXX - red)
- [ ] Net Balance Today (Rp XXX)

**Middle Section - Alerts & Notices:**

- [ ] Low Stock Alert (list items < min_stock)
- [ ] Due Debts (hutang yang jatuh tempo)
- [ ] Pending Purchase Orders (PO yang belum diterima)

**Actions in Alerts:**

- [ ] "View Stock" → Redirect to Stock page
- [ ] "Pay Now" → Redirect to Debt page
- [ ] "Receive PO" → Redirect to PO page

**Bottom Section - Charts/Graphs:**

- [ ] Cash Flow (Hari ini) - Bar chart (In vs Out)
- [ ] Top Spending Categories - Pie chart
- [ ] Stock Movement - Line chart (trend)

**Sidebar/Navigation:**

- [ ] Dashboard (active)
- [ ] Suppliers
- [ ] Purchase Orders
- [ ] Stock
- [ ] Cash
- [ ] Debts
- [ ] Reports
- [ ] Settings
- [ ] Logout

**Mobile Responsive:**

- Stack vertically
- Full-width cards
- Bottom navigation tabs

---

## 9. REPORTS & ANALYTICS

### Monthly Financial Summary

**User Goal:** Lihat laporan keuangan bulanan

**Display - Key Metrics:**

- [ ] Total Revenue (Rp XXX)
- [ ] Total Expenses (Rp XXX)
- [ ] Net Profit (Rp XXX)
- [ ] Profit Margin %

**Display - Expense Breakdown:**

- [ ] Pie chart: By category
  - Purchase of goods
  - Salary
  - Utilities
  - Rent
  - Maintenance
  - Owner withdrawal
  - Other
- [ ] Table: Category, Amount, % of total

**Display - Spending Trends:**

- [ ] Line chart: Daily balance trend (whole month)
- [ ] Bar chart: Week vs week comparison

**Display - Month Comparison:**

- [ ] Compare with previous month (% change)
- [ ] Key insights (e.g., "Spending up 10% due to...")

**Download:**

- [ ] Export to PDF button
- [ ] Export to Excel button

---

### Stock Report

**User Goal:** Lihat laporan stok & waste

**Display - Top Waste Items (This Month):**

- [ ] Table: Ingredient, Quantity Wasted, Cost (Rp), %
- [ ] Bar chart: Top 5 waste items
- [ ] Insights: "Tomat 40% wasted, recommend buying less"

**Display - Stock Value:**

- [ ] Total inventory value (Rp XXX)
- [ ] Value by category
- [ ] Items with lowest/highest value

**Display - Turnover Rate:**

- [ ] Ingredients by usage frequency (high/medium/low)
- [ ] Reorder recommendations

**Display - Min Stock Breaches:**

- [ ] How many times each ingredient went below min stock
- [ ] Days out of stock

---

### Supplier Performance

**User Goal:** Analisis supplier

**Display - By Supplier:**

- [ ] Total orders
- [ ] Total amount spent
- [ ] Last order date
- [ ] Payment status (on time vs late)
- [ ] Average lead time

**Display - Price Comparison:**

- [ ] For popular items: Which supplier is cheapest
- [ ] Price trends over time
- [ ] Recommendation: "Better supplier for X"

**Download:**

- [ ] Export to PDF button

---

## 10. SETTINGS

### Account Settings

**User Goal:** Manage profile & account

**Display:**

- [ ] Full Name (editable text input)
- [ ] Email (read-only, show as reference)
- [ ] Phone (editable tel input)
- [ ] Profile Picture (upload)
- [ ] Change Password button (link)
- [ ] Logout button (red, prominent)

**Actions:**

- [ ] Edit fields → Save button
- [ ] Change Password → Modal/page
- [ ] Logout → Confirm & redirect to login

---

### Restaurant Settings

**User Goal:** Manage resto configuration

**Display:**

- [ ] Resto Name (editable)
- [ ] Business Type (editable dropdown)
- [ ] Address (editable textarea)
- [ ] Phone (editable)
- [ ] Operating Hours (editable time range)
- [ ] Logo (upload/change)

**Actions:**

- [ ] Edit → Save button
- [ ] Delete Resto button (red, with confirmation)

---

### Preferences

**User Goal:** Set app preferences

**Display:**

- [ ] Currency (dropdown: IDR, USD, etc)
- [ ] Language (dropdown: Indonesian, English)
- [ ] Theme (Light/Dark mode toggle)
- [ ] Date Format (dropdown)
- [ ] Notifications (toggles):
  - Low stock alerts
  - Debt reminders
  - Daily summary email

**Actions:**

- [ ] Each setting change → Auto-save with toast

---

**Version:** 1.0

---
