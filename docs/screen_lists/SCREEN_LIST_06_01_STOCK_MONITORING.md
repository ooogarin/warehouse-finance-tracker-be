# Screen List — Stock Monitoring
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Stock Monitoring only
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
ingredients
├── stock_quantity  → total qty stok saat ini (selalu up-to-date)
├── min_stock       → batas minimum untuk alert
├── base_unit       → satuan dasar
└── is_active       → true = aktif, false = nonaktif

ingredient_batches
├── ingredient_id   → terikat ke ingredient
├── qty_initial     → qty awal saat batch dibuat, immutable
├── qty_remaining   → sisa qty batch ini, hanya bisa berkurang
├── cost_per_unit   → harga per base_unit
└── purchase_date   → tanggal batch dibuat (urutan FIFO)

stock_logs
├── ingredient_id       → terikat ke ingredient
├── flow_type           → 'in' atau 'out'
├── reference_type      → 'purchase' / 'usage' / 'waste' / 'adjustment'
├── reference_id        → id dari tabel sumber
├── base_unit_quantity  → qty dalam base_unit
├── base_unit_price     → harga per base_unit
├── total_amount        → base_unit_quantity × base_unit_price [AUTO]
└── balance_after       → stock_quantity setelah pergerakan ini
```

---

## Aturan Bisnis

- Stock List hanya menampilkan ingredient `is_active = true`
- `stock_quantity` tidak bisa diedit manual — hanya berubah via purchase, usage, waste, atau adjustment
- Status stok dikalkulasi dari `stock_quantity` vs `min_stock`:
  ```
  stock_quantity = 0              → Habis (merah)
  stock_quantity <= min_stock     → Stok Rendah (kuning)
  stock_quantity > min_stock      → Normal (hijau)
  ```
- Nilai inventory = SUM(`qty_remaining × cost_per_unit`) per batch dari `ingredient_batches`
- Riwayat pergerakan di Detail diambil dari `stock_logs` — mencakup semua `reference_type`

---

## SECTION — STOCK MONITORING

---

### SCR-STK-01 · Stock List

**Route:** `/stock`
**Akses:** Authenticated

#### Components

**Summary Bar**
| Elemen | Source |
|---|---|
| Total Ingredient | COUNT `ingredients` WHERE `is_active = true` |
| Normal | COUNT WHERE `stock_quantity > min_stock` |
| Stok Rendah | COUNT WHERE `0 < stock_quantity <= min_stock` |
| Habis | COUNT WHERE `stock_quantity = 0` |

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Search | text input | Filter by `ingredients.name` |
| Filter Kategori | dropdown | All / Vegetables / Meat / Seafood / Spices / Oil / Grains / Liquid / Other |
| Filter Status | dropdown | All / Normal / Stok Rendah / Habis |

**List: Stock Rows**

Data per row:
| Field | Source | Tampil jika |
|---|---|---|
| Nama | `ingredients.name` | Selalu |
| Kategori | `ingredients.category` | Selalu |
| Stok Saat Ini | Format human-readable dari `ingredients.stock_quantity` — dikonversi dari `base_unit` ke unit-unit aktif, diurutkan dari unit terbesar (`conversion_factor` DESC). Contoh: *"2 jerigen 2 liter 500 ml"*. Base unit ditampilkan kecil di bawahnya sebagai referensi: *"(= 12.500 ml)"*. Kalkulasi dilakukan di BE. | Selalu |
| Min Stok | `ingredients.min_stock` + unit default | Selalu |
| Nilai Inventory | derived: SUM(`qty_remaining × cost_per_unit`) per batch dari `ingredient_batches` | Selalu |
| Status | derived dari `stock_quantity` vs `min_stock` — badge berwarna | Selalu |
| Last Updated | `stock_logs.created_at` terbaru untuk ingredient ini | Selalu |

Action per row:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik row) | tap/click | Navigasi ke `SCR-STK-02` (Detail) |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton rows |
| Empty | Ilustrasi + *"Belum ada data stok. Tambah ingredient terlebih dahulu."* + button navigasi ke `/ingredients/new` |
| Empty (hasil search/filter) | *"Ingredient tidak ditemukan"* |
| Error | Toast error |

---

### SCR-STK-02 · Stock Detail

**Route:** `/stock/[ingredient_id]`
**Akses:** Authenticated

> Halaman read-only. Semua field `[RO]`.
> Entry point untuk aksi Usage, Waste, dan Adjustment.

#### Components

**Section: Info Stok**

> Selalu tampil di atas tabs.

| Field | Source |
|---|---|
| Nama | `ingredients.name` |
| Kategori | `ingredients.category` |
| Stok Saat Ini | Format human-readable dari `ingredients.stock_quantity` — dikonversi dari `base_unit` ke unit-unit aktif, diurutkan dari unit terbesar (`conversion_factor` DESC). Contoh: *"2 jerigen 2 liter 500 ml"*. Base unit ditampilkan kecil di bawahnya sebagai referensi: *"(= 12.500 ml)"*. Kalkulasi dilakukan di BE. |
| Min Stok | `ingredients.min_stock` dikonversi dengan format yang sama |
| Status | derived badge (Habis / Stok Rendah / Normal) |
| Nilai Inventory | derived: SUM(`qty_remaining × cost_per_unit`) per batch dari `ingredient_batches` — mencerminkan nilai aktual berdasarkan harga perolehan tiap batch (FIFO) |

---

**Tabs**

---

**Tab 1: Batches (default)**

> Urut dari `purchase_date` terlama (akan dipakai pertama — FIFO).
> Hanya tampilkan batch dengan `qty_remaining > 0`.

| Field | Source |
|---|---|
| Tanggal Beli | `ingredient_batches.purchase_date` |
| Qty Awal | `ingredient_batches.qty_initial` + base_unit |
| Qty Tersisa | `ingredient_batches.qty_remaining` + base_unit |
| Harga/Unit | `ingredient_batches.cost_per_unit` |
| Nilai Batch | `qty_remaining × cost_per_unit` `[AUTO]` |

**States Tab 1:**
| State | Tampilan |
|---|---|
| Empty | *"Belum ada batch aktif untuk ingredient ini"* |

---

**Tab 2: Riwayat**

> Data dari `stock_logs` WHERE `ingredient_id = [id]`, order by `created_at DESC`.

| Field | Source |
|---|---|
| Tanggal | `stock_logs.created_at` |
| Tipe | derived dari `flow_type` + `reference_type` — *"Masuk (Pembelian)"* / *"Keluar (Penggunaan)"* / *"Keluar (Waste)"* / *"Masuk (Adjustment)"* / *"Keluar (Adjustment)"* |
| Qty | `stock_logs.base_unit_quantity` + base_unit |
| Nilai | `stock_logs.total_amount` |
| Saldo Setelah | `stock_logs.balance_after` + base_unit |
| Referensi | link ke detail transaksi berdasarkan `reference_type` + `reference_id` |

Filter riwayat:
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Tipe | dropdown | All / Pembelian / Penggunaan / Waste / Adjustment |

**States Tab 2:**
| State | Tampilan |
|---|---|
| Empty | *"Belum ada riwayat pergerakan untuk ingredient ini"* |

---

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Catat Penggunaan | button | Navigasi ke `SCR-STK-04` (Create Usage) dengan ingredient pre-selected |
| Laporkan Waste | button | Navigasi ke `SCR-STK-07` (Create Waste) dengan ingredient pre-selected |
| Adjustment | button | Navigasi ke `SCR-STK-10` (Create Adjustment) dengan ingredient pre-selected |
| Kembali | link | Kembali ke `SCR-STK-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-STK-01` + toast *"Ingredient tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-STK-01 | Stock List | `/stock` | Authenticated |
| SCR-STK-02 | Stock Detail | `/stock/[ingredient_id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | `stock_quantity` di list dan detail harus selalu real-time — tidak boleh di-cache terlalu lama |
| DEV-02 | Nilai inventory per ingredient = SUM(`qty_remaining × cost_per_unit`) dari `ingredient_batches` WHERE `ingredient_id` AND `qty_remaining > 0` |
| DEV-03 | Format human-readable stok dikalkulasi di BE — sort `ingredient_units` by `conversion_factor` DESC, iterasi dari unit terbesar, tampilkan hanya unit dengan qty > 0. Response kembalikan dua field: `stock_quantity_formatted` (contoh: *"2 jerigen 2 liter 500 ml"*) dan `stock_quantity_base` (contoh: *"12.500 ml"*) |
| DEV-04 | Label tipe di riwayat pergerakan adalah derived dari kombinasi `flow_type` + `reference_type` — mapping: `in+purchase` = *"Masuk (Pembelian)"*, `out+usage` = *"Keluar (Penggunaan)"*, `out+waste` = *"Keluar (Waste)"*, `in+adjustment` = *"Masuk (Adjustment)"*, `out+adjustment` = *"Keluar (Adjustment)"* |
| DEV-05 | Link referensi di riwayat pergerakan harus resolve ke route yang tepat berdasarkan `reference_type`: purchase → `/purchase-orders/[id]`, usage → `/stock/usage/[id]`, waste → `/stock/waste/[id]`, adjustment → `/stock/adjustment/[id]` |

---

*Version 1.0 — Created: 2026-03-25*
