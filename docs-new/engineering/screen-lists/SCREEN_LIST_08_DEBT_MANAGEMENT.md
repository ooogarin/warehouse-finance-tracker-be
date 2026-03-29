# Screen List — Debt Management
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Debt Management only
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

```
debts
├── merchant_id       → terikat ke merchant aktif [AUTO]
├── creditor_type     → 'supplier' / 'owner' / 'other'
├── supplier_id       → nullable, wajib jika creditor_type = 'supplier'
├── creditor_name     → nullable, wajib jika creditor_type = 'other'
├── purchase_order_id → nullable, diisi [AUTO] jika dari PO
├── total_amount      → total hutang
├── paid_amount       → akumulasi dari debt_payments
├── status            → 'unpaid' / 'partial' / 'paid'
├── debt_date         → tanggal hutang terjadi
├── due_date          → jatuh tempo, opsional
└── description       → opsional

debt_payments
├── debt_id           → terikat ke debts
├── amount            → jumlah pembayaran
├── payment_method    → 'cash' / 'transfer' / 'other'
├── reference_number  → opsional, untuk transfer
├── notes             → opsional
└── created_by        → user yang mencatat [AUTO]
```

---

## Aturan Bisnis

**Status hutang:**
```
paid_amount = 0                   → 'unpaid'
0 < paid_amount < total_amount    → 'partial'
paid_amount = total_amount        → 'paid'
```

**Overdue (derived, tidak disimpan di DB):**
```
due_date < today AND status IN ('unpaid', 'partial')
→ tampil badge "Overdue" (merah) di FE
→ status di DB tetap 'unpaid' atau 'partial'
```

**Aturan per creditor_type:**
```
creditor_type = 'supplier' → supplier_id [R], creditor_name null
creditor_type = 'owner'    → supplier_id null, creditor_name null
creditor_type = 'other'    → supplier_id null, creditor_name [R]
```

**Sumber hutang:**
```
OTOMATIS dari PO:
├── paid_owner > 0  → debts creditor_type = 'owner'
└── debt_amount > 0 → debts creditor_type = 'supplier'

MANUAL dari Debt Management:
└── semua creditor_type: supplier, owner, other
```

**Side effects saat debt_payment disimpan — satu DB transaction:**
```
1. Buat debt_payments record
2. Update debts.paid_amount += amount
3. Update debts.status:
   paid_amount = total_amount → 'paid', set paid_date = today
   paid_amount < total_amount → 'partial'
4. Buat cash_logs [AUTO]:
   flow_type      = 'out'
   category       = 'debt_payment_out'
   reference_type = 'debt_payment'
   reference_id   = debt_payments.id
   cash_log_date  = waktu pembayaran
   amount         = payment amount
5. Update merchants.cash_balance (-amount)
```

---

## SECTION — DEBT MANAGEMENT

---

### SCR-DEBT-01 · Debt Management

**Route:** `/debt`
**Akses:** Authenticated

#### Components

**Summary Bar**
| Elemen | Source |
|---|---|
| Total Hutang Aktif | SUM(`total_amount - paid_amount`) WHERE `status != 'paid'` |
| Hutang Supplier | SUM(`total_amount - paid_amount`) WHERE `creditor_type = 'supplier'` AND `status != 'paid'` |
| Hutang Owner | SUM(`total_amount - paid_amount`) WHERE `creditor_type = 'owner'` AND `status != 'paid'` |
| Overdue | COUNT WHERE `due_date < today` AND `status IN ('unpaid', 'partial')` |

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Tipe | dropdown | All / Supplier / Owner / Lainnya — maps to `debts.creditor_type` |
| Filter Supplier | multi-select dropdown | Hanya muncul jika Filter Tipe = *"Supplier"*. Pilihan dari `suppliers` aktif milik merchant |
| Filter Status | dropdown | All / Belum Bayar / Sebagian / Lunas / Overdue |
| Tambah Hutang | button | Buka modal `MOD-DEBT-01` |

**List: Debt Cards**

Urutan: `debt_date DESC` (terbaru dulu), hutang overdue diprioritaskan ke atas

Data per card:
| Field | Source | Tampil jika |
|---|---|---|
| Kreditor | `suppliers.name` / *"Owner"* / `debts.creditor_name` | Selalu |
| Tipe | badge: *"Supplier"* / *"Owner"* / *"Lainnya"* dari `creditor_type` | Selalu |
| Total Hutang | `debts.total_amount` | Selalu |
| Sudah Dibayar | `debts.paid_amount` | Selalu |
| Sisa | `total_amount - paid_amount` | Selalu |
| Tanggal Hutang | `debts.debt_date` | Selalu |
| Jatuh Tempo | `debts.due_date` | Hanya jika tidak null |
| Badge Overdue | derived: `due_date < today` AND `status IN ('unpaid', 'partial')` | Hanya jika overdue |
| Status | `debts.status` — badge *"Belum Bayar"* / *"Sebagian"* / *"Lunas"* | Selalu |
| Dari PO | link ke PO jika `purchase_order_id` tidak null | Hanya jika dari PO |
| Deskripsi | `debts.description` | Hanya jika tidak null |

Action per card:
| Label | Trigger | Kondisi | Behaviour |
|---|---|---|---|
| (klik card) | tap/click | Selalu | Navigasi ke `SCR-DEBT-02` (Detail) |
| Bayar | button | Hanya jika `status != 'paid'` | Buka modal `MOD-DEBT-02` dengan debt pre-filled |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton cards |
| Empty | Ilustrasi + *"Belum ada hutang."* + button Tambah Hutang |
| Empty (hasil filter) | *"Tidak ada hutang sesuai filter"* |
| Error | Toast error |

---

### MOD-DEBT-01 · Modal — Tambah Hutang

**Trigger:** Button *"Tambah Hutang"* di `SCR-DEBT-01`
**Tipe:** Modal overlay

#### Components

**Form: Tambah Hutang**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Tipe Kreditor | dropdown | `[R]` Supplier / Owner / Lainnya | `debts.creditor_type` |
| Supplier | dropdown + search | `[R]` hanya jika `creditor_type = 'supplier'`, pilihan dari suppliers aktif | `debts.supplier_id` |
| Nama Kreditor | text input | `[R]` hanya jika `creditor_type = 'other'` | `debts.creditor_name` |
| Total Hutang | number input | `[R]` > 0 | `debts.total_amount` |
| Tanggal Hutang | date picker | `[R]` default hari ini | `debts.debt_date` |
| Jatuh Tempo | date picker | `[O]` harus >= `debt_date` | `debts.due_date` |
| Deskripsi | text input | `[O]` | `debts.description` |

> `debts.paid_amount` di-set `0` `[AUTO]`
> `debts.status` di-set `'unpaid'` `[AUTO]`
> `debts.purchase_order_id` di-set `null` `[AUTO]`
> `debts.merchant_id` di-set dari merchant aktif `[AUTO]`

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → tutup modal → refresh list + summary bar + toast *"Hutang berhasil ditambahkan"* |
| Batal | button | Tutup modal tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error, modal tetap terbuka |
| Success | Modal tutup + refresh + toast sukses |

---

### MOD-DEBT-02 · Modal — Bayar Hutang

**Trigger:** Button *"Bayar"* di card hutang di `SCR-DEBT-01` atau di `SCR-DEBT-02`
**Tipe:** Modal overlay

#### Components

**Display: Info Hutang (read-only)**
| Field | Source |
|---|---|
| Kreditor | `suppliers.name` / *"Owner"* / `debts.creditor_name` |
| Total Hutang | `debts.total_amount` |
| Sudah Dibayar | `debts.paid_amount` |
| Sisa Hutang | `total_amount - paid_amount` |

**Form: Pembayaran**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Jumlah Bayar | number input | `[R]` > 0, tidak boleh melebihi sisa hutang, tidak boleh melebihi `merchants.cash_balance` | `debt_payments.amount` |
| Metode Pembayaran | dropdown | `[R]` Cash / Transfer / Lainnya | `debt_payments.payment_method` |
| No. Referensi | text input | `[O]` untuk transfer — max 50 karakter | `debt_payments.reference_number` |
| Catatan | textarea | `[O]` | `debt_payments.notes` |

**Display: Preview setelah bayar**
```
Sisa hutang sebelum:  Rp [sisa]
Jumlah bayar:       - Rp [input]
Sisa hutang setelah:  Rp [sisa - input]
Status setelah: [Sebagian / Lunas]

Saldo kas sebelum:  Rp [merchants.cash_balance]
Jumlah bayar:     - Rp [input]
Saldo kas setelah:  Rp [balance - input]
```

> Jika `jumlah bayar > merchants.cash_balance`:
> inline error: *"Jumlah melebihi saldo kas. Tersedia: Rp [merchants.cash_balance]"*
> Tombol Simpan di-disable.

> Jika `jumlah bayar > sisa hutang`:
> inline error: *"Jumlah melebihi sisa hutang. Sisa: Rp [sisa]"*
> Tombol Simpan di-disable.

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → BE proses satu transaction → tutup modal → refresh + toast *"Pembayaran berhasil dicatat"* |
| Batal | button | Tutup modal tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error, modal tetap terbuka |
| Success | Modal tutup + refresh + toast sukses |

---

### SCR-DEBT-02 · Debt Detail

**Route:** `/debt/[id]`
**Akses:** Authenticated

> Semua field `[RO]`.

#### Components

**Section: Info Hutang**
| Field | Source |
|---|---|
| Tipe Kreditor | `debts.creditor_type` — *"Supplier"* / *"Owner"* / *"Lainnya"* |
| Kreditor | `suppliers.name` / *"Owner"* / `debts.creditor_name` |
| Total Hutang | `debts.total_amount` |
| Sudah Dibayar | `debts.paid_amount` |
| Sisa Hutang | `total_amount - paid_amount` |
| Status | `debts.status` + badge Overdue jika applicable |
| Tanggal Hutang | `debts.debt_date` |
| Jatuh Tempo | `debts.due_date` atau *"-"* |
| Deskripsi | `debts.description` atau *"-"* |
| Dari PO | link ke `/purchase-orders/[id]` jika `purchase_order_id` tidak null, atau *"-"* |

**Section: Riwayat Pembayaran**

> Data dari `debt_payments` WHERE `debt_id = [id]`, order by `created_at DESC`.

| Kolom | Source |
|---|---|
| Tanggal | `debt_payments.created_at` |
| Jumlah | `debt_payments.amount` |
| Metode | `debt_payments.payment_method` |
| No. Referensi | `debt_payments.reference_number` atau *"-"* |
| Catatan | `debt_payments.notes` atau *"-"* |
| Dicatat oleh | `users.name` dari `debt_payments.created_by` |

**States riwayat:**
| State | Tampilan |
|---|---|
| Empty | *"Belum ada pembayaran"* |

**Actions**
| Label | Trigger | Kondisi | Behaviour |
|---|---|---|---|
| Bayar | button | Hanya jika `status != 'paid'` | Buka modal `MOD-DEBT-02` |
| Kembali | link | Selalu | Kembali ke `SCR-DEBT-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-DEBT-01` + toast *"Hutang tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route / Trigger | Akses |
|---|---|---|---|
| SCR-DEBT-01 | Debt Management | `/debt` | Authenticated |
| MOD-DEBT-01 | Modal Tambah Hutang | trigger dari SCR-DEBT-01 | Authenticated |
| MOD-DEBT-02 | Modal Bayar Hutang | trigger dari SCR-DEBT-01 / SCR-DEBT-02 | Authenticated |
| SCR-DEBT-02 | Debt Detail | `/debt/[id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Semua side effects saat `debt_payment` disimpan harus dalam satu DB transaction: buat `debt_payments`, update `debts.paid_amount` + `debts.status`, buat `cash_logs`, update `merchants.cash_balance` |
| DEV-02 | `debts.status` diupdate otomatis oleh BE saat payment masuk — FE tidak perlu kirim status |
| DEV-03 | `debts.paid_date` di-set otomatis saat `status` berubah menjadi `'paid'` |
| DEV-04 | Overdue adalah derived di FE: `due_date < today AND status IN ('unpaid', 'partial')` — tidak ada kolom overdue di DB |
| DEV-05 | Filter Supplier di toolbar hanya muncul jika Filter Tipe = `'supplier'` — FE handle visibility filter ini secara dinamis |
| DEV-06 | Hutang overdue diprioritaskan ke atas list — BE sort: `overdue DESC`, lalu `debt_date DESC` |
| DEV-07 | Validasi `jumlah bayar` di modal cek dua kondisi secara terpisah: (1) tidak melebihi sisa hutang, (2) tidak melebihi `merchants.cash_balance` — error message berbeda untuk masing-masing |
| DEV-08 | `cash_logs` dari pembayaran hutang menggunakan `reference_type = 'debt_payment'` dan `reference_id = debt_payments.id` |

---

*Version 1.0 — Created: 2026-03-25*
