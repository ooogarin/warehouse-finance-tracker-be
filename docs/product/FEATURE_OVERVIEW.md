# Feature Overview

Dokumen ini merangkum fitur produk berdasarkan source of truth:

- `docs/data/DATABASE_SCHEMA.md`
- `docs/engineering/screen-lists/`

Dokumen ini adalah ringkasan produk, bukan definisi detail endpoint atau validasi field-level.

## 1. Authentication

- Registrasi pengguna.
- Login pengguna.
- Permintaan reset password melalui email.
- Reset password via token flow (forgot password).

## 2. Settings

- Memperbarui profil akun pengguna.
- Mengganti password saat pengguna sudah login.
- Memperbarui informasi merchant aktif.

## 3. Onboarding

- Pengisian data awal merchant.
- Pengisian saldo awal kas.
- Penambahan supplier pertama secara opsional.
- Finalisasi setup awal agar merchant siap masuk dashboard.

## 4. Supplier Management

- Menambah supplier baru.
- Melihat daftar supplier per merchant.
- Mengubah data supplier.
- Mengarsipkan supplier melalui soft delete.
- Melihat detail supplier dan riwayat purchase order terkait.

## 5. Ingredient Management

- Menambah dan mengelola master ingredient.
- Menentukan kategori, base unit, dan minimum stock.
- Mengelola unit turunan beserta conversion factor.
- Mengaktifkan, menonaktifkan, atau menghapus data sesuai aturan pemakaian.
- Menjaga historical integrity ingredient dan unit yang sudah pernah dipakai.

## 6. Purchase Orders

- Mencatat purchase order bahan baku.
- Memilih supplier atau membuat pembelian tanpa supplier.
- Mencatat item pembelian beserta unit, quantity, dan harga.
- Membagi pembayaran menjadi `paid_cash`, `paid_owner`, dan `debt_amount`.
- Menyimpan invoice number dan catatan transaksi.
- Menjalankan side effect ke stock, batch, cash log, dan debt saat transaksi disimpan.

Catatan:

- Purchase order bersifat final setelah tersimpan.
- Koreksi dilakukan lewat transaksi kompensasi atau flow lanjutan, bukan edit bebas transaksi final.

## 7. Stock Monitoring

- Melihat ringkasan stok bahan baku aktif.
- Memantau stok rendah dan stok habis.
- Melihat detail stok per ingredient.
- Meninjau riwayat pergerakan stok dari pembelian, usage, waste, dan adjustment.

## 8. Stock Usage

- Mencatat pemakaian bahan baku untuk operasional.
- Mengurangi stok berdasarkan quantity dan unit yang dipilih.
- Menyimpan catatan penggunaan bila diperlukan.
- Mencatat nilai penggunaan berdasarkan batch cost yang diproses sistem.

## 9. Stock Waste

- Mencatat bahan baku yang dibuang, rusak, atau tidak layak pakai.
- Menyimpan alasan waste.
- Mengurangi stok secara terstruktur.
- Mencatat nilai kerugian berdasarkan cost bahan yang keluar.

## 10. Stock Adjustment

- Menyesuaikan stok sistem dengan hasil perhitungan fisik.
- Mencatat alasan adjustment.
- Menyimpan riwayat koreksi stok.
- Mendukung proses audit dan rekonsiliasi persediaan.

## 11. Cash Management

- Mencatat transaksi kas masuk manual.
- Mencatat transaksi kas keluar manual.
- Menampilkan saldo kas merchant saat ini.
- Menyimpan riwayat arus kas termasuk transaksi dari flow lain (purchase order dan debt payment).
- Menampilkan detail transaksi kas secara read-only.

## 12. Debt Management

- Mencatat debt manual ke supplier, owner, atau pihak lain.
- Mencatat debt otomatis dari purchase order.
- Memantau total debt, sisa debt, status, dan jatuh tempo.
- Mencatat pembayaran debt.
- Menyimpan riwayat pelunasan dan dampaknya ke saldo kas.

Catatan:

- Status debt tersimpan: `unpaid`, `partial`, `paid`.
- Overdue adalah derived state dari due date + status, bukan status DB terpisah.

## 13. Dashboard

- Menampilkan ringkasan kondisi kas.
- Menampilkan breakdown pengeluaran utama.
- Menampilkan alert stok rendah dan stok habis.
- Menampilkan top waste bulan berjalan.
- Menampilkan alert debt overdue dan debt yang segera jatuh tempo.

## 14. Reports

- Menyediakan financial summary berdasarkan periode.
- Menyediakan stock report untuk inventory, usage, waste, dan movement.
- Menyediakan supplier performance report berdasarkan pembelian dan debt.
- Mendukung filter periode dan export data operasional.

## Future Scope

Fitur berikut berada di luar scope inti saat ini dan dapat dipertimbangkan sebagai pengembangan berikutnya:

- Asisten belanja dan rekomendasi supplier.
- Pengiriman daftar belanja ke supplier.
- Pencatatan penjualan detail per menu.
- Batch cooking berbasis resep.
- Insight dashboard lanjutan dan perbandingan multi-cabang.

## Batasan Dokumen

- Jangan gunakan dokumen ini untuk mengambil keputusan schema-level.
- Untuk implementasi, selalu validasi kembali ke screen lists dan database schema.
