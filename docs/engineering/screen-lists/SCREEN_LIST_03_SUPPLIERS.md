# Screen List — Suppliers Management
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Suppliers Management only
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
suppliers
├── merchant_id    → terikat ke merchant aktif [AUTO]
├── name           → required
├── phone          → optional
├── address        → optional
└── notes          → optional
```

**Catatan penting:**
- Semua data supplier terikat ke `merchant_id` — user hanya melihat supplier milik merchant aktif
- Delete menggunakan soft delete (`deleted_at`) — data tidak benar-benar dihapus dari DB
- `Last Order Date` adalah derived data — hasil query dari `purchase_orders` berdasarkan `supplier_id`, bukan kolom di tabel `suppliers`

---

## SECTION — SUPPLIERS MANAGEMENT

---

### SCR-SUP-01 · Suppliers List

**Route:** `/suppliers`
**Akses:** Authenticated

#### Components

**Toolbar**
| Elemen | Type | Behaviour |
|---|---|---|
| Search | text input | Filter list by `suppliers.name` atau `suppliers.phone` (client-side atau query param) |
| Tambah Supplier | button | Navigasi ke `SCR-SUP-02` |

**List: Supplier Cards**

Data per card:
| Field | Source | Tampil jika |
|---|---|---|
| Nama | `suppliers.name` | Selalu |
| Nomor HP | `suppliers.phone` | Hanya jika tidak null |
| Alamat | `suppliers.address` | Hanya jika tidak null |
| Last Order Date | derived dari `purchase_orders.purchase_date` WHERE `supplier_id` | Hanya jika ada riwayat PO |

Action per card:
| Label | Trigger | Behaviour |
|---|---|---|
| (klik card) | tap/click | Navigasi ke `SCR-SUP-04` (Detail) |
| Edit | button | Navigasi ke `SCR-SUP-03` |
| Hapus | button | Tampil confirmation dialog → konfirmasi → soft delete (`suppliers.deleted_at`) |
| WhatsApp | button | Buka `https://wa.me/[phone]` di tab baru. Hanya tampil jika `suppliers.phone` tidak null |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton card |
| Empty (belum ada supplier) | Ilustrasi + teks *"Belum ada supplier. Tambah supplier pertama Anda."* + button Tambah Supplier |
| Empty (hasil search) | Teks *"Supplier tidak ditemukan"* |
| Error | Toast error |

---

### SCR-SUP-02 · Add Supplier

**Route:** `/suppliers/new`
**Akses:** Authenticated

#### Components

**Form: Tambah Supplier**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Supplier | text input | `[R]` max 100 karakter | `suppliers.name` |
| Nomor HP | tel input | `[O]` max 20 karakter | `suppliers.phone` |
| Alamat | textarea | `[O]` | `suppliers.address` |
| Catatan | textarea | `[O]` contoh: *"Buka sampai jam 9, bisa kredit"* | `suppliers.notes` |

> `suppliers.merchant_id` di-set otomatis dari merchant aktif `[AUTO]`.

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan | submit | Validasi → POST ke BE → redirect ke `SCR-SUP-01` + toast *"Supplier berhasil ditambahkan"* |
| Batal | button/link | Kembali ke `SCR-SUP-01` tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error |
| Success | Redirect ke `SCR-SUP-01` + toast sukses |

---

### SCR-SUP-03 · Edit Supplier

**Route:** `/suppliers/[id]/edit`
**Akses:** Authenticated

> Form pre-filled dengan data supplier yang dipilih.

#### Components

**Form: Edit Supplier**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Supplier | text input | `[R]` max 100 karakter | `suppliers.name` |
| Nomor HP | tel input | `[O]` max 20 karakter | `suppliers.phone` |
| Alamat | textarea | `[O]` | `suppliers.address` |
| Catatan | textarea | `[O]` | `suppliers.notes` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan Perubahan | submit | Validasi → PATCH ke BE → redirect ke `SCR-SUP-01` + toast *"Supplier berhasil diperbarui"* |
| Batal | button/link | Kembali ke `SCR-SUP-01` tanpa menyimpan |

**States**
| State | Tampilan |
|---|---|
| Loading data | Skeleton form |
| Error: supplier tidak ditemukan | Redirect ke `SCR-SUP-01` + toast *"Supplier tidak ditemukan"* |
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Success | Redirect ke `SCR-SUP-01` + toast sukses |

---

### SCR-SUP-04 · Supplier Detail

**Route:** `/suppliers/[id]`
**Akses:** Authenticated

#### Components

**Section: Info Supplier**
| Field | Source | Tampil jika |
|---|---|---|
| Nama | `suppliers.name` | Selalu |
| Nomor HP | `suppliers.phone` | Hanya jika tidak null |
| Alamat | `suppliers.address` | Hanya jika tidak null |
| Catatan | `suppliers.notes` | Hanya jika tidak null |
| Terdaftar sejak | `suppliers.created_at` | Selalu |

**Section: Riwayat Purchase Order**

> Derived data — query dari `purchase_orders` WHERE `supplier_id = [id]` AND `deleted_at IS NULL`, order by `purchase_date DESC`.

| Kolom | Source |
|---|---|
| Tanggal | `purchase_orders.purchase_date` |
| No. Invoice | `purchase_orders.invoice_number` |
| Total | `purchase_orders.total_amount` |
| Status Bayar | API value: `payment_status = paid / partial / unpaid`; UI label dapat ditampilkan sebagai *"Lunas"*, *"Sebagian"*, atau *"Belum Lunas"* |

**States riwayat PO:**
| State | Tampilan |
|---|---|
| Belum ada PO | Teks *"Belum ada riwayat pembelian dari supplier ini"* |
| Ada PO | Tabel riwayat |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Edit | button | Navigasi ke `SCR-SUP-03` |
| Hapus | button | Confirmation dialog → soft delete → redirect ke `SCR-SUP-01` |
| WhatsApp | button | Buka `https://wa.me/[phone]`. Hanya tampil jika `phone` tidak null |
| Kembali | link | Kembali ke `SCR-SUP-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Skeleton |
| Error: tidak ditemukan | Redirect ke `SCR-SUP-01` + toast *"Supplier tidak ditemukan"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-SUP-01 | Suppliers List | `/suppliers` | Authenticated |
| SCR-SUP-02 | Add Supplier | `/suppliers/new` | Authenticated |
| SCR-SUP-03 | Edit Supplier | `/suppliers/[id]/edit` | Authenticated |
| SCR-SUP-04 | Supplier Detail | `/suppliers/[id]` | Authenticated |

---

*Version 1.0 — Created: 2026-03-24*
