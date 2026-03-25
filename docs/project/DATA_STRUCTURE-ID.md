# Database Schema (Readable Table Format)

Aplikasi Manajemen Stok & Keuangan Resto

------------------------------------------------------------------------

## Table: users

| Kolom | Keterangan |
| --- | --- |
| id | ID user |
| name | Nama user |
| email | Email login |
| password | Password user |
| role | Role user (owner, staff, cashier) |
| phone | Nomor telepon |
| created_at | Waktu data dibuat |
| updated_at | Waktu terakhir diupdate |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: merchants

| Kolom | Keterangan |
| --- | --- |
| id | ID merchant / usaha |
| name | Nama usaha |
| type | Jenis usaha |
| address | Alamat usaha |
| phone | Nomor telepon |
| cash_balance | Saldo kas merchant |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: user_merchants

| Kolom | Keterangan |
| --- | --- |
| id | ID relasi |
| merchant_id | Merchant yang diakses |
| user_id | User yang memiliki akses |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: suppliers

| Kolom | Keterangan |
| --- | --- |
| id | ID supplier |
| merchant_id | Merchant pemilik supplier |
| name | Nama supplier |
| phone | Nomor telepon supplier |
| address | Alamat supplier |
| notes | Catatan tambahan |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: ingredients

| Kolom | Keterangan |
| --- | --- |
| id | ID bahan |
| merchant_id | Merchant pemilik bahan |
| name | Nama bahan |
| category | Kategori bahan |
| base_unit | Satuan dasar |
| stock_quantity | Jumlah stok saat ini |
| min_stock | Batas minimum stok |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: ingredient_units

| Kolom | Keterangan |
| --- | --- |
| id | ID unit |
| ingredient_id | Bahan terkait |
| unit_name | Nama unit |
| conversion_factor | Konversi ke base unit |
| is_default | Apakah unit default |
| description | Deskripsi unit |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: ingredient_batches

| Kolom | Keterangan |
| --- | --- |
| id | ID batch |
| ingredient_id | Bahan terkait |
| qty_purchased | Jumlah dibeli |
| qty_remaining | Sisa stok batch |
| cost_per_unit | Harga per unit |
| purchase_date | Tanggal pembelian |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: purchase_orders

| Kolom | Keterangan |
| --- | --- |
| id | ID purchase order |
| merchant_id | Merchant pembeli |
| supplier_id | Supplier |
| purchase_date | Tanggal pembelian |
| invoice_number | Nomor invoice |
| total_amount | Total pembelian |
| paid_cash | Dibayar dari kas |
| paid_owner | Dibayar oleh owner |
| debt_amount | Jumlah hutang |
| notes | Catatan |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: purchase_items

| Kolom | Keterangan |
| --- | --- |
| id | ID item pembelian |
| purchase_order_id | Referensi purchase order |
| ingredient_id | Bahan yang dibeli |
| quantity | Jumlah dibeli |
| ingredient_unit_id | Unit yang digunakan |
| unit_price | Harga per unit |
| subtotal | Total harga item |
| notes | Catatan |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: stock_logs

| Kolom | Keterangan |
| --- | --- |
| id | ID log |
| ingredient_id | Bahan terkait |
| movement_type | Jenis pergerakan stok |
| reference_type | Jenis referensi transaksi |
| reference_id | ID transaksi referensi |
| base_unit_quantity | Jumlah perubahan stok |
| base_unit_price | Harga per unit |
| total_amount | Total nilai perubahan |
| reason | Alasan perubahan |
| notes | Catatan |
| balance_after | Stok setelah perubahan |
| created_by | User pembuat |
| created_at | Waktu log dibuat |

------------------------------------------------------------------------

## Table: cash_logs

| Kolom | Keterangan |
| --- | --- |
| id | ID cash log |
| merchant_id | Merchant terkait |
| flow_type | Jenis arus kas (in/out) |
| amount | Jumlah uang |
| category | Kategori transaksi |
| reference_id | Referensi transaksi |
| description | Deskripsi |
| balance_after | Saldo kas setelah transaksi |
| created_by | User pembuat |
| created_at | Waktu transaksi |

------------------------------------------------------------------------

## Table: debts

| Kolom | Keterangan |
| --- | --- |
| id | ID hutang |
| merchant_id | Merchant terkait |
| creditor_type | Tipe kreditur |
| supplier_id | Supplier terkait |
| creditor_name | Nama kreditur |
| purchase_order_id | Referensi purchase order |
| total_amount | Total hutang |
| paid_amount | Jumlah sudah dibayar |
| status | Status hutang |
| debt_date | Tanggal hutang |
| due_date | Jatuh tempo |
| paid_date | Tanggal pelunasan |
| description | Catatan hutang |
| created_at | Waktu dibuat |
| updated_at | Waktu update |
| deleted_at | Soft delete |

------------------------------------------------------------------------

## Table: debt_payments

| Kolom | Keterangan |
| --- | --- |
| id | ID pembayaran |
| debt_id | Hutang terkait |
| amount | Jumlah pembayaran |
| payment_method | Metode pembayaran |
| reference_number | Nomor referensi |
| notes | Catatan |
| created_by | User pembuat |
| created_at | Waktu pembayaran |
