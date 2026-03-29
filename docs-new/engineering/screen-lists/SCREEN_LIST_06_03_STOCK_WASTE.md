# Screen List — Stock Waste
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Stock Waste only
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
stock_usages
├── merchant_id  → terikat ke merchant aktif [AUTO]
├── type         → 'waste' (fixed untuk scope ini)
├── usage_date   → tanggal & waktu waste dilaporkan
└── notes        → opsional

stock_usage_items
├── stock_usage_id     → terikat ke stock_usage
├── ingredient_id      → ingredient yang waste
├── ingredient_unit_id → unit yang dipilih user
├── quantity           → qty dalam unit pilihan user
├── unit_price         → weighted average dari FIFO [AUTO]
├── subtotal           → quantity × unit_price [AUTO/GENERATED]
└── notes              → alasan waste (opsional, free text)
```

---

## Aturan Bisnis

- Waste bersifat final setelah disimpan — tidak bisa diedit atau dibatalkan
- Dropdown ingredient hanya tampilkan `is_active = true`
- Dropdown unit hanya tampilkan `ingredient_units.is_active = true` milik ingredient yang dipilih
- Qty tidak boleh melebihi `ingredients.stock_quantity` yang tersedia
- `unit_price` diisi `[AUTO]` oleh BE sebagai weighted average dari FIFO batch — tidak ditampilkan di form
- Estimasi nilai waste ditampilkan saat user input qty — dikalkulasi BE, bersifat estimasi
- Minimal 1 item wajib ada sebelum bisa lanjut ke Review
- `stock_usages.type` di-set `'waste'` `[AUTO]`
- `stock_usage_items.notes` digunakan untuk alasan waste (free text, opsional)

**Side effects saat Waste disimpan — semua dalam satu DB transaction:**
```
1. Buat stock_usages (type = 'waste')
2. Buat stock_usage_items (per item)
3. Per item, kalkulasi konversi qty ke base_unit
4. Kurangi ingredient_batches.qty_remaining (FIFO — batch tertua dulu)
   → Jika qty span lebih dari satu batch, buat satu stock_log per batch
5. Update ingredients.stock_quantity (-qty dalam base_unit)
6. Buat stock_logs per batch yang terpakai:
   flow_type          = 'out'
   reference_type     = 'waste'
   reference_id       = stock_usages.id
   base_unit_quantity = qty dari batch ini (dalam base_unit)
   base_unit_price    = cost_per_unit dari batch ini
   balance_after      = stock_quantity setelah dikurangi
```

---

## SECTION — STOCK WASTE

---

### SCR-STK-06 · Waste List

**Route:** `/stock/waste`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Filter Tanggal | date range picker | Filter by `stock_usages.usage_date` — Today / This Week / This Month / Custom |
| Laporkan Waste | button | Navigasi ke `SCR-STK-07` |

**List: Waste Cards**

Data per card:
| Field | Source | Tampil jika |
|---|---|---|
| Tanggal & Waktu | `stock_usages.usage_date` | Selalu |
| Jumlah Item | COUNT `stock_usage_items` per usage | Selalu |
| Total Nilai Waste | SUM(`stock_usage_items.subtotal`) | Selalu |
| Catatan | `stock_usages.notes` | Hanya jika tidak null |

Action per card:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik card) | tap/click | Navigasi ke `SCR-STK-08` (Detail) |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton cards |
| Empty | Ilustrasi + *"Belum ada laporan waste."* + button Laporkan Waste |
| Empty (hasil filter) | *"Tidak ada laporan waste pada periode ini"* |
| Error | Toast error |

---

### SCR-STK-07 · Create Waste

**Route:** `/stock/waste/new`
**Akses:** Authenticated

> Data setiap step disimpan di **FE state**.
> Seluruh data dikirim ke BE dalam **satu payload** saat user submit di step Review.
> BE memproses semua side effects dalam satu DB transaction.
> User bisa navigasi bebas maju/mundur antar step — FE state tetap terjaga.

**Banner informasi (tampil permanen di semua step):**
> ⚠️ *"Data waste yang sudah disimpan tidak dapat diubah."*

---

#### Step 1 — Info

**Progress Indicator:** Step 1 dari 3

**Form: Info Waste**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Tanggal & Waktu | datetime picker | `[R]` default waktu saat ini, bisa diedit | `stock_usages.usage_date` |
| Catatan | textarea | `[O]` catatan umum untuk sesi waste ini | `stock_usages.notes` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Lanjut | submit | Validasi → simpan ke FE state → navigasi ke Step 2 |

---

#### Step 2 — Items

**Progress Indicator:** Step 2 dari 3

> Minimal 1 item wajib ada sebelum bisa lanjut ke Step 3.

**Tabel Items**

Header tabel: Ingredient / Unit / Qty / Estimasi Nilai / Keterangan / Aksi

Per baris item:
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Ingredient | dropdown + search | `[R]` hanya `is_active = true` | `stock_usage_items.ingredient_id` |
| Unit | dropdown | `[R]` tampil setelah ingredient dipilih, hanya `ingredient_units.is_active = true` | `stock_usage_items.ingredient_unit_id` |
| Qty | number input | `[R]` > 0, tidak boleh melebihi stok tersedia dalam unit yang dipilih | `stock_usage_items.quantity` |
| Estimasi Nilai | number | `[RO]` `[AUTO]` kalkulasi BE dari FIFO — tampil setelah qty diisi. Label: *"≈ Rp [nilai]"* dengan keterangan kecil *"Dikalkulasi dari harga pembelian"* | — (display only) |
| Keterangan | text input | `[O]` alasan waste, free text — contoh: *"Kadaluarsa"*, *"Tumpah"*, *"Gosong"* | `stock_usage_items.notes` |

> `unit_price` tidak ditampilkan di form — diisi `[AUTO]` oleh BE (weighted average FIFO) saat disimpan.

**Validasi qty:**
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
| Total Estimasi Nilai Waste | Sum semua Estimasi Nilai `[AUTO]` |

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
| Tanggal & Waktu | `usage_date` |
| Catatan | nilai atau *"-"* jika kosong |

**Section: Items**
| Ingredient | Unit | Qty | Estimasi Nilai | Keterangan |
|---|---|---|---|---|
| [nama] | [unit] | [qty] | ≈ Rp [nilai] | [keterangan] atau *"-"* |
| **Total Estimasi Nilai Waste** | | | **≈ Rp [total]** | |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali ke Step [N] | link per section | Navigasi ke step yang relevan |
| Simpan Waste | button | Kirim seluruh FE state ke BE → BE proses satu transaction → redirect ke `SCR-STK-08` + toast *"Waste berhasil dilaporkan"* |

**States saat submit:**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner, semua input di-lock |
| Error dari BE | Toast error, user tetap di Step 3, FE state tidak hilang |
| Success | Redirect ke `SCR-STK-08` (Detail waste baru) + toast sukses |

---

### SCR-STK-08 · Waste Detail

**Route:** `/stock/waste/[id]`
**Akses:** Authenticated

> Semua field `[RO]`. Tidak bisa diedit atau dibatalkan.

#### Components

**Section: Info**
| Field | Source |
|---|---|
| Tanggal & Waktu | `stock_usages.usage_date` |
| Catatan | `stock_usages.notes` atau *"-"* |
| Dibuat pada | `stock_usages.created_at` |

**Section: Items**
| Kolom | Source |
|---|---|
| Ingredient | `ingredients.name` |
| Unit | `ingredient_units.unit_name` |
| Qty | `stock_usage_items.quantity` |
| Nilai Waste | `stock_usage_items.subtotal` |
| Keterangan | `stock_usage_items.notes` atau *"-"* |
| **Total Nilai Waste** | SUM(`stock_usage_items.subtotal`) |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali | link | Kembali ke `SCR-STK-06` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-STK-06` + toast *"Data tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-STK-06 | Waste List | `/stock/waste` | Authenticated |
| SCR-STK-07 | Create Waste | `/stock/waste/new` | Authenticated |
| SCR-STK-08 | Waste Detail | `/stock/waste/[id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Semua side effects saat disimpan harus diproses dalam **satu DB transaction** — jika salah satu gagal, seluruh transaksi di-rollback |
| DEV-02 | Qty di `stock_usage_items` disimpan dalam unit pilihan user. BE kalkulasi konversi ke base_unit menggunakan `ingredient_units.conversion_factor` sebelum update `ingredients.stock_quantity`, `ingredient_batches.qty_remaining`, dan `stock_logs` |
| DEV-03 | `unit_price` di `stock_usage_items` = weighted average dari semua batch yang terpakai: SUM(batch_qty × cost_per_unit) / total_qty_base_unit |
| DEV-04 | `stock_logs` dibuat **per batch yang terpakai** (bukan per item) — jika satu item span 2 batch, buat 2 baris stock_log dengan `reference_id` yang sama |
| DEV-05 | FIFO saat menyimpan: kurangi `qty_remaining` dari batch dengan `purchase_date` terlama dulu. Jika qty melebihi satu batch, lanjut ke batch berikutnya hingga qty terpenuhi |
| DEV-06 | Estimasi nilai di Step 2 dikalkulasi BE saat user selesai input qty (on blur) — endpoint terpisah, tidak perlu submit form |
| DEV-07 | Validasi qty di Step 2 harus cek ketersediaan stok real-time — pertimbangkan race condition jika ada transaksi lain yang disimpan bersamaan |

---

*Version 1.0 — Created: 2026-03-25*
