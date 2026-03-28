# Screen List — Purchase Orders
**Project:** Pengelola Modal Dapur
**Version:** 1.1
**Scope:** Purchase Orders only
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
purchase_orders
├── merchant_id    → terikat ke merchant aktif [AUTO]
├── supplier_id    → opsional (nullable)
├── purchase_date  → tanggal pembelian aktual
├── invoice_number → opsional
├── total_amount   → auto-kalkulasi dari purchase_items
├── paid_cash      → bayar dari kas resto
├── paid_owner     → bayar dari kantong owner (talangan)
├── debt_amount    → hutang ke supplier
└── notes          → opsional
    CONSTRAINT: paid_cash + paid_owner + debt_amount = total_amount

purchase_items
├── purchase_order_id  → terikat ke PO
├── ingredient_id      → ingredient yang dibeli
├── ingredient_unit_id → unit pembelian
├── quantity           → jumlah yang dibeli
├── unit_price         → harga per unit
└── subtotal           → quantity × unit_price [AUTO/GENERATED]
```

---

## Aturan Bisnis

**PO bersifat final setelah disimpan — tidak bisa diedit atau dibatalkan.**
Informasi ini ditampilkan di awal sebelum user mulai mengisi form.

**Supplier:**
```
Supplier dipilih   → paid_cash, paid_owner, debt_amount bebas dikombinasikan
Tanpa supplier     → debt_amount harus = 0 (hutang hanya bisa dicatat jika ada supplier)
```

**Pembayaran — paid_owner vs debt_amount:**
```
paid_owner   → hutang resto ke owner (talangan)
               tidak terikat supplier
               bebas dipakai dengan atau tanpa supplier

debt_amount  → hutang resto ke supplier
               hanya bisa jika supplier dipilih
```

**Constraint pembayaran:**
```
paid_cash + paid_owner + debt_amount = total_amount (selalu)
Semua nilai >= 0
```

**Items:**
- Minimal 1 item wajib ada sebelum bisa lanjut ke Step 3
- Dropdown ingredient hanya tampilkan `is_active = true`
- Dropdown unit hanya tampilkan `ingredient_units.is_active = true` milik ingredient yang dipilih

**Side effects saat PO disimpan — semua dalam satu DB transaction:**
```
1. Buat purchase_orders
2. Buat purchase_items (per item)
3. Update ingredients.stock_quantity (+qty dalam base_unit) per item
4. Buat ingredient_batches per item (untuk FIFO tracking)
5. Buat stock_logs movement_type='in', reference_type='purchase' per item

6. Jika paid_cash > 0:
   → Buat cash_logs flow_type='out', category='purchase_payment'
   → Update merchants.cash_balance (-paid_cash)

7. Jika paid_owner > 0:
   → Buat debts:
      creditor_type = 'owner'
      total_amount  = paid_owner
      purchase_order_id = PO yang baru dibuat
      debt_date = purchase_date
      status = 'unpaid'

8. Jika debt_amount > 0:
   → Buat debts:
      creditor_type     = 'supplier'
      supplier_id       = purchase_orders.supplier_id
      total_amount      = debt_amount
      purchase_order_id = PO yang baru dibuat
      debt_date         = purchase_date
      status            = 'unpaid'
```

---

## SECTION — PURCHASE ORDERS

---

### SCR-PO-01 · Purchase Orders List

**Route:** `/purchase-orders`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Search | text input | Filter by `suppliers.name` atau `purchase_orders.invoice_number` |
| Filter Supplier | dropdown | Filter by supplier — All / [daftar supplier aktif] / *"Tanpa Supplier"* |
| Filter Tanggal | date range picker | Filter by `purchase_orders.purchase_date` — Today / This Week / This Month / Custom |
| Buat PO | button | Navigasi ke `SCR-PO-02` |

**List: PO Cards**

Data per card:
| Field | Source | Tampil jika |
|---|---|---|
| Tanggal | `purchase_orders.purchase_date` | Selalu |
| Supplier | `suppliers.name` | Jika `supplier_id` tidak null |
| Label *"Tanpa Supplier"* | — | Jika `supplier_id` null |
| No. Invoice | `purchase_orders.invoice_number` | Selalu |
| Total | `purchase_orders.total_amount` | Selalu |
| Status Bayar | derived: `debt_amount = 0` → badge *"Lunas"* (hijau) / `debt_amount > 0` AND ada pembayaran di `debt_payments` → badge *"Sebagian"* (kuning) / `debt_amount > 0` AND tidak ada pembayaran → badge *"Belum Lunas"* (merah) | Selalu |

Action per card:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik card) | tap/click | Navigasi ke `SCR-PO-03` (Detail) |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton cards |
| Empty (belum ada PO) | Ilustrasi + *"Belum ada purchase order. Buat PO pertama Anda."* + button Buat PO |
| Empty (hasil search/filter) | *"Purchase order tidak ditemukan"* |
| Error | Toast error |

---

### SCR-PO-02 · Create Purchase Order

**Route:** `/purchase-orders/new`
**Akses:** Authenticated

> Data setiap step disimpan di **FE state**.
> Seluruh data dikirim ke BE dalam **satu payload** saat user submit di Step 4.
> BE memproses semua side effects dalam satu DB transaction.
> User bisa navigasi bebas maju/mundur antar step — data FE state tetap terjaga.

**Banner informasi (tampil permanen di semua step):**
> ⚠️ *"Data purchase order yang sudah disimpan tidak dapat diubah. Pastikan semua informasi sudah benar sebelum menyimpan."*

---

#### Step 1 — Info PO

**Progress Indicator:** Step 1 dari 4

**Form: Info PO**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Supplier | dropdown + search | `[O]` pilihan dari `suppliers` milik merchant aktif. Ada opsi eksplisit *"Tanpa Supplier"* | `purchase_orders.supplier_id` |
| Tanggal & Waktu Beli | datetime picker | `[R]` default waktu saat ini, bisa diedit user | `purchase_orders.purchase_date` |
| No. Invoice | text input | `[O]` max 50 karakter | `purchase_orders.invoice_number` |
| Catatan | textarea | `[O]` | `purchase_orders.notes` |

> `purchase_orders.invoice_number` di-set otomatis dengan format `PO-[YYYYMMDD]-[sequence]` `[AUTO]` jika User tidak memasukkan nilai.

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Lanjut | submit | Validasi → simpan ke FE state → navigasi ke Step 2 |

---

#### Step 2 — Items

**Progress Indicator:** Step 2 dari 4

> Minimal 1 item wajib ada sebelum bisa lanjut ke Step 3.

**Tabel Items**

Header tabel: Ingredient / Unit / Qty / Harga Satuan / Subtotal / Aksi

Per baris item:
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Ingredient | dropdown + search | `[R]` hanya tampilkan `is_active = true` | `purchase_items.ingredient_id` |
| Unit | dropdown | `[R]` tampil setelah ingredient dipilih, hanya `ingredient_units.is_active = true` milik ingredient tersebut | `purchase_items.ingredient_unit_id` |
| Qty | number input | `[R]` > 0 | `purchase_items.quantity` |
| Harga Satuan | number input | `[R]` >= 0 | `purchase_items.unit_price` |
| Subtotal | number | `[RO]` qty × harga satuan `[AUTO]` | `purchase_items.subtotal` |

Action per baris:
| Label | Trigger | Behaviour |
|---|---|---|
| Hapus | button | Hapus baris dari FE state |

**Footer tabel:**
| Elemen | Source |
|---|---|
| Total Keseluruhan | Sum semua subtotal `[AUTO]` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| + Tambah Item | button | Tambah baris baru di tabel |
| Kembali | link | Navigasi ke Step 1 (FE state tetap terjaga) |
| Lanjut | button | Validasi minimal 1 item → simpan ke FE state → navigasi ke Step 3 |

**Validasi saat Lanjut:**
```
Tidak ada item → inline error di bawah tabel:
"Minimal 1 item harus ditambahkan"
```

---

#### Step 3 — Pembayaran

**Progress Indicator:** Step 3 dari 4

**Display: Total yang Harus Dibayar**
- Total Amount: `[RO]` diambil dari kalkulasi Step 2 `[AUTO]`

**Form: Pembayaran**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Bayar dari Kas (paid_cash) | number input | `[R]` min 0, default 0 | `purchase_orders.paid_cash` |
| Talangan Owner (paid_owner) | number input | `[R]` min 0, default 0 | `purchase_orders.paid_owner` |
| Hutang ke Supplier (debt_amount) | number input | `[R]` min 0, default 0. Hanya aktif jika supplier dipilih di Step 1 | `purchase_orders.debt_amount` |

> Jika tanpa supplier: field `debt_amount` di-lock `[RO]` dengan nilai 0 dan tampil info:
> *"Hutang hanya bisa dicatat jika supplier dipilih. Kembali ke Step 1 untuk memilih supplier."*

**Display: Sisa yang Belum Dialokasikan**
```
Sisa = total_amount - paid_cash - paid_owner - debt_amount
```
- Sisa = 0 → tampil hijau: *"Pembayaran sudah sesuai"*
- Sisa > 0 → tampil kuning: *"Masih ada Rp [sisa] yang belum dialokasikan"*
- Sisa < 0 → tampil merah: *"Total pembayaran melebihi total belanja"*

**Validasi saat Lanjut:**
```
paid_cash + paid_owner + debt_amount ≠ total_amount → tidak bisa lanjut
Tampil error: "Total pembayaran harus sama dengan total belanja"
```

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali | link | Navigasi ke Step 2 (FE state tetap terjaga) |
| Lanjut | button | Validasi → simpan ke FE state → navigasi ke Step 4 |

---

#### Step 4 — Review & Submit

**Progress Indicator:** Step 4 dari 4

> Halaman review semua data sebelum disimpan. Semua field `[RO]`.
> User bisa kembali ke step manapun jika ada yang perlu diubah.

**Section: Info PO**
| Field | Value |
|---|---|
| Supplier | Nama supplier atau *"Tanpa Supplier"* |
| Tanggal & Waktu Beli | `purchase_date` |
| No. Invoice | `invoice_number` |
| Catatan | nilai atau *"-"* jika kosong |

**Section: Items**
| Ingredient | Unit | Qty | Harga Satuan | Subtotal |
|---|---|---|---|---|
| [nama] | [unit] | [qty] | [harga] | [subtotal] |
| **Total** | | | | **[total_amount]** |

**Section: Pembayaran**
| Field | Value |
|---|---|
| Bayar dari Kas | Rp [paid_cash] |
| Talangan Owner | Rp [paid_owner] — hanya tampil jika > 0 |
| Hutang ke Supplier | Rp [debt_amount] — hanya tampil jika > 0 |
| **Total** | **Rp [total_amount]** |

**Section: Side Effects Preview**
> Informasi apa yang akan terjadi setelah PO disimpan:
- *"Stok [ingredient] akan bertambah [qty] [unit]"* — per item
- *"Kas akan berkurang Rp [paid_cash]"* — jika paid_cash > 0
- *"Hutang ke owner Rp [paid_owner] akan tercatat"* — jika paid_owner > 0
- *"Hutang ke [supplier] Rp [debt_amount] akan tercatat"* — jika debt_amount > 0

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kembali ke Step [N] | link per section | Navigasi ke step yang relevan |
| Simpan Purchase Order | button | Kirim seluruh FE state ke BE → BE proses satu transaction → redirect ke `SCR-PO-03` (Detail PO baru) + toast *"Purchase order berhasil disimpan"* |

**States saat submit:**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner, semua input di-lock |
| Error dari BE | Toast error, user tetap di Step 4, FE state tidak hilang |
| Success | Redirect ke `SCR-PO-03` + toast sukses |

---

### SCR-PO-03 · Purchase Order Detail

**Route:** `/purchase-orders/[id]`
**Akses:** Authenticated

> Semua field `[RO]`. PO tidak bisa diedit atau dibatalkan.

#### Components

**Section: Info PO**
| Field | Source |
|---|---|
| Tanggal & Waktu Beli | `purchase_orders.purchase_date` |
| Supplier | `suppliers.name` atau *"Tanpa Supplier"* |
| No. Invoice | `purchase_orders.invoice_number` |
| Catatan | `purchase_orders.notes` atau *"-"* |
| Dibuat pada | `purchase_orders.created_at` |

**Section: Items**
| Kolom | Source |
|---|---|
| Ingredient | `ingredients.name` |
| Unit | `ingredient_units.unit_name` |
| Qty | `purchase_items.quantity` |
| Harga Satuan | `purchase_items.unit_price` |
| Subtotal | `purchase_items.subtotal` |
| **Total** | `purchase_orders.total_amount` |

**Section: Pembayaran**
| Field | Source |
|---|---|
| Bayar dari Kas | `purchase_orders.paid_cash` |
| Talangan Owner | `purchase_orders.paid_owner` — hanya tampil jika > 0 |
| Hutang ke Supplier | `purchase_orders.debt_amount` — hanya tampil jika > 0 |
| Status Bayar | derived dari `debts` terkait (Lunas / Sebagian / Belum Lunas) |

**Section: Riwayat Pembayaran Hutang**
> Hanya tampil jika `debt_amount > 0`.
> Data dari `debt_payments` WHERE `debt_id` = debt yang terkait PO ini.

| Kolom | Source |
|---|---|
| Tanggal | `debt_payments.created_at` |
| Jumlah | `debt_payments.amount` |
| Metode | `debt_payments.payment_method` |
| No. Referensi | `debt_payments.reference_number` atau *"-"* |
| Catatan | `debt_payments.notes` atau *"-"* |

**Actions**
| Label | Trigger | Kondisi | Behaviour |
|---|---|---|---|
| Bayar Hutang | button | Hanya jika `debt_amount > 0` AND hutang belum lunas | Navigasi ke `SCR-DEBT-XX` (Payment Modal) dengan pre-fill debt yang terkait |
| Kembali | link | Selalu | Kembali ke `SCR-PO-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-PO-01` + toast *"Purchase order tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-PO-01 | Purchase Orders List | `/purchase-orders` | Authenticated |
| SCR-PO-02 | Create Purchase Order | `/purchase-orders/new` | Authenticated |
| SCR-PO-03 | Purchase Order Detail | `/purchase-orders/[id]` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Semua side effects saat PO disimpan harus diproses dalam **satu DB transaction** — jika salah satu gagal, seluruh transaksi di-rollback |
| DEV-02 | Qty item di `purchase_items` disimpan dalam unit yang dipilih user (`ingredient_unit_id`). BE harus kalkulasi konversi ke `base_unit` menggunakan `ingredient_units.conversion_factor` sebelum: (1) update `ingredients.stock_quantity`, (2) membuat `ingredient_batches`, dan (3) membuat `stock_logs` — semua nilai qty dan harga di ketiga tabel ini harus dalam `base_unit` |
| DEV-03 | `ingredient_batches.cost_per_unit` disimpan dalam `base_unit` — kalkulasi: `unit_price / conversion_factor` |
| DEV-04 | Status bayar di SCR-PO-01 list adalah derived data — query `debts` dan `debt_payments` by `purchase_order_id` |
| DEV-05 | Tombol "Bayar Hutang" di SCR-PO-03 mengarah ke debt yang terkait PO ini — query `debts` WHERE `purchase_order_id = [id]` AND `creditor_type = 'supplier'` |

---

*Version 1.1 — Updated: 2026-03-24*
