# Screen List — Reports & Analytics
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Reports & Analytics only
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

Semua halaman Reports adalah **read-only** — tidak ada operasi tulis. Data di-derive dari:

```
cash_logs                          → Financial Summary
stock_usages + stock_usage_items   → Stock Report (waste)
ingredients + ingredient_batches   → Stock Report (nilai inventory)
stock_logs                         → Stock Report (pergerakan)
purchase_orders                    → Supplier Performance
debts + debt_payments              → Supplier Performance
suppliers                          → Supplier Performance
```

---

## Aturan Bisnis

**Filter Periode (berlaku di semua halaman):**
```
Harian       → data hari yang dipilih
Mingguan     → data minggu yang dipilih (Sen-Min)
Bulanan      → data bulan yang dipilih
Custom Range → dari tanggal X sampai tanggal Y
```

**Export Modal:**
```
Preset: Hari ini / Minggu ini / Bulan ini / Bulan lalu / Custom
Custom → date range picker (dari - sampai)
Pre-filled dari filter periode yang sedang aktif di halaman
Format output: Excel (.xlsx) atau CSV
Data: semua record sesuai range — tidak terpengaruh pagination
```

---

## Shared Component — Export Modal

> Digunakan di semua halaman Reports. Dipanggil saat user klik tombol Export.

**MOD-RPT-EXPORT · Modal Export**

| Field | Type | Rule |
|---|---|---|
| Preset Periode | segmented / dropdown | Hari ini / Minggu ini / Bulan ini / Bulan lalu / Custom |
| Dari | date picker | `[R]` hanya jika Custom, default dari filter aktif |
| Sampai | date picker | `[R]` hanya jika Custom, harus >= Dari, default dari filter aktif |
| Format | dropdown | Excel (.xlsx) / CSV |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Export | submit | BE generate file sesuai range → download otomatis → tutup modal |
| Batal | button | Tutup modal tanpa export |

**States**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner + *"Sedang menyiapkan file..."* |
| Error | Toast error, modal tetap terbuka |
| Success | File terdownload otomatis, modal tutup |

---

## SECTION — REPORTS & ANALYTICS

---

### SCR-RPT-01 · Financial Summary

**Route:** `/reports/financial`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Periode | segmented control | Harian / Mingguan / Bulanan / Custom |
| Export | button | Buka `MOD-RPT-EXPORT` pre-filled dengan periode aktif |

---

**Section: Ringkasan Kas**

> Data dari `cash_logs` WHERE `merchant_id` AND `cash_log_date` dalam periode.

| Elemen | Source |
|---|---|
| Total Kas Masuk | SUM(`amount`) WHERE `flow_type = 'in'` |
| Total Kas Keluar | SUM(`amount`) WHERE `flow_type = 'out'` |
| Selisih (Net) | Total Masuk - Total Keluar |
| % vs periode sebelumnya (Masuk) | derived — hijau jika naik, merah jika turun |
| % vs periode sebelumnya (Keluar) | derived — merah jika naik, hijau jika turun |

---

**Section: Breakdown Pengeluaran per Kategori**

> Data dari `cash_logs` WHERE `flow_type = 'out'` AND periode.

| Kolom | Source |
|---|---|
| Kategori | derived label dari `cash_logs.category` |
| Total | SUM(`amount`) per kategori |
| % dari total keluar | derived |

Tampil sebagai tabel + progress bar per kategori. Urut dari nilai terbesar.
Hanya tampilkan kategori dengan nilai > 0.

---

**Section: Breakdown Pemasukan per Kategori**

> Data dari `cash_logs` WHERE `flow_type = 'in'` AND periode.

| Kolom | Source |
|---|---|
| Kategori | derived label dari `cash_logs.category` |
| Total | SUM(`amount`) per kategori |
| % dari total masuk | derived |

---

**Section: Daftar Transaksi**

> Data dari `cash_logs` WHERE periode, order by `cash_log_date DESC`.
> Dengan pagination.

| Kolom | Source |
|---|---|
| Tanggal & Waktu | `cash_logs.cash_log_date` |
| Tipe | `flow_type` — *"Masuk"* / *"Keluar"* |
| Kategori | derived label |
| Deskripsi | `cash_logs.description` atau *"-"* |
| Amount | `cash_logs.amount` |
| Saldo Setelah | `cash_logs.balance_after` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Empty | *"Tidak ada transaksi pada periode ini"* |

---

### SCR-RPT-02 · Stock Report

**Route:** `/reports/stock`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Periode | segmented control | Harian / Mingguan / Bulanan / Custom |
| Export | button | Buka `MOD-RPT-EXPORT` pre-filled dengan periode aktif |

---

**Section: Ringkasan Stok**

> Data real-time dari `ingredients` — tidak terpengaruh filter periode.

| Elemen | Source |
|---|---|
| Total Ingredient Aktif | COUNT `ingredients` WHERE `is_active = true` |
| Total Nilai Inventory | SUM(`qty_remaining × cost_per_unit`) dari `ingredient_batches` |
| Stok Rendah | COUNT WHERE `0 < stock_quantity <= min_stock` |
| Stok Habis | COUNT WHERE `stock_quantity = 0` |

---

**Section: Top Waste**

> Data dari `stock_usage_items` JOIN `stock_usages`
> WHERE `type = 'waste'` AND periode.
> Group by `ingredient_id`, sort SUM(`subtotal`) DESC, limit 10.

| Kolom | Source |
|---|---|
| Ingredient | `ingredients.name` |
| Qty Waste | SUM(`quantity`) + unit default |
| Nilai Waste | SUM(`subtotal`) |
| % dari total waste | derived |

**Footer:**
| Elemen | Source |
|---|---|
| Total Nilai Waste | SUM semua `subtotal` WHERE waste AND periode |

---

**Section: Penggunaan Stok (Usage)**

> Data dari `stock_usage_items` JOIN `stock_usages`
> WHERE `type = 'usage'` AND periode.
> Group by `ingredient_id`, sort SUM(`subtotal`) DESC.

| Kolom | Source |
|---|---|
| Ingredient | `ingredients.name` |
| Qty Dipakai | SUM(`quantity`) + unit default |
| Nilai COGS | SUM(`subtotal`) |

**Footer:**
| Elemen | Source |
|---|---|
| Total COGS Periode | SUM semua `subtotal` WHERE usage AND periode |

---

**Section: Pergerakan Stok**

> Data dari `stock_logs` WHERE periode, order by `created_at DESC`.
> Dengan pagination.

| Kolom | Source |
|---|---|
| Tanggal | `stock_logs.created_at` |
| Ingredient | `ingredients.name` |
| Tipe | derived dari `flow_type` + `reference_type` |
| Qty | `base_unit_quantity` + base_unit |
| Nilai | `total_amount` |
| Saldo Setelah | `balance_after` + base_unit |

Filter tambahan:
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Tipe Pergerakan | dropdown | All / Pembelian / Penggunaan / Waste / Adjustment |
| Filter Ingredient | dropdown + search | All / [daftar ingredient] |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Empty | *"Tidak ada pergerakan stok pada periode ini"* |

---

### SCR-RPT-03 · Supplier Performance

**Route:** `/reports/supplier`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Periode | segmented control | Harian / Mingguan / Bulanan / Custom |
| Filter Supplier | dropdown + search | All / [daftar supplier] |
| Export | button | Buka `MOD-RPT-EXPORT` pre-filled dengan periode aktif |

---

**Section: Ringkasan per Supplier**

> Data dari `purchase_orders` JOIN `suppliers` WHERE periode.
> Group by `supplier_id`.

| Kolom | Source |
|---|---|
| Supplier | `suppliers.name` |
| Total Order | COUNT `purchase_orders` per supplier |
| Total Belanja | SUM(`total_amount`) per supplier |
| Total Hutang | SUM(`debt_amount`) per supplier |
| Last Order | MAX(`purchase_date`) per supplier |

Urut dari Total Belanja terbesar.

---

**Section: Riwayat PO per Supplier**

> Tampil setelah user pilih supplier dari section di atas.
> Data dari `purchase_orders` WHERE `supplier_id` AND periode,
> order by `purchase_date DESC`. Dengan pagination.

| Kolom | Source |
|---|---|
| Tanggal | `purchase_orders.purchase_date` |
| No. Invoice | `purchase_orders.invoice_number` |
| Total | `purchase_orders.total_amount` |
| Bayar Tunai | `purchase_orders.paid_cash` |
| Talangan Owner | `purchase_orders.paid_owner` |
| Hutang | `purchase_orders.debt_amount` |
| Status Hutang | derived dari `debts` terkait PO |

Action per row:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik row) | tap/click | Navigasi ke `/purchase-orders/[id]` |

---

**Section: Riwayat Pembayaran Hutang per Supplier**

> Data dari `debt_payments` JOIN `debts`
> WHERE `debts.supplier_id` AND periode,
> order by `debt_payments.created_at DESC`.

| Kolom | Source |
|---|---|
| Tanggal Bayar | `debt_payments.created_at` |
| Dari PO | link ke PO via `debts.purchase_order_id` |
| Jumlah Bayar | `debt_payments.amount` |
| Metode | `debt_payments.payment_method` |
| No. Referensi | `debt_payments.reference_number` atau *"-"* |

**States (berlaku semua section)**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Empty | *"Tidak ada data pada periode ini"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-RPT-01 | Financial Summary | `/reports/financial` | Authenticated |
| SCR-RPT-02 | Stock Report | `/reports/stock` | Authenticated |
| SCR-RPT-03 | Supplier Performance | `/reports/supplier` | Authenticated |
| MOD-RPT-EXPORT | Modal Export | trigger dari semua halaman report | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Export di-generate BE secara synchronous — file langsung direturn sebagai response download. Jika data terlalu besar di masa depan, bisa diupgrade ke background job (post-MVP) |
| DEV-02 | Modal export pre-filled dari filter aktif di halaman — FE kirim current filter sebagai default ke modal |
| DEV-03 | Perbandingan % vs periode sebelumnya di Financial Summary: periode sebelumnya dihitung otomatis BE berdasarkan tipe filter (harian → kemarin, mingguan → minggu lalu, bulanan → bulan lalu, custom → range yang sama sebelumnya) |
| DEV-04 | Section "Riwayat PO per Supplier" di SCR-RPT-03 baru muncul setelah user pilih/klik salah satu supplier dari section ringkasan — bukan tampil semua sekaligus |
| DEV-05 | Filter Ingredient di Section Pergerakan Stok (SCR-RPT-02) bersifat opsional — jika tidak dipilih, tampilkan semua ingredient |
| DEV-06 | Semua query report menggunakan `cash_log_date` (bukan `created_at`) untuk filter periode cash, dan `usage_date` / `adjustment_date` / `purchase_date` untuk filter periode stock — konsisten dengan kolom tanggal aktual di masing-masing tabel |

---

*Version 1.0 — Created: 2026-03-25*
