# Screen List — Stock Adjustment
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Stock Adjustment only
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
stock_adjustments
├── merchant_id      → terikat ke merchant aktif [AUTO]
├── adjustment_date  → tanggal & waktu adjustment
└── notes            → opsional

stock_adjustment_items
├── stock_adjustment_id → terikat ke stock_adjustment
├── ingredient_id       → ingredient yang di-adjust
├── ingredient_unit_id  → unit yang dipilih user
├── flow_type           → 'in' atau 'out' per item
├── quantity            → qty dalam unit pilihan user
├── unit_price          → 'in': input user / 'out': [AUTO] dari FIFO
├── subtotal            → quantity × unit_price [AUTO/GENERATED]
└── notes               → opsional
```

---

## Aturan Bisnis

- Adjustment bersifat final setelah disimpan — tidak bisa diedit atau dibatalkan
- Dropdown ingredient hanya tampilkan `is_active = true`
- Dropdown unit hanya tampilkan `ingredient_units.is_active = true` milik ingredient yang dipilih
- `flow_type` ditentukan per item — dalam satu sesi adjustment bisa ada item `in` dan `out` sekaligus
- **flow_type = 'in':**
  - `unit_price` `[R]` diinput manual oleh user — karena buat batch baru dengan harga yang ditentukan user
  - Buat `ingredient_batches` baru
- **flow_type = 'out':**
  - `unit_price` `[AUTO]` weighted average dari FIFO batch — tidak ditampilkan di form
  - Qty tidak boleh melebihi `ingredients.stock_quantity` yang tersedia
  - Kurangi `ingredient_batches.qty_remaining` (FIFO)
- Minimal 1 item wajib ada sebelum bisa lanjut ke Review

**Side effects saat Adjustment disimpan — semua dalam satu DB transaction:**
```
1. Buat stock_adjustments
2. Buat stock_adjustment_items (per item)
3. Per item, kalkulasi konversi qty ke base_unit

Jika flow_type = 'in':
4. Buat ingredient_batches baru:
   qty_initial    = qty dalam base_unit
   qty_remaining  = qty dalam base_unit
   cost_per_unit  = unit_price yang diinput user (dalam base_unit)
   purchase_date  = adjustment_date
5. Update ingredients.stock_quantity (+qty dalam base_unit)
6. Buat stock_logs:
   flow_type          = 'in'
   reference_type     = 'adjustment'
   reference_id       = stock_adjustments.id
   base_unit_quantity = qty dalam base_unit
   base_unit_price    = unit_price dalam base_unit
   balance_after      = stock_quantity setelah ditambah

Jika flow_type = 'out':
4. Kurangi ingredient_batches.qty_remaining (FIFO — batch tertua dulu)
   → Jika qty span lebih dari satu batch, buat satu stock_log per batch
5. Update ingredients.stock_quantity (-qty dalam base_unit)
6. Buat stock_logs per batch yang terpakai:
   flow_type          = 'out'
   reference_type     = 'adjustment'
   reference_id       = stock_adjustments.id
   base_unit_quantity = qty dari batch ini (dalam base_unit)
   base_unit_price    = cost_per_unit dari batch ini
   balance_after      = stock_quantity setelah dikurangi
```

---

## SECTION — STOCK ADJUSTMENT

---

### SCR-STK-09 · Adjustment List

**Route:** `/stock/adjustment`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Tanggal | date range picker | Filter by `stock_adjustments.adjustment_date` — Today / This Week / This Month / Custom |
| Buat Adjustment | button | Navigasi ke `SCR-STK-10` |

**List: Adjustment Cards**

Data per card:
| Field | Source | Tampil jika |
|---|---|---|
| Tanggal & Waktu | `stock_adjustments.adjustment_date` | Selalu |
| Jumlah Item | COUNT `stock_adjustment_items` per adjustment | Selalu |
| Item In | COUNT items WHERE `flow_type = 'in'` | Hanya jika > 0 |
| Item Out | COUNT items WHERE `flow_type = 'out'` | Hanya jika > 0 |
| Catatan | `stock_adjustments.notes` | Hanya jika tidak null |

Action per card:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik card) | tap/click | Navigasi ke `SCR-STK-11` (Detail) |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton cards |
| Empty | Ilustrasi + *"Belum ada catatan adjustment."* + button Buat Adjustment |
| Empty (hasil filter) | *"Tidak ada adjustment pada periode ini"* |
| Error | Toast error |

---

### SCR-STK-10 · Create Adjustment

**Route:** `/stock/adjustment/new`
**Akses:** Authenticated

> Data setiap step disimpan di **FE state**.
> Seluruh data dikirim ke BE dalam **satu payload** saat user submit di step Review.
> BE memproses semua side effects dalam satu DB transaction.
> User bisa navigasi bebas maju/mundur antar step — FE state tetap terjaga.

**Banner informasi (tampil permanen di semua step):**
> ⚠️ *"Data adjustment yang sudah disimpan tidak dapat diubah."*

---

#### Step 1 — Info

**Progress Indicator:** Step 1 dari 3

**Form: Info Adjustment**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Tanggal & Waktu | datetime picker | `[R]` default waktu saat ini, bisa diedit | `stock_adjustments.adjustment_date` |
| Catatan | textarea | `[O]` contoh: *"Inventory opname bulanan"* | `stock_adjustments.notes` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Lanjut | submit | Validasi → simpan ke FE state → navigasi ke Step 2 |

---

#### Step 2 — Items

**Progress Indicator:** Step 2 dari 3

> Minimal 1 item wajib ada sebelum bisa lanjut ke Step 3.
> Dalam satu sesi bisa ada item `in` dan `out` sekaligus.

**Tabel Items**

Header tabel: Tipe / Ingredient / Unit / Qty / Harga/Unit / Estimasi Nilai / Catatan / Aksi

Per baris item:
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Tipe | dropdown | `[R]` In (Tambah) / Out (Kurang) | `stock_adjustment_items.flow_type` |
| Ingredient | dropdown + search | `[R]` hanya `is_active = true` | `stock_adjustment_items.ingredient_id` |
| Unit | dropdown | `[R]` tampil setelah ingredient dipilih, hanya `ingredient_units.is_active = true` | `stock_adjustment_items.ingredient_unit_id` |
| Qty | number input | `[R]` > 0. Jika `flow_type = 'out'`: tidak boleh melebihi stok tersedia | `stock_adjustment_items.quantity` |
| Harga/Unit | number input | `[R]` hanya tampil jika `flow_type = 'in'` — input manual user | `stock_adjustment_items.unit_price` |
| Estimasi Nilai | number | `[RO]` `[AUTO]` — jika `flow_type = 'in'`: qty × harga input / jika `flow_type = 'out'`: kalkulasi BE dari FIFO. Label: *"≈ Rp [nilai]"* | — (display only) |
| Catatan | text input | `[O]` | `stock_adjustment_items.notes` |

> Jika `flow_type = 'out'`: `unit_price` tidak ditampilkan — diisi `[AUTO]` oleh BE (weighted average FIFO) saat disimpan.

**Validasi qty untuk flow_type = 'out':**
```
qty dalam base_unit > ingredients.stock_quantity
→ inline error per baris: "Stok tidak mencukupi.
   Tersedia: [stock_quantity_formatted]"
```

Action per baris:
| Label | Trigger | Behaviour |
|---|---|---|
| Hapus | button | Hapus baris dari FE state |

**Footer tabel:**
| Elemen | Source |
|---|---|
| Total Estimasi Nilai In | Sum Estimasi Nilai WHERE `flow_type = 'in'` `[AUTO]` |
| Total Estimasi Nilai Out | Sum Estimasi Nilai WHERE `flow_type = 'out'` `[AUTO]` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| + Tambah Item | button | Tambah baris baru |
| Kembali | link | Navigasi ke Step 1 (FE state tetap terjaga) |
| Lanjut | button | Validasi minimal 1 item → simpan ke FE state → navigasi ke Step 3 |

**Validasi saat Lanjut:**
```
Tidak ada item → inline error: "Minimal 1 item harus ditambahkan"
```

---

#### Step 3 — Review & Submit

**Progress Indicator:** Step 3 dari 3

> Semua field `[RO]`. User bisa kembali ke step manapun jika ada yang perlu diubah.

**Section: Info**
| Field | Value |
|---|---|
| Tanggal & Waktu | `adjustment_date` |
| Catatan | nilai atau *"-"* jika kosong |

**Section: Items**

| Tipe | Ingredient | Unit | Qty | Harga/Unit | Estimasi Nilai | Catatan |
|---|---|---|---|---|---|---|
| In | [nama] | [unit] | [qty] | Rp [harga] | ≈ Rp [nilai] | [catatan] atau *"-"* |
| Out | [nama] | [unit] | [qty] | *"-"* | ≈ Rp [nilai] | [catatan] atau *"-"* |
| **Total In** | | | | | **≈ Rp [total_in]** | |
| **Total Out** | | | | | **≈ Rp [total_out]** | |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali ke Step [N] | link per section | Navigasi ke step yang relevan |
| Simpan Adjustment | button | Kirim seluruh FE state ke BE → BE proses satu transaction → redirect ke `SCR-STK-11` + toast *"Adjustment berhasil disimpan"* |

**States saat submit:**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner, semua input di-lock |
| Error dari BE | Toast error, user tetap di Step 3, FE state tidak hilang |
| Success | Redirect ke `SCR-STK-11` (Detail adjustment baru) + toast sukses |

---

### SCR-STK-11 · Adjustment Detail

**Route:** `/stock/adjustment/[id]`
**Akses:** Authenticated

> Semua field `[RO]`. Tidak bisa diedit atau dibatalkan.

#### Components

**Section: Info**
| Field | Source |
|---|---|
| Tanggal & Waktu | `stock_adjustments.adjustment_date` |
| Catatan | `stock_adjustments.notes` atau *"-"* |
| Dibuat pada | `stock_adjustments.created_at` |

**Section: Items**
| Kolom | Source |
|---|---|
| Tipe | `stock_adjustment_items.flow_type` — tampil sebagai *"Tambah (In)"* atau *"Kurang (Out)"* |
| Ingredient | `ingredients.name` |
| Unit | `ingredient_units.unit_name` |
| Qty | `stock_adjustment_items.quantity` |
| Harga/Unit | `stock_adjustment_items.unit_price` — hanya tampil jika `flow_type = 'in'` |
| Nilai | `stock_adjustment_items.subtotal` |
| Catatan | `stock_adjustment_items.notes` atau *"-"* |

**Footer:**
| Elemen | Source |
|---|---|
| Total Nilai In | SUM(`subtotal`) WHERE `flow_type = 'in'` |
| Total Nilai Out | SUM(`subtotal`) WHERE `flow_type = 'out'` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali | link | Kembali ke `SCR-STK-09` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-STK-09` + toast *"Data tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-STK-09 | Adjustment List | `/stock/adjustment` | Authenticated |
| SCR-STK-10 | Create Adjustment | `/stock/adjustment/new` | Authenticated |
| SCR-STK-11 | Adjustment Detail | `/stock/adjustment/[id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Semua side effects saat disimpan harus diproses dalam **satu DB transaction** — jika salah satu gagal, seluruh transaksi di-rollback |
| DEV-02 | Qty di `stock_adjustment_items` disimpan dalam unit pilihan user. BE kalkulasi konversi ke base_unit menggunakan `ingredient_units.conversion_factor` sebelum update `ingredients.stock_quantity`, `ingredient_batches`, dan `stock_logs` |
| DEV-03 | `flow_type = 'in'`: `unit_price` dari input user dikonversi ke base_unit (`unit_price / conversion_factor`) sebelum disimpan ke `ingredient_batches.cost_per_unit` |
| DEV-04 | `flow_type = 'out'`: `unit_price` di `stock_adjustment_items` = weighted average dari semua batch yang terpakai: SUM(batch_qty × cost_per_unit) / total_qty_base_unit |
| DEV-05 | `stock_logs` dibuat **per batch yang terpakai** untuk `flow_type = 'out'` — jika satu item span 2 batch, buat 2 baris stock_log dengan `reference_id` yang sama |
| DEV-06 | FIFO saat menyimpan `flow_type = 'out'`: kurangi `qty_remaining` dari batch dengan `purchase_date` terlama dulu. Jika qty melebihi satu batch, lanjut ke batch berikutnya |
| DEV-07 | Estimasi nilai di Step 2 untuk `flow_type = 'out'` dikalkulasi BE saat user selesai input qty (on blur) — endpoint terpisah. Untuk `flow_type = 'in'`: kalkulasi di FE (qty × harga input) |
| DEV-08 | Validasi qty `flow_type = 'out'` di Step 2 harus cek ketersediaan stok real-time — pertimbangkan race condition jika ada transaksi lain yang disimpan bersamaan |

---

*Version 1.0 — Created: 2026-03-25*
