# API Testing Plan

## 0. Setup Test Data

- [ ] Siapkan user test baru.
- [ ] Siapkan token auth valid dari `POST /auth/login`.
- [ ] Siapkan skenario token invalid, token kosong, dan token expired.
- [ ] Siapkan minimal 2 merchant untuk test akses lintas merchant.
- [ ] Siapkan data master:
  - [ ] Supplier aktif.
  - [ ] Ingredient aktif.
  - [ ] Ingredient unit dengan conversion factor valid.
  - [ ] Stock awal dari purchase order atau adjustment in.
- [ ] Pastikan setiap test bisa rollback/reset database.

## 1. Cross-Cutting API Behavior

- [ ] Semua `/v1/*` harus gagal tanpa `Authorization: Bearer <token>`.
- [ ] Semua route merchant-scoped harus gagal tanpa `X-Merchant-ID` jika context merchant dibutuhkan.
- [ ] User tidak boleh akses data merchant lain.
- [ ] Semua response mengikuti envelope `success`, `data`, `message`, `meta`.
- [ ] Semua error validation mengembalikan status dan pesan yang konsisten.
- [ ] UUID param invalid harus mengembalikan validation error.
- [ ] Resource tidak ditemukan harus mengembalikan `404`.
- [ ] Date range invalid, misalnya `date_from > date_to`, harus gagal.
- [ ] Request body kosong untuk update partial harus gagal.
- [ ] Nilai angka negatif atau nol pada amount/quantity/price harus gagal jika field wajib positif.
- [ ] Cek header umum: CORS, `X-Request-ID`, dan security headers.

## 2. System Endpoints

- [ ] `GET /`
  - [ ] Berhasil mengembalikan info aplikasi.
- [ ] `GET /health`
  - [ ] Berhasil saat database connected.
  - [ ] Mengembalikan unhealthy saat database tidak tersedia.

## 3. Auth API

- [ ] `POST /auth/register`
  - [ ] Register berhasil dengan payload valid.
  - [ ] Gagal jika email duplicate.
  - [ ] Gagal jika email invalid.
  - [ ] Gagal jika password kurang dari 8 karakter.
  - [ ] Gagal jika name terlalu pendek/kosong.
- [ ] `POST /auth/login`
  - [ ] Login berhasil dengan credential valid.
  - [ ] Gagal dengan password salah.
  - [ ] Gagal dengan email tidak terdaftar.
  - [ ] Gagal dengan format email invalid.
- [ ] `GET /v1/auth/me`
  - [ ] Berhasil mengembalikan profil user login.
  - [ ] Gagal tanpa token.
- [ ] `PUT /v1/auth/profile`
  - [ ] Berhasil update `name`.
  - [ ] Berhasil update `phone`.
  - [ ] Gagal jika payload kosong.
  - [ ] Gagal jika name terlalu pendek.
- [ ] `PUT /v1/auth/password`
  - [ ] Berhasil mengganti password dengan current password valid.
  - [ ] Gagal jika current password salah.
  - [ ] Gagal jika new password kurang dari 8 karakter.
  - [ ] Password lama tidak bisa dipakai login setelah diganti.
  - [ ] Password baru bisa dipakai login.

## 4. Onboarding API

- [ ] `GET /v1/onboarding/status`
  - [ ] User baru mengembalikan status belum onboarding.
  - [ ] User yang sudah punya merchant mengembalikan status selesai.
- [ ] `POST /v1/onboarding/complete`
  - [ ] Berhasil membuat merchant.
  - [ ] Berhasil membuat relasi `user_merchants`.
  - [ ] Berhasil membuat opening balance jika `opening_balance > 0`.
  - [ ] Berhasil membuat supplier awal jika payload suppliers diisi.
  - [ ] Berhasil jika suppliers kosong.
  - [ ] Gagal jika merchant name kosong.
  - [ ] Gagal jika merchant type invalid.
  - [ ] Gagal jika opening balance negatif.
  - [ ] Transaction rollback jika salah satu write gagal.
  - [ ] User tidak boleh complete onboarding dua kali jika business rule melarang.

## 5. Merchant API

- [ ] `GET /v1/merchants`
  - [ ] Mengembalikan daftar merchant yang bisa diakses user.
  - [ ] Tidak mengembalikan merchant milik user lain.
- [ ] `GET /v1/merchants/current`
  - [ ] Berhasil dengan `X-Merchant-ID` valid.
  - [ ] Gagal dengan `X-Merchant-ID` yang tidak dimiliki user.
  - [ ] Gagal dengan `X-Merchant-ID` invalid.
- [ ] `PATCH /v1/merchants/current`
  - [ ] Berhasil update name/type/address/phone.
  - [ ] Berhasil set nullable field menjadi `null`.
  - [ ] Gagal jika payload kosong.
  - [ ] Gagal jika type invalid.
  - [ ] Tidak bisa update merchant milik user lain.

## 6. Supplier API

- [ ] `GET /v1/suppliers`
  - [ ] Mengembalikan daftar supplier merchant aktif.
  - [ ] Search by name berjalan.
  - [ ] Supplier archived tidak muncul di list default.
  - [ ] Data merchant lain tidak muncul.
- [ ] `POST /v1/suppliers`
  - [ ] Berhasil membuat supplier dengan payload valid.
  - [ ] Berhasil dengan optional fields `phone`, `address`, `notes`.
  - [ ] Gagal jika name kosong.
  - [ ] Gagal jika field melebihi max length.
- [ ] `GET /v1/suppliers/:id`
  - [ ] Berhasil ambil detail supplier milik merchant.
  - [ ] Gagal untuk UUID invalid.
  - [ ] Gagal untuk supplier merchant lain.
- [ ] `PATCH /v1/suppliers/:id`
  - [ ] Berhasil update partial.
  - [ ] Berhasil set nullable field ke `null`.
  - [ ] Gagal jika payload kosong.
  - [ ] Gagal update supplier merchant lain.
- [ ] `DELETE /v1/suppliers/:id`
  - [ ] Berhasil soft delete/archive.
  - [ ] Supplier archived tidak muncul di list.
  - [ ] Detail archived sesuai expected behavior.
  - [ ] Gagal delete supplier merchant lain.

## 7. Ingredient API

- [ ] `GET /v1/ingredients`
  - [ ] List berhasil.
  - [ ] Filter `search` berjalan.
  - [ ] Filter `category` berjalan.
  - [ ] Data merchant lain tidak muncul.
- [ ] `POST /v1/ingredients`
  - [ ] Berhasil membuat ingredient.
  - [ ] Base unit otomatis tersedia sesuai behavior service.
  - [ ] Gagal jika category invalid.
  - [ ] Gagal jika `min_stock` negatif.
- [ ] `GET /v1/ingredients/:id`
  - [ ] Detail mengembalikan `units`, `is_used`, dan `is_base_unit_editable`.
  - [ ] Gagal untuk ingredient merchant lain.
- [ ] `PATCH /v1/ingredients/:id`
  - [ ] Berhasil update name/category/min_stock/is_active.
  - [ ] Gagal jika payload kosong.
  - [ ] Gagal update base unit jika ingredient sudah digunakan dan rule melarang.
- [ ] `DELETE /v1/ingredients/:id`
  - [ ] Berhasil delete ingredient yang belum digunakan.
  - [ ] Gagal delete ingredient yang sudah dipakai transaksi.
- [ ] `POST /v1/ingredients/:id/units`
  - [ ] Berhasil tambah unit.
  - [ ] Gagal jika `conversion_factor <= 0`.
  - [ ] Gagal jika ingredient merchant lain.
- [ ] `PATCH /v1/ingredients/:id/units/:unitId`
  - [ ] Berhasil update unit.
  - [ ] Berhasil toggle `is_default` atau `is_active`.
  - [ ] Gagal jika payload kosong.
- [ ] `DELETE /v1/ingredients/:id/units/:unitId`
  - [ ] Berhasil delete unit yang belum digunakan.
  - [ ] Gagal delete base/default unit jika business rule melarang.
  - [ ] Gagal delete unit yang sudah dipakai transaksi.

## 8. Purchase Order API

- [ ] `GET /v1/purchase-orders`
  - [ ] List berhasil.
  - [ ] Filter `search`, `supplier_id`, `date_from`, `date_to` berjalan.
  - [ ] Date range invalid gagal.
  - [ ] Data merchant lain tidak muncul.
- [ ] `POST /v1/purchase-orders`
  - [ ] Berhasil membuat PO dengan supplier.
  - [ ] Berhasil membuat PO tanpa supplier jika allowed.
  - [ ] Berhasil membuat item PO.
  - [ ] Stock batch bertambah.
  - [ ] Stock log `purchase` tercatat.
  - [ ] Cash log tercatat untuk `paid_cash`.
  - [ ] Debt tercatat untuk `debt_amount`.
  - [ ] Owner payment sesuai expected behavior untuk `paid_owner`.
  - [ ] Gagal jika items kosong.
  - [ ] Gagal jika quantity/unit_price <= 0.
  - [ ] Gagal jika ingredient/unit bukan milik merchant.
  - [ ] Gagal jika komposisi payment tidak sesuai total PO.
  - [ ] Transaction rollback jika salah satu write gagal.
- [ ] `GET /v1/purchase-orders/:id`
  - [ ] Detail PO mengembalikan header, supplier, items, dan payment summary.
  - [ ] Gagal akses PO merchant lain.

## 9. Stock Monitoring API

- [ ] `GET /v1/stock`
  - [ ] List stock berhasil.
  - [ ] Filter `search`, `category`, dan `status` berjalan.
  - [ ] Status `normal`, `low`, `out` dihitung benar.
- [ ] `GET /v1/stock/:ingredientId`
  - [ ] Detail stock berhasil.
  - [ ] Quantity dan valuation sesuai batch aktif.
  - [ ] Gagal akses ingredient merchant lain.
- [ ] `GET /v1/stock/:ingredientId/logs`
  - [ ] List movement berhasil.
  - [ ] Filter `reference_type` purchase/usage/waste/adjustment berjalan.
  - [ ] Gagal jika reference_type invalid.

## 10. Stock Usage API

- [ ] `GET /v1/stock/usages`
  - [ ] List usage berhasil.
  - [ ] Filter date range berjalan.
- [ ] `POST /v1/stock/usages/estimate`
  - [ ] Estimasi berhasil untuk stock cukup.
  - [ ] Gagal jika stock tidak cukup.
  - [ ] Konversi unit dihitung benar.
- [ ] `POST /v1/stock/usages`
  - [ ] Berhasil mencatat penggunaan stock.
  - [ ] Batch berkurang sesuai metode costing yang dipakai.
  - [ ] Stock log `usage` tercatat.
  - [ ] Gagal jika stock tidak cukup.
  - [ ] Gagal jika items kosong.
  - [ ] Transaction rollback jika salah satu item gagal.
- [ ] `GET /v1/stock/usages/:id`
  - [ ] Detail usage berhasil.
  - [ ] Gagal akses usage merchant lain.

## 11. Stock Waste API

- [ ] `GET /v1/stock/wastes`
  - [ ] List waste berhasil.
  - [ ] Filter date range berjalan.
- [ ] `POST /v1/stock/wastes/estimate`
  - [ ] Estimasi waste value berhasil.
  - [ ] Gagal jika stock tidak cukup.
- [ ] `POST /v1/stock/wastes`
  - [ ] Berhasil mencatat waste.
  - [ ] Batch berkurang.
  - [ ] Stock log `waste` tercatat.
  - [ ] Gagal jika stock tidak cukup.
  - [ ] Transaction rollback jika salah satu item gagal.
- [ ] `GET /v1/stock/wastes/:id`
  - [ ] Detail waste berhasil.
  - [ ] Gagal akses waste merchant lain.

## 12. Stock Adjustment API

- [ ] `GET /v1/stock/adjustments`
  - [ ] List adjustment berhasil.
  - [ ] Filter date range berjalan.
- [ ] `POST /v1/stock/adjustments/estimate-out`
  - [ ] Estimasi adjustment out berhasil.
  - [ ] Gagal jika stock tidak cukup.
- [ ] `POST /v1/stock/adjustments`
  - [ ] Berhasil adjustment `in` dengan `unit_price`.
  - [ ] Berhasil adjustment `out` tanpa `unit_price`.
  - [ ] Adjustment in menambah batch.
  - [ ] Adjustment out mengurangi batch.
  - [ ] Stock log `adjustment` tercatat.
  - [ ] Gagal jika flow_type invalid.
  - [ ] Gagal jika adjustment in tanpa unit_price.
  - [ ] Gagal jika adjustment out melebihi stock.
  - [ ] Transaction rollback jika salah satu item gagal.
- [ ] `GET /v1/stock/adjustments/:id`
  - [ ] Detail adjustment berhasil.
  - [ ] Gagal akses adjustment merchant lain.

## 13. Cash API

- [ ] `GET /v1/cash`
  - [ ] List cash log berhasil.
  - [ ] Filter `search`, `flow_type`, `category`, dan date range berjalan.
  - [ ] Saldo/summary sesuai expected response.
- [ ] `POST /v1/cash/in`
  - [ ] Berhasil membuat cash in.
  - [ ] Gagal jika category bukan kategori cash in.
  - [ ] Gagal jika amount <= 0.
- [ ] `POST /v1/cash/out`
  - [ ] Berhasil membuat cash out.
  - [ ] Gagal jika category bukan kategori cash out.
  - [ ] Gagal jika amount <= 0.
- [ ] `GET /v1/cash/:id`
  - [ ] Detail cash log berhasil.
  - [ ] Gagal akses cash log merchant lain.

## 14. Debt API

- [ ] `GET /v1/debts`
  - [ ] List debt berhasil.
  - [ ] Filter `creditor_type`, `supplier_id`, dan `status` berjalan.
  - [ ] Data merchant lain tidak muncul.
- [ ] `POST /v1/debts`
  - [ ] Berhasil membuat debt supplier dengan `supplier_id`.
  - [ ] Berhasil membuat debt owner tanpa supplier/name.
  - [ ] Berhasil membuat debt other dengan `creditor_name`.
  - [ ] Gagal supplier debt tanpa `supplier_id`.
  - [ ] Gagal owner debt jika mengirim `supplier_id` atau `creditor_name`.
  - [ ] Gagal other debt tanpa `creditor_name`.
  - [ ] Gagal jika `due_date < debt_date`.
- [ ] `GET /v1/debts/:id`
  - [ ] Detail debt berhasil termasuk payment history.
  - [ ] Gagal akses debt merchant lain.
- [ ] `POST /v1/debts/:id/payments`
  - [ ] Berhasil bayar sebagian.
  - [ ] Status berubah menjadi `partial`.
  - [ ] Berhasil bayar lunas.
  - [ ] Status berubah menjadi `paid`.
  - [ ] Cash out tercatat untuk payment.
  - [ ] Gagal jika amount melebihi sisa debt.
  - [ ] Gagal jika debt sudah paid.
  - [ ] Transaction rollback jika cash log/payment update gagal.

## 15. Dashboard API

- [ ] `GET /v1/dashboard`
  - [ ] Berhasil dengan default period `daily`.
  - [ ] Berhasil dengan period `weekly`.
  - [ ] Berhasil dengan period `monthly`.
  - [ ] Gagal dengan period invalid.
  - [ ] Angka summary sesuai data cash, debt, stock, dan PO.
  - [ ] Data merchant lain tidak masuk perhitungan.

## 16. Reports API

- [ ] `GET /v1/reports/financial`
  - [ ] Berhasil dengan default period `monthly`.
  - [ ] Berhasil dengan period `daily`, `weekly`, `monthly`.
  - [ ] Berhasil dengan period `custom` jika `date_from` dan `date_to` diisi.
  - [ ] Gagal custom tanpa date range lengkap.
  - [ ] Pagination `page` dan `limit` berjalan.
  - [ ] Gagal jika `limit > 100`.
- [ ] `GET /v1/reports/stock`
  - [ ] Berhasil generate stock report.
  - [ ] Filter `reference_type` berjalan.
  - [ ] Filter `ingredient_id` berjalan.
  - [ ] Gagal jika `ingredient_id` invalid.
- [ ] `GET /v1/reports/suppliers`
  - [ ] Berhasil generate supplier report.
  - [ ] Filter `supplier_id` berjalan.
  - [ ] Gagal jika `supplier_id` invalid.
- [ ] Planned export endpoints
  - [ ] Tandai `GET /v1/reports/*/export` sebagai belum implemented.
  - [ ] Jangan masukkan ke automated success test sampai endpoint dibuat.

## 17. Regression Priority

- [ ] P0: Auth, merchant boundary, onboarding complete.
- [ ] P0: Purchase order create.
- [ ] P0: Stock usage, waste, adjustment.
- [ ] P0: Debt payment.
- [ ] P1: Supplier CRUD.
- [ ] P1: Ingredient dan unit management.
- [ ] P1: Cash in/out.
- [ ] P1: Dashboard dan reports calculation.
- [ ] P2: Root, health, filters sederhana, dan planned endpoint gap checks.
