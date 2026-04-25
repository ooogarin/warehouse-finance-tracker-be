# Screen List — Onboarding
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Onboarding only
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

## Arsitektur Alur

```
FLOW — MERCHANT SETUP
  Data disimpan di FE state selama proses berlangsung.
  Dikirim sekaligus ke BE dalam satu payload di step terakhir.
  BE memproses semua entitas dalam satu DB transaction:
  merchants + user_merchants + cash_logs + suppliers (jika ada).
```

**Catatan:**
- Onboarding tidak bisa di-skip — user wajib menyelesaikan merchant setup sebelum masuk dashboard
- User bebas navigasi maju/mundur antar step ONB-02 sampai ONB-04 karena data masih di FE state
- Tidak perlu flag `onboarding_completed` di schema — pengecekan cukup via `user_merchants`
- SCR-ONB-01 (Register) berdiri sendiri dan langsung commit ke DB — berbeda dengan step lainnya

---

## SECTION — ONBOARDING

> Data di SCR-ONB-02, SCR-ONB-03, dan SCR-ONB-04 disimpan di **FE state** selama proses berlangsung.
> Seluruh data baru dikirim ke BE dalam **satu payload** di SCR-ONB-04 saat user klik "Selesai".
> User bebas navigasi maju/mundur antar step karena data belum dikirim ke DB.

---

### SCR-ONB-01 · Register / Sign Up

**Route:** Not part of public app flow
**Akses:** Internal setup only

> Merchant account setup is handled internally by platform admin.
> Public self-registration is outside the scope of this product flow.

#### Components

**Form: Buat Akun**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Lengkap | text input | `[R]` max 100 karakter | `users.name` |
| Email | email input | `[R]` unik, format valid | `users.email` |
| Password | password input | `[R]` min 8 karakter | `users.password` |
| Konfirmasi Password | password input | `[R]` harus sama dengan Password | — (validasi FE) |
| Nomor HP | tel input | `[O]` max 20 karakter | `users.phone` |

> Initial merchant access is provisioned internally, not through public sign-up.

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Daftar | submit | Not available in the public app flow |
| Sudah punya akun? | link | Redirect ke `SCR-AUTH-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner |
| Error: email duplikat | *"Email sudah terdaftar"* |
| Error: validasi | Inline per field |
| Success | Redirect ke `SCR-ONB-02` |

---

### SCR-ONB-02 · Setup Profil Bisnis

**Route:** `/onboarding/merchant`
**Akses:** Authenticated, belum punya merchant

**Progress Indicator:** Step 1 dari 3

> Data form ini disimpan ke FE state. Belum dikirim ke BE.

#### Components

**Form: Data Bisnis**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Bisnis | text input | `[R]` max 100 karakter | `merchants.name` |
| Tipe Bisnis | dropdown | `[R]` Restaurant / Cafe / Catering / Other | `merchants.type` → enum `merchant_type` |
| Alamat | textarea | `[O]` | `merchants.address` |
| Nomor Telepon | tel input | `[O]` max 20 karakter | `merchants.phone` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Lanjut | submit | Validasi → simpan ke FE state → navigasi ke `SCR-ONB-03` |

---

### SCR-ONB-03 · Set Saldo Awal Kas

**Route:** `/onboarding/merchant/balance`
**Akses:** Authenticated, belum punya merchant

**Progress Indicator:** Step 2 dari 3

> Data form ini disimpan ke FE state. Belum dikirim ke BE.

#### Components

**Form: Saldo Awal**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Saldo Awal Kas | number input | `[R]` min 0, default 0 | `merchants.cash_balance` |

> **Catatan — Audit Trail (diproses BE saat payload dikirim):**
> Jika `Saldo Awal Kas > 0`, BE wajib membuat entri `cash_logs` `[AUTO]` dengan:
> - `flow_type` = `'in'`
> - `category` = `'capital_injection'`
> - `amount` = nilai saldo awal
> - `balance_after` = nilai saldo awal
> - `description` = `'Opening balance'`
>
> Jika nilai `0`, tidak ada entri `cash_logs` yang dibuat.

**Display**
- Preview: *"Saldo awal Anda: Rp [nilai input]"*

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Lanjut | submit | Simpan ke FE state → navigasi ke `SCR-ONB-04` |
| Kembali | link | Navigasi kembali ke `SCR-ONB-02` (FE state tetap terjaga) |

---

### SCR-ONB-04 · Tambah Supplier Pertama (Opsional)

**Route:** `/onboarding/merchant/supplier`
**Akses:** Authenticated, belum punya merchant

**Progress Indicator:** Step 3 dari 3

> Ini adalah step terakhir. Saat user klik "Selesai", seluruh FE state dikirim ke BE dalam satu payload.
> BE memproses dalam satu DB transaction: `merchants` → `user_merchants` → `cash_logs` → `suppliers`.

#### Components

**Form: Tambah Supplier**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Supplier | text input | `[R]` max 100 karakter | `suppliers.name` |
| Nomor HP | tel input | `[O]` max 20 karakter | `suppliers.phone` |
| Alamat | textarea | `[O]` | `suppliers.address` |
| Catatan | textarea | `[O]` contoh: *"Buka sampai jam 9, bisa kredit"* | `suppliers.notes` |

> `suppliers.merchant_id` di-set otomatis dari merchant yang baru dibuat `[AUTO]`.

**List: Supplier yang Ditambahkan**
- Tampil daftar supplier yang sudah diinput di sesi ini (dari FE state)
- Tombol hapus per item → hapus dari FE state

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Tambah Supplier | submit form | Validasi → simpan ke FE state → reset form → tampil di list |
| Kembali | link | Navigasi kembali ke `SCR-ONB-03` (FE state tetap terjaga) |
| Selesai | button | Kirim seluruh FE state ke BE → BE proses satu transaction → redirect ke `/dashboard` |

**States**
| State | Tampilan |
|---|---|
| Empty | Form saja, list kosong |
| Ada supplier | List muncul di atas form |
| Loading (saat Selesai diklik) | Button disabled + spinner, semua input di-lock |
| Error dari BE | Toast error, user tetap di halaman ini, data FE state tidak hilang |
| Success | Redirect ke `/dashboard` |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-ONB-01 | Register | Not part of public app flow | Internal setup only |
| SCR-ONB-02 | Setup Profil Bisnis | `/onboarding/merchant` | Authenticated |
| SCR-ONB-03 | Set Saldo Awal Kas | `/onboarding/merchant/balance` | Authenticated |
| SCR-ONB-04 | Tambah Supplier Pertama | `/onboarding/merchant/supplier` | Authenticated |

---

*Version 1.0 — Updated: 2026-03-24*
