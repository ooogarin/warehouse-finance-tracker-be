# Screen List — Dashboard
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Dashboard only
**Source of Truth:** DATABASE_SCHEMA.md

---

## Conventions

| Simbol | Arti |
|---|---|
| `[R]` | Required — field/action wajib ada |
| `[O]` | Optional — boleh kosong |
| `[RO]` | Read-only — tidak bisa diedit user |
| `[AUTO]` | Di-generate otomatis oleh sistem |
| `→ tabel.kolom` | Data disimpan ke kolom ini di schema |

---

## Arsitektur Data

Dashboard adalah halaman **read-only** — tidak ada operasi tulis. Semua data di-derive dari tabel yang sudah ada:

```
merchants.cash_balance            → saldo kas saat ini
cash_logs                         → ringkasan & breakdown kas
ingredients                       → alert stok rendah/habis
stock_usages + stock_usage_items  → top waste
debts                             → alert hutang overdue/jatuh tempo
```

---

## Aturan Bisnis

**Filter periode:**
```
Harian    → data hari ini vs kemarin
Mingguan  → data minggu ini vs minggu lalu
Bulanan   → data bulan ini vs bulan lalu
```

**Perbandingan (% change):**
```
% change = ((periode ini - periode lalu) / periode lalu) × 100
Positif → naik (hijau untuk kas masuk, merah untuk pengeluaran)
Negatif → turun (merah untuk kas masuk, hijau untuk pengeluaran)
```

**Alert stok:**
```
stock_quantity = 0           → Habis (merah)
stock_quantity <= min_stock  → Stok Rendah (kuning)
Hanya ingredient is_active = true
```

**Alert hutang:**
```
due_date < today AND status IN ('unpaid', 'partial')     → Overdue
due_date BETWEEN today AND today+7 AND status != 'paid'  → Jatuh Tempo 7 Hari
```

**Top waste:**
```
Periode: bulan ini (fixed, tidak ikut filter periode kas)
Source: stock_usage_items WHERE stock_usages.type = 'waste'
Sort: SUM(subtotal) DESC
Limit: 5 ingredient teratas
```

---

## SECTION — DASHBOARD

---

### SCR-DSH-01 · Dashboard

**Route:** `/dashboard`
**Akses:** Authenticated
**Default periode:** Harian

#### Components

---

**Filter Periode (global, mempengaruhi Section 1 & 2)**

| Elemen | Type | Behaviour |
|---|---|---|
| Toggle Periode | segmented control | Harian / Mingguan / Bulanan |

---

**Section 1 — Kas**

> Data dari `cash_logs` WHERE `merchant_id` AND `cash_log_date` dalam periode yang dipilih.

**Saldo Kas**
| Elemen | Source |
|---|---|
| Saldo Saat Ini | `merchants.cash_balance` — tampil besar, prominent |

**Ringkasan Kas Periode**
| Elemen | Source |
|---|---|
| Total Masuk | SUM(`amount`) WHERE `flow_type = 'in'` AND periode ini |
| Total Keluar | SUM(`amount`) WHERE `flow_type = 'out'` AND periode ini |
| Selisih (Net) | Total Masuk - Total Keluar |
| % vs periode lalu (Masuk) | derived — hijau jika naik, merah jika turun |
| % vs periode lalu (Keluar) | derived — merah jika naik, hijau jika turun |

---

**Section 2 — Breakdown Pengeluaran**

> Data dari `cash_logs` WHERE `flow_type = 'out'` AND periode yang dipilih.

**Top 3 Kategori Pengeluaran**
| Elemen | Source |
|---|---|
| Nama Kategori | derived label dari `cash_logs.category` |
| Total | SUM(`amount`) per kategori |
| % dari total keluar | derived |

**Breakdown Semua Kategori**

Tampil sebagai list dengan progress bar per kategori:

| Kategori | Total | % |
|---|---|---|
| Belanja Bahan (`purchase_payment`) | Rp [total] | [%] |
| Bayar Hutang Supplier (`debt_payment_out`) | Rp [total] | [%] |
| Gaji (`salary`) | Rp [total] | [%] |
| Utilitas (`utilities`) | Rp [total] | [%] |
| Sewa (`rent`) | Rp [total] | [%] |
| Maintenance (`maintenance`) | Rp [total] | [%] |
| Ambil Pribadi (`owner_withdrawal`) | Rp [total] | [%] |
| Lainnya (`other_out`) | Rp [total] | [%] |

> Hanya tampilkan kategori yang nilainya > 0 pada periode tersebut.

---

**Section 3 — Alert Stok**

> Data dari `ingredients` WHERE `merchant_id` AND `is_active = true`.
> Tidak terpengaruh filter periode.

**Stok Habis**
| Elemen | Source |
|---|---|
| Count | COUNT WHERE `stock_quantity = 0` |
| List ingredient | nama + badge *"Habis"* (merah) |

**Stok Rendah**
| Elemen | Source |
|---|---|
| Count | COUNT WHERE `0 < stock_quantity <= min_stock` |
| List ingredient | nama + stok saat ini + min stok + badge *"Rendah"* (kuning) |

Action:
| Label | Trigger | Behaviour |
|---|---|---|
| Lihat Semua | link | Navigasi ke `/stock` dengan filter Status = *"Habis"* atau *"Stok Rendah"* |

**States:**
| State | Tampilan |
|---|---|
| Tidak ada alert | *"Semua stok dalam kondisi normal"* — tampil hijau |

---

**Section 4 — Top Waste Bulan Ini**

> Data dari `stock_usage_items` JOIN `stock_usages`
> WHERE `stock_usages.type = 'waste'`
> AND `stock_usages.usage_date` dalam bulan ini.
> Group by `ingredient_id`, sort SUM(`subtotal`) DESC, limit 5.
> Tidak terpengaruh filter periode.

| Field | Source |
|---|---|
| Nama Ingredient | `ingredients.name` |
| Qty Waste | SUM(`stock_usage_items.quantity`) + unit default |
| Nilai Waste | SUM(`stock_usage_items.subtotal`) |

Action:
| Label | Trigger | Behaviour |
|---|---|---|
| Lihat Semua | link | Navigasi ke `/stock/waste` dengan filter bulan ini |

**States:**
| State | Tampilan |
|---|---|
| Tidak ada waste bulan ini | *"Tidak ada waste tercatat bulan ini"* |

---

**Section 5 — Alert Hutang**

> Data dari `debts` WHERE `merchant_id` AND `status IN ('unpaid', 'partial')`.
> Tidak terpengaruh filter periode.

**Overdue**
| Elemen | Source |
|---|---|
| Count | COUNT WHERE `due_date < today` AND `status IN ('unpaid', 'partial')` |
| List hutang | kreditor + sisa hutang + due_date + badge *"Overdue"* (merah) |

**Jatuh Tempo 7 Hari**
| Elemen | Source |
|---|---|
| Count | COUNT WHERE `due_date BETWEEN today AND today+7` AND `status != 'paid'` |
| List hutang | kreditor + sisa hutang + due_date + badge *"Segera"* (kuning) |

Action:
| Label | Trigger | Behaviour |
|---|---|---|
| Bayar | button per item | Buka `MOD-DEBT-02` dengan debt pre-filled |
| Lihat Semua | link | Navigasi ke `/debt` dengan filter Status = *"Overdue"* |

**States:**
| State | Tampilan |
|---|---|
| Tidak ada alert hutang | *"Tidak ada hutang yang perlu perhatian"* — tampil hijau |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-DSH-01 | Dashboard | `/dashboard` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Dashboard sebaiknya punya dedicated endpoint yang mengembalikan semua data sekaligus — hindari banyak API call paralel dari FE |
| DEV-02 | Filter periode mempengaruhi Section 1 dan 2 saja — Section 3 (stok), Section 4 (waste), dan Section 5 (hutang) selalu menampilkan data real-time/bulan ini tanpa dipengaruhi filter |
| DEV-03 | Perbandingan % change: jika periode lalu = 0, tampilkan *"N/A"* bukan error division by zero |
| DEV-04 | Top waste bulan ini menggunakan `stock_usages.usage_date` (bukan `created_at`) untuk filter bulan — konsisten dengan kolom tanggal aktual |
| DEV-05 | Alert hutang "Jatuh Tempo 7 Hari" menggunakan `due_date BETWEEN today AND today+7` — pastikan timezone konsisten dengan `debt_date` |
| DEV-06 | Tombol "Bayar" di Section 5 membuka `MOD-DEBT-02` — modal ini perlu bisa di-trigger dari Dashboard tanpa navigasi ke halaman Debt Management |
| DEV-07 | `merchants.cash_balance` di saldo kas harus real-time — tidak boleh di-cache |

---

*Version 1.0 — Created: 2026-03-25*
