# Screen List — Cash Management
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Cash Management only
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
cash_logs
├── merchant_id    → terikat ke merchant aktif [AUTO]
├── flow_type      → 'in' atau 'out'
├── amount         → nilai transaksi
├── category       → enum cash_log_category
├── cash_log_date  → tanggal & waktu aktual transaksi, bisa diinput manual
├── reference_type → enum cash_log_reference_type NULL
│                    'purchase_order' / 'debt_payment'
├── reference_id   → id transaksi sumber [AUTO] atau null
├── description    → opsional
├── balance_after  → saldo setelah transaksi [AUTO]
└── created_by     → user yang mencatat [AUTO]
```



---

## Aturan Bisnis

- Transaksi cash bersifat final — tidak bisa diedit atau dihapus
- `balance_after` diisi `[AUTO]` oleh BE: `merchants.cash_balance` ± `amount`
- `reference_id` tidak pernah diinput manual — diisi `[AUTO]` jika transaksi berasal dari flow lain, atau `null` jika input manual
- `reference_type` selalu konsisten dengan `reference_id` — keduanya null atau keduanya not null
- `cash_log_date` adalah tanggal aktual transaksi — bisa diinput manual, default waktu saat ini
- `created_at` tidak bisa diinput manual — diisi `[AUTO]` oleh sistem
- Jumlah kas keluar tidak boleh melebihi `merchants.cash_balance` yang tersedia

**Sumber transaksi cash_logs:**
```
MANUAL (dari form Cash Management)
├── Cash In  → sales_revenue, capital_injection,
│              debt_repayment_in, other_in
└── Cash Out → owner_withdrawal, salary, utilities,
               rent, maintenance, other_out

OTOMATIS (dari flow lain, tidak muncul di form)
├── purchase_payment  → dari Purchase Orders (paid_cash > 0)
└── debt_payment_out  → dari Debt Management
```

**`paid_owner` di PO tidak menghasilkan cash_log** — hanya buat record di `debts`. Kas resto tidak berubah karena uang tidak lewat kas resto.

---

## SECTION — CASH MANAGEMENT

---

### SCR-CSH-01 · Cash Management

**Route:** `/cash`
**Akses:** Authenticated

#### Components

**Summary Bar**
| Elemen | Source |
|---|---|
| Saldo Saat Ini | `merchants.cash_balance` |
| Total Masuk Hari Ini | SUM(`amount`) WHERE `flow_type = 'in'` AND `cash_log_date = today` |
| Total Keluar Hari Ini | SUM(`amount`) WHERE `flow_type = 'out'` AND `cash_log_date = today` |

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Search | text input | Filter by `cash_logs.description` |
| Filter Tipe | dropdown | All / Kas Masuk / Kas Keluar |
| Filter Kategori | dropdown | All / [daftar kategori sesuai filter tipe] |
| Filter Tanggal | date range picker | Today / This Week / This Month / Custom |
| Catat Kas Masuk | button (hijau) | Buka modal `MOD-CSH-01` |
| Catat Kas Keluar | button (merah) | Buka modal `MOD-CSH-02` |

**List: Transaction Rows**

Urutan: `cash_log_date DESC` (terbaru dulu)

Data per row:
| Field | Source | Tampil jika |
|---|---|---|
| Tanggal & Waktu | `cash_logs.cash_log_date` | Selalu |
| Kategori | derived label dari `cash_logs.category` | Selalu |
| Tipe | `cash_logs.flow_type` — badge *"Masuk"* (hijau) / *"Keluar"* (merah) | Selalu |
| Amount | `cash_logs.amount` — hijau jika in, merah jika out | Selalu |
| Saldo Setelah | `cash_logs.balance_after` | Selalu |
| Deskripsi | `cash_logs.description` | Hanya jika tidak null |
| Sumber | derived dari `reference_id` — jika tidak null tampil link ke transaksi sumber | Hanya jika `reference_id` tidak null |

Action per row:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik row) | tap/click | Navigasi ke `SCR-CSH-02` (Detail) |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton rows |
| Empty | Ilustrasi + *"Belum ada transaksi kas."* |
| Empty (hasil filter) | *"Tidak ada transaksi pada periode ini"* |
| Error | Toast error |

---

### MOD-CSH-01 · Modal — Catat Kas Masuk

**Trigger:** Button *"Catat Kas Masuk"* di `SCR-CSH-01`
**Tipe:** Modal overlay

#### Components

**Form: Kas Masuk**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Kategori | dropdown | `[R]` Sales Revenue / Setoran Modal / Pembayaran Hutang Customer / Lainnya | `cash_logs.category` → `sales_revenue` / `capital_injection` / `debt_repayment_in` / `other_in` |
| Jumlah | number input | `[R]` > 0 | `cash_logs.amount` |
| Tanggal & Waktu | datetime picker | `[R]` default waktu saat ini, bisa diedit | `cash_logs.cash_log_date` |
| Deskripsi | text input | `[O]` max 255 karakter | `cash_logs.description` |

**Display: Preview Saldo**
```
Saldo saat ini:  Rp [merchants.cash_balance]
Jumlah masuk:  + Rp [amount input]
Saldo setelah: Rp [balance_after] ← [AUTO], display only
```

> `cash_logs.flow_type` di-set `'in'` `[AUTO]`
> `cash_logs.reference_id` di-set `null` `[AUTO]`
> `cash_logs.balance_after` di-set oleh BE `[AUTO]`
> `cash_logs.created_by` di-set dari user aktif `[AUTO]`
> `merchants.cash_balance` di-update (+amount) oleh BE `[AUTO]`

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → update balance → tutup modal → refresh list + summary bar + toast *"Kas masuk berhasil dicatat"* |
| Batal | button | Tutup modal tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error, modal tetap terbuka |
| Success | Modal tutup + list refresh + toast sukses |

---

### MOD-CSH-02 · Modal — Catat Kas Keluar

**Trigger:** Button *"Catat Kas Keluar"* di `SCR-CSH-01`
**Tipe:** Modal overlay

#### Components

**Form: Kas Keluar**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Kategori | dropdown | `[R]` Ambil Pribadi / Gaji Karyawan / Utilitas / Sewa / Maintenance / Lainnya | `cash_logs.category` → `owner_withdrawal` / `salary` / `utilities` / `rent` / `maintenance` / `other_out` |
| Jumlah | number input | `[R]` > 0 | `cash_logs.amount` |
| Tanggal & Waktu | datetime picker | `[R]` default waktu saat ini, bisa diedit | `cash_logs.cash_log_date` |
| Deskripsi | text input | `[O]` max 255 karakter | `cash_logs.description` |

**Display: Preview Saldo**
```
Saldo saat ini:  Rp [merchants.cash_balance]
Jumlah keluar: - Rp [amount input]
Saldo setelah:   Rp [balance_after] ← [AUTO], display only
```

> Jika `amount > merchants.cash_balance` → field Jumlah tampil error inline:
> *"Jumlah melebihi saldo kas saat ini. Saldo tersedia: Rp [merchants.cash_balance]"*
> Tombol Simpan di-disable sampai jumlah valid.

> `cash_logs.flow_type` di-set `'out'` `[AUTO]`
> `cash_logs.reference_id` di-set `null` `[AUTO]`
> `cash_logs.balance_after` di-set oleh BE `[AUTO]`
> `cash_logs.created_by` di-set dari user aktif `[AUTO]`
> `merchants.cash_balance` di-update (-amount) oleh BE `[AUTO]`

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → update balance → tutup modal → refresh list + summary bar + toast *"Kas keluar berhasil dicatat"* |
| Batal | button | Tutup modal tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error, modal tetap terbuka |
| Success | Modal tutup + list refresh + toast sukses |

---

### SCR-CSH-02 · Cash Transaction Detail

**Route:** `/cash/[id]`
**Akses:** Authenticated

> Semua field `[RO]`. Tidak bisa diedit atau dihapus.

#### Components

**Section: Info Transaksi**
| Field | Source |
|---|---|
| Tanggal & Waktu | `cash_logs.cash_log_date` |
| Tipe | `cash_logs.flow_type` — *"Kas Masuk"* / *"Kas Keluar"* |
| Kategori | derived label dari `cash_logs.category` |
| Jumlah | `cash_logs.amount` |
| Saldo Setelah | `cash_logs.balance_after` |
| Deskripsi | `cash_logs.description` atau *"-"* |
| Dicatat oleh | `users.name` dari `cash_logs.created_by` |
| Sumber Transaksi | derived dari `reference_id` + `reference_type` — link ke PO / Debt Payment jika tidak null, atau *"Input manual"* jika null |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali | link | Kembali ke `SCR-CSH-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-CSH-01` + toast *"Transaksi tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route / Trigger | Akses |
|---|---|---|---|
| SCR-CSH-01 | Cash Management | `/cash` | Authenticated |
| MOD-CSH-01 | Modal Kas Masuk | trigger dari SCR-CSH-01 | Authenticated |
| MOD-CSH-02 | Modal Kas Keluar | trigger dari SCR-CSH-01 | Authenticated |
| SCR-CSH-02 | Cash Transaction Detail | `/cash/[id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | `merchants.cash_balance` dan `cash_logs.balance_after` harus diupdate dalam satu DB transaction — jika salah satu gagal, keduanya di-rollback |
| DEV-02 | `balance_after` = `merchants.cash_balance` sebelum transaksi ± `amount` — kalkulasi di BE, bukan FE |
| DEV-03 | Preview saldo di modal dikalkulasi FE (real-time saat user input amount) menggunakan `merchants.cash_balance` yang di-fetch saat modal dibuka |
| DEV-04 | Filter Kategori di toolbar bersifat dinamis — jika Filter Tipe = *"Kas Masuk"*, hanya tampilkan kategori IN. Jika *"Kas Keluar"*, hanya tampilkan kategori OUT. Jika *"All"*, tampilkan semua |
| DEV-05 | `cash_logs.cash_log_date` adalah tanggal aktual transaksi yang diinput user — BE harus terima nilai ini dari request |
| DEV-06 | Kolom *"Sumber Transaksi"* di Detail resolve `reference_id` ke route yang tepat menggunakan `reference_type`: `purchase_order` → `/purchase-orders/[id]`, `debt_payment` → `/debt/payments/[id]`, `null` → tampil *"Input manual"* |

---

*Version 1.0 — Updated: 2026-03-25*
