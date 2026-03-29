# Gambaran Fitur

Dokumen ini merangkum fitur produk berdasarkan area utama yang sudah didefinisikan di source of truth, yaitu `DATABASE_SCHEMA.md` dan `screen-lists` di `docs-new/engineering`.

## 1. Authentication

- Registrasi pengguna.
- Login pengguna.
- Permintaan reset password melalui email.
- Reset password melalui link token untuk flow lupa password.

## 2. Settings

- Memperbarui profil akun pengguna.
- Mengganti password saat pengguna sudah login.
- Memperbarui informasi merchant aktif.

## 3. Onboarding

- Pengisian data awal merchant.
- Pengisian saldo awal kas.
- Penambahan supplier pertama secara opsional.
- Penyelesaian setup awal agar merchant siap masuk ke dashboard.

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
- Menjaga konsistensi ingredient dan unit yang sudah pernah dipakai dalam transaksi.

## 6. Purchase Orders

- Mencatat purchase order bahan baku.
- Memilih supplier atau membuat pembelian tanpa supplier.
- Mencatat item pembelian beserta unit, quantity, dan harga.
- Membagi pembayaran menjadi kas merchant, talangan owner, dan hutang supplier.
- Menyimpan invoice number dan catatan transaksi.
- Menghasilkan efek lanjutan ke stock, batch, cash log, dan debt saat transaksi disimpan.

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
- Menyimpan riwayat arus kas, termasuk transaksi yang berasal dari flow lain seperti purchase order dan debt payment.
- Menampilkan detail transaksi kas secara read-only.

## 12. Debt Management

- Mencatat hutang manual ke supplier, owner, atau pihak lain.
- Mencatat hutang otomatis yang berasal dari purchase order.
- Memantau total hutang, sisa hutang, status, dan jatuh tempo.
- Mencatat pembayaran hutang.
- Menyimpan riwayat pelunasan dan dampaknya ke saldo kas.

## 13. Dashboard

- Menampilkan ringkasan kondisi kas.
- Menampilkan breakdown pengeluaran utama.
- Menampilkan alert stok rendah dan stok habis.
- Menampilkan top waste bulan berjalan.
- Menampilkan alert hutang overdue dan hutang yang segera jatuh tempo.

## 14. Reports

- Menyediakan financial summary berdasarkan periode.
- Menyediakan stock report untuk inventory, usage, waste, dan movement.
- Menyediakan supplier performance report berdasarkan pembelian dan hutang.
- Mendukung filter periode dan export data operasional.

## Future Scope

Fitur berikut berada di luar scope inti saat ini dan dapat dipertimbangkan sebagai pengembangan berikutnya:

- Asisten belanja dan rekomendasi supplier.
- Pengiriman daftar belanja ke supplier.
- Pencatatan penjualan detail per menu.
- Batch cooking berbasis resep.
- Insight dashboard lanjutan dan perbandingan multi-cabang.
