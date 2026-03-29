# Screen List — Settings
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Settings only
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
users
├── name     → bisa diedit
├── email    → read-only
└── phone    → bisa diedit

merchants
├── name     → bisa diedit
├── type     → bisa diedit
├── address  → bisa diedit
└── phone    → bisa diedit
```

> Navigasi antar section Settings dihandle oleh sidebar FE.
> Tidak ada halaman index `/settings`.

---

## SECTION — SETTINGS

---

### SCR-SET-01 · Account Settings

**Route:** `/settings/account`
**Akses:** Authenticated

#### Components

**Section: Profil**

Form pre-filled dengan data user yang sedang login.

| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Lengkap | text input | `[R]` max 100 karakter | `users.name` |
| Email | text | `[RO]` tidak bisa diedit | `users.email` |
| Nomor HP | tel input | `[O]` max 20 karakter | `users.phone` |

**Actions Profil**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan Perubahan | submit | Validasi → PATCH ke BE → toast *"Profil berhasil diperbarui"* |

**States Profil**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error |
| Success | Toast *"Profil berhasil diperbarui"* |

---

**Section: Ganti Password**

> Form terpisah dari profil — submit sendiri.

| Field | Type | Rule | Maps to |
|---|---|---|---|
| Password Saat Ini | password input | `[R]` | — (validasi BE) |
| Password Baru | password input | `[R]` min 8 karakter | `users.password` |
| Konfirmasi Password Baru | password input | `[R]` harus sama dengan Password Baru | — (validasi FE) |

**Actions Ganti Password**
| Label | Trigger | Behaviour |
|---|---|---|
| Ganti Password | submit | Validasi → PATCH ke BE → toast sukses + reset form |

**States Ganti Password**
| State | Tampilan |
|---|---|
| Loading submit | Button disabled + spinner |
| Error: password saat ini salah | Inline error: *"Password saat ini tidak sesuai"* |
| Error: validasi | Inline per field |
| Success | Toast *"Password berhasil diubah"* + reset form |

---

**Section: Aksi Akun**

| Label | Trigger | Behaviour |
|---|---|---|
| Logout | button (merah) | Confirmation dialog → clear JWT + FE state → redirect ke `/login` |

---

### SCR-SET-02 · Merchant Settings

**Route:** `/settings/merchant`
**Akses:** Authenticated

#### Components

**Section: Info Bisnis**

Form pre-filled dengan data merchant aktif.

| Field | Type | Rule | Maps to |
|---|---|---|---|
| Nama Bisnis | text input | `[R]` max 100 karakter | `merchants.name` |
| Tipe Bisnis | dropdown | `[R]` Restaurant / Cafe / Catering / Other | `merchants.type` → enum `merchant_type` |
| Alamat | textarea | `[O]` | `merchants.address` |
| Nomor Telepon | tel input | `[O]` max 20 karakter | `merchants.phone` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan Perubahan | submit | Validasi → PATCH ke BE → toast *"Informasi bisnis berhasil diperbarui"* |
| Batal | button/link | Reset form ke nilai awal |

**States**
| State | Tampilan |
|---|---|
| Loading data | Skeleton form |
| Loading submit | Button disabled + spinner |
| Error: validasi | Inline per field |
| Error: BE | Toast error |
| Success | Toast *"Informasi bisnis berhasil diperbarui"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-SET-01 | Account Settings | `/settings/account` | Authenticated |
| SCR-SET-02 | Merchant Settings | `/settings/merchant` | Authenticated |

---

## Catatan untuk Developer

| # | Catatan |
|---|---|
| DEV-01 | Ganti password harus validasi `password_saat_ini` di BE sebelum update — jangan hanya validasi di FE |
| DEV-02 | Section Profil dan Ganti Password adalah dua form terpisah dengan submit button masing-masing — bukan satu form |
| DEV-03 | Email di Account Settings ditampilkan sebagai text `[RO]` — tidak ada form field untuk edit email |
| DEV-04 | Logout harus clear semua state di FE (JWT, cached data) sebelum redirect ke `/login` |
| DEV-05 | Navigasi antar SCR-SET-01 dan SCR-SET-02 dihandle oleh sidebar FE — tidak ada halaman index `/settings` |

---

*Version 1.0 — Updated: 2026-03-25*
