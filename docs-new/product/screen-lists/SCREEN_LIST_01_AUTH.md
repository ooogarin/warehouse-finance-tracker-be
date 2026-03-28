# Screen List — Authentication
**Project:** Pengelola Modal Dapur
**Version:** 1.0
**Scope:** Authentication only
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
FLOW — AUTH
  Langsung commit ke DB per aksi.
```

**Login redirect logic:**
```
Login berhasil → cek user_merchants:
├── Ada merchant → /dashboard
└── Tidak ada merchant → /onboarding/merchant (SCR-ONB-02)
```

**Register redirect logic:**
```
Register berhasil → auto login → /onboarding/merchant (SCR-ONB-02)
```

---

## SECTION — AUTHENTICATION

---

### SCR-AUTH-01 · Login Page

**Route:** `/login`
**Akses:** Public (belum login)

#### Components

**Form: Login**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Email | email input | `[R]` format email valid | `users.email` |
| Password | password input | `[R]` tidak boleh kosong | `users.password` |
| Remember Me | checkbox | `[O]` | client-side only |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Login | submit | Validasi → hit auth API → simpan JWT → cek `user_merchants` → redirect |
| Forgot Password | link | Redirect ke `SCR-AUTH-02` |
| Daftar | link | Redirect ke `SCR-ONB-01` |

**States**
| State | Tampilan |
|---|---|
| Default | Form kosong |
| Loading | Button disabled + spinner |
| Error | Inline message: *"Email atau password salah"* |
| Success — punya merchant | Redirect ke `/dashboard` |
| Success — belum punya merchant | Redirect ke `/onboarding/merchant` (`SCR-ONB-02`) |

---

### SCR-AUTH-02 · Forgot Password — Request Reset

**Route:** `/forgot-password`
**Akses:** Public

#### Components

**Form: Request Reset Link**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Email | email input | `[R]` harus terdaftar di sistem | `users.email` |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kirim Link Reset | submit | Kirim email reset → navigasi ke `SCR-AUTH-03` |
| Kembali ke Login | link | Redirect ke `SCR-AUTH-01` |

**States**
| State | Tampilan |
|---|---|
| Loading | Button disabled + spinner |
| Error | *"Email tidak ditemukan"* |
| Success | Navigasi ke `SCR-AUTH-03` |

---

### SCR-AUTH-03 · Forgot Password — Check Email

**Route:** `/forgot-password/sent`
**Akses:** Public

#### Components

**Info Panel**
- Pesan: *"Link reset telah dikirim ke [email]. Cek inbox Anda."*
- Countdown resend (60 detik)

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Kirim Ulang | button (aktif setelah countdown habis) | Ulangi request reset |
| Kembali ke Login | link | Redirect ke `SCR-AUTH-01` |

---

### SCR-AUTH-04 · Reset Password

**Route:** `/reset-password?token=[token]`
**Akses:** Public (via link email)

#### Components

**Form: Reset Password**
| Field | Type | Rule | Maps to |
|---|---|---|---|
| Password Baru | password input | `[R]` min 8 karakter | `users.password` |
| Konfirmasi Password | password input | `[R]` harus sama dengan Password Baru | — (validasi FE) |

**Actions**
| Label | Trigger | Behaviour |
|---|---|---|
| Simpan Password | submit | Update password → redirect ke `SCR-AUTH-01` + toast sukses |

**States**
| State | Tampilan |
|---|---|
| Token invalid/expired | Error page: *"Link tidak valid atau sudah kadaluarsa"* |
| Success | Redirect ke `SCR-AUTH-01` + toast *"Password berhasil diubah"* |

---

## Summary — Screen List

| Screen ID | Nama Screen | Route | Akses |
|---|---|---|---|
| SCR-AUTH-01 | Login Page | `/login` | Public |
| SCR-AUTH-02 | Forgot Password — Request | `/forgot-password` | Public |
| SCR-AUTH-03 | Forgot Password — Check Email | `/forgot-password/sent` | Public |
| SCR-AUTH-04 | Reset Password | `/reset-password` | Public (token) |

---

*Version 1.0 — Updated: 2026-03-24*
