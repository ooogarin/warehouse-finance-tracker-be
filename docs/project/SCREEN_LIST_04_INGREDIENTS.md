# Screen List — Ingredients & Units
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Ingredients & Units Management
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
├── merchant_id     → terikat ke merchant aktif [AUTO]
├── name            → required, unik per merchant (termasuk yang nonaktif)
├── category        → enum ingredient_category
├── base_unit       → satuan dasar, required
├── stock_quantity  → tidak bisa diedit manual, hasil kalkulasi sistem
├── min_stock       → batas minimum stok untuk alert
└── is_active       → true = aktif, false = nonaktif [SCHEMA CHANGE]

ingredient_units
├── ingredient_id     → terikat ke ingredient
├── unit_name         → nama satuan (misal: jerigen, karung, liter)
├── conversion_factor → jumlah base_unit dalam 1 unit ini
│                       misal: base_unit = ml, unit = jerigen, factor = 5000
│                       artinya 1 jerigen = 5000 ml
├── is_default        → unit yang dipakai sebagai tampilan default di list
├── description       → keterangan opsional
└── is_active         → true = aktif, false = nonaktif [SCHEMA CHANGE]
```

**Schema change yang diperlukan:**
- Tambah kolom `is_active BOOLEAN DEFAULT true` di tabel `ingredients`
- Tambah kolom `is_active BOOLEAN DEFAULT true` di tabel `ingredient_units`

---

## Aturan Bisnis

### Ingredient

| Kondisi | Aksi yang Diizinkan |
|---|---|
| Belum pernah dipakai | Edit semua field + Hard Delete |
| Sudah pernah dipakai | Edit semua field kecuali `base_unit` (di-lock) + Nonaktifkan |
| Nonaktif | Edit semua field + Aktifkan kembali — tidak bisa dihapus jika sudah pernah dipakai |

**"Sudah pernah dipakai"** = ada record di `purchase_items`, `stock_logs`, atau `ingredient_batches` dengan `ingredient_id` ini.

**Aturan nama unik per merchant (termasuk nonaktif):**
```
Tidak ada duplikat          → lanjut normal
Ada duplikat AKTIF          → error: "Ingredient dengan nama ini sudah ada"
Ada duplikat NONAKTIF       → wajib reaktivasi, tidak bisa buat baru
                              tampil warning + tombol [Aktifkan Kembali]
Sudah hard-delete sebelumnya → nama bebas dipakai kembali
```

**`base_unit` hanya bisa diedit jika belum pernah dipakai.** Jika sudah dipakai, field di-lock `[RO]` karena mengubah base unit akan merusak integritas data historis (`stock_quantity`, `ingredient_batches`, `stock_logs`).

**Saat `base_unit` diubah (ingredient belum pernah dipakai):**
- Semua unit konversi yang sudah ditambahkan otomatis dihapus
- Tampil warning konfirmasi sebelum diproses:
  > *"Mengubah satuan dasar akan menghapus semua unit konversi yang sudah ditambahkan. Anda perlu menambahkannya kembali."*
  > `[Lanjut]` `[Batal]`

---

### Unit (ingredient_units)

Behaviour sama persis dengan ingredient:

| Kondisi | Aksi yang Diizinkan |
|---|---|
| Belum pernah dipakai di `purchase_items` | Edit + Hard Delete |
| Sudah pernah dipakai di `purchase_items` | Edit + Nonaktifkan — tidak bisa dihapus |
| Nonaktif | Edit + Aktifkan kembali |

**Aturan nama unik per ingredient:**
```
Tidak ada duplikat    → lanjut normal
Ada duplikat AKTIF    → error: "Unit dengan nama ini sudah ada"
Ada duplikat NONAKTIF → wajib reaktivasi, tidak bisa buat baru
                        tampil warning + tombol [Aktifkan Kembali]
```

**Visibilitas unit di dropdown operasional (PO, penggunaan stok):**
```
Unit aktif   → muncul di dropdown, bisa dipilih
Unit nonaktif → tidak muncul di dropdown, operasional hanya bisa dikelola di SCR-ING-03 (Edit Ingredient)
```

**Base unit (conversion_factor = 1):**
- Tidak bisa dihapus — tombol Hapus selalu disembunyikan
- Tidak bisa dinonaktifkan — toggle status disembunyikan
- Nama unit ikut berubah otomatis jika `base_unit` di Section 1 diubah `[AUTO]`

---

## SECTION — INGREDIENTS MANAGEMENT

---

### SCR-ING-01 · Ingredients List

**Route:** `/ingredients`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Search | text input | Filter list by `ingredients.name` |
| Filter Kategori | dropdown | All / Vegetables / Meat / Seafood / Spices / Oil / Grains / Liquid / Other |
| Tambah Ingredient | button | Navigasi ke `SCR-ING-02` |

**List: Ingredient Rows**

Urutan tampilan:
```
1. Ingredient aktif (is_active = true)   → urut alphabetical
2. Ingredient nonaktif (is_active = false) → urut alphabetical, tampil di bawah
```

Visual differentiator:
- Aktif → tampilan normal
- Nonaktif → background redup/abu-abu + badge *"Nonaktif"*

Data per row:
| Field | Source | Tampil jika |
|---|---|---|
| Nama | `ingredients.name` | Selalu |
| Kategori | `ingredients.category` | Selalu |
| Stok Saat Ini | `ingredients.stock_quantity` + `ingredient_units.unit_name` WHERE `is_default = true` AND `is_active = true` | Selalu |
| Min Stok | `ingredients.min_stock` + unit default | Selalu |
| Status Stok | derived: `stock_quantity = 0` → badge *"Habis"* (merah) / `stock_quantity <= min_stock` → badge *"Stok Rendah"* (kuning) | Hanya jika `is_active = true` |
| Badge Nonaktif | — | Hanya jika `is_active = false` |

Action per row:
| Label | Trigger | Kondisi tampil | Behaviour |
|---|---|---|---|
| Edit | button | Selalu | Navigasi ke `SCR-ING-03` |
| Hapus | button | Hanya jika belum pernah dipakai | Confirmation dialog → Hard Delete → refresh list |

> **Cek "belum pernah dipakai":** BE query `purchase_items`, `stock_logs`, `ingredient_batches` by `ingredient_id`. Jika semua kosong → tampilkan tombol Hapus. Jika ada → sembunyikan tombol Hapus.

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton rows |
| Empty (belum ada ingredient) | Ilustrasi + *"Belum ada bahan baku. Tambah ingredient pertama Anda."* + button Tambah |
| Empty (hasil search/filter) | *"Ingredient tidak ditemukan"* |
| Error | Toast error |

---

### SCR-ING-02 · Add Ingredient

**Route:** `/ingredients/new`
**Akses:** Authenticated

#### Components

**Section 1 — Data Dasar**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Ingredient | text input | `[R]` max 100 karakter, unik per merchant | `ingredients.name` |
| Kategori | dropdown | `[R]` Vegetables / Meat / Seafood / Spices / Oil / Grains / Liquid / Other | `ingredients.category` |
| Satuan Dasar (Base Unit) | text input | `[R]` max 50 karakter, free text — contoh: *ml, gram, pcs* | `ingredients.base_unit` |
| Minimum Stok | number input | `[R]` min 0 | `ingredients.min_stock` |

> `ingredients.stock_quantity` di-set `0` `[AUTO]` saat pertama dibuat.
> `ingredients.is_active` di-set `true` `[AUTO]`.
> `ingredients.merchant_id` di-set dari merchant aktif `[AUTO]`.

**Section 2 — Unit Konversi**

> Saat user mengisi field `Satuan Dasar` di Section 1, Section 2 otomatis menampilkan satu baris base unit `[AUTO]`:
> - `unit_name` = nilai yang diketik di Satuan Dasar
> - `conversion_factor` = 1
> - `is_default` = true
> - Baris ini `[RO]` — tidak bisa diedit atau dihapus di Section 2
>
> User hanya perlu tambah unit konversi tambahan jika diperlukan.

**Helper text:**
> *"Faktor konversi = jumlah [base_unit] dalam 1 unit ini. Contoh: base unit ml, unit jerigen, faktor 5000 → artinya 1 jerigen = 5000 ml."*

Tabel unit tambahan (opsional, bisa lebih dari satu):
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Unit | text input | `[R]` max 50 karakter, unik per ingredient | `ingredient_units.unit_name` |
| Faktor Konversi | number input | `[R]` > 0 | `ingredient_units.conversion_factor` |
| Jadikan Default | checkbox | `[O]` hanya satu unit yang bisa jadi default | `ingredient_units.is_default` |
| Keterangan | text input | `[O]` max 200 karakter | `ingredient_units.description` |

Action di tabel unit:
| Label | Trigger | Kondisi | Behaviour |
|---|---|---|---|
| + Tambah Unit | button | Selalu | Tambah baris baru |
| Hapus | button per baris | Hanya untuk non-base unit | Hapus baris dari form (belum ke DB) |

**Duplikat name check (on blur field Nama Ingredient):**
```
Tidak ada duplikat    → lanjut normal
Ada duplikat AKTIF    → inline error: "Ingredient dengan nama ini sudah ada"
Ada duplikat NONAKTIF → inline warning:
                        "Ingredient ini pernah ada tapi dinonaktifkan. Aktifkan kembali untuk melanjutkan."
                        [Aktifkan Kembali] → navigasi ke SCR-ING-03 ingredient tersebut
```

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → redirect ke `SCR-ING-01` + toast *"Ingredient berhasil ditambahkan"* |
| Batal | button/link | Kembali ke `SCR-ING-01` tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error |
| Success | Redirect ke `SCR-ING-01` + toast sukses |

---

### SCR-ING-03 · Edit Ingredient

**Route:** `/ingredients/[id]/edit`
**Akses:** Authenticated

> Semua perubahan terpusat di sini — edit informasi, kelola unit, dan toggle status aktif/nonaktif.
> Ingredient nonaktif tetap bisa diedit tanpa perlu diaktifkan dulu.
> Form pre-filled dengan data ingredient yang dipilih.

#### Components

**Section 1 — Data Dasar**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Ingredient | text input | `[R]` max 100 karakter, unik per merchant | `ingredients.name` |
| Kategori | dropdown | `[R]` | `ingredients.category` |
| Satuan Dasar (Base Unit) | dropdown (pilihan dari `ingredient_units` milik ingredient ini) | `[R]` jika belum pernah dipakai / `[RO]` jika sudah pernah dipakai | `ingredients.base_unit` |
| Minimum Stok | number input | `[R]` min 0 | `ingredients.min_stock` |
| Status | toggle | `[R]` Aktif / Nonaktif | `ingredients.is_active` |

> Jika `base_unit` diubah (hanya bisa jika belum pernah dipakai), tampil warning konfirmasi:
> *"Mengubah satuan dasar akan menghapus semua unit konversi yang sudah ditambahkan. Anda perlu menambahkannya kembali."*
> `[Lanjut]` `[Batal]`
> Jika user konfirmasi → semua unit non-base di Section 2 dihapus, baris base unit diupdate `[AUTO]`.

**Section 2 — Unit List**

Tampil **semua unit** milik ingredient ini, termasuk yang nonaktif.

Urutan tampilan:
```
1. Base unit (conversion_factor = 1) → selalu paling atas
2. Unit aktif lainnya → urut alphabetical
3. Unit nonaktif → urut alphabetical, tampil di bawah dengan visual berbeda
```

Visual differentiator unit:
- Aktif → tampilan normal
- Nonaktif → background redup/abu-abu + badge *"Nonaktif"*

Data per baris unit:
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Unit | text input | `[R]` max 50 karakter, unik per ingredient | `ingredient_units.unit_name` |
| Faktor Konversi | number input | `[R]` > 0 | `ingredient_units.conversion_factor` |
| Jadikan Default | checkbox | `[O]` hanya satu yang bisa jadi default | `ingredient_units.is_default` |
| Keterangan | text input | `[O]` max 200 karakter | `ingredient_units.description` |
| Status | toggle | `[R]` Aktif / Nonaktif — disembunyikan untuk base unit | `ingredient_units.is_active` |

Action per baris unit:
| Label | Trigger | Kondisi tampil | Behaviour |
|---|---|---|---|
| Hapus | button | Hanya jika non-base unit AND belum pernah dipakai di `purchase_items` | Confirmation dialog → Hard Delete baris unit → refresh Section 2 |

> Base unit: tombol Hapus dan toggle Status selalu disembunyikan.

**Duplikat name check (on blur field Nama Ingredient):**
```
Ada duplikat AKTIF (bukan diri sendiri)    → inline error: "Ingredient dengan nama ini sudah ada"
Ada duplikat NONAKTIF (bukan diri sendiri) → inline warning:
                                             "Ada ingredient nonaktif dengan nama yang sama.
                                              Gunakan nama lain atau nonaktifkan ingredient ini lalu aktifkan kembali yang sudah ada."
```

**Duplikat name check unit (on blur field Nama Unit):**
```
Tidak ada duplikat    → lanjut normal
Ada duplikat AKTIF    → inline error: "Unit dengan nama ini sudah ada"
Ada duplikat NONAKTIF → inline warning:
                        "Unit ini pernah ada tapi dinonaktifkan.
                         Aktifkan kembali melalui toggle status di baris unit tersebut."
```

Action tambah unit baru:
| Label | Trigger | Behaviour |
|---|---|---|
| + Tambah Unit | button | Tambah baris baru di bagian bawah Section 2 (di atas unit nonaktif) |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan Perubahan | submit | Validasi → PATCH ke BE → redirect ke `SCR-ING-01` + toast *"Ingredient berhasil diperbarui"* |
| Batal | button/link | Kembali ke `SCR-ING-01` tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading data | Skeleton form |
| Error: ingredient tidak ditemukan | Redirect ke `SCR-ING-01` + toast *"Ingredient tidak ditemukan"* |
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error |
| Success | Redirect ke `SCR-ING-01` + toast sukses |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-ING-01 | Ingredients List | `/ingredients` | Authenticated |
| SCR-ING-02 | Add Ingredient | `/ingredients/new` | Authenticated |
| SCR-ING-03 | Edit Ingredient | `/ingredients/[id]/edit` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Endpoint GET ingredient detail (untuk Edit) harus kembalikan flag `is_used` (sudah pernah dipakai) dan `is_base_unit_editable` agar FE bisa lock field `base_unit` dan tombol Hapus/toggle unit |
| DEV-02 | Cek "belum pernah dipakai" untuk ingredient: query `purchase_items`, `stock_logs`, `ingredient_batches` by `ingredient_id` |
| DEV-03 | Cek "belum pernah dipakai" untuk unit: query `purchase_items` by `ingredient_unit_id` |
| DEV-04 | Duplikat check (nama ingredient dan nama unit) dilakukan on blur di FE (optimistic) dan wajib divalidasi ulang di BE saat submit |
| DEV-05 | Jika `base_unit` diubah di Edit: hapus semua `ingredient_units` WHERE `conversion_factor != 1`, lalu update `ingredient_units` WHERE `conversion_factor = 1` dengan `unit_name` baru — semua dalam satu transaction |

---

*Version 1.0 — Updated: 2026-03-24*
