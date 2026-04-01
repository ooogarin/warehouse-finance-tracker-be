# Project Overview

## Pengelola Modal Dapur

Pengelola Modal Dapur adalah aplikasi operasional untuk bisnis kuliner skala kecil sampai menengah. Fokus utama produk ini adalah kontrol modal harian melalui pencatatan kas, stok bahan baku, pembelian, dan debt (hutang) secara terhubung.

Produk ini bukan sistem akuntansi full. Nilai utamanya ada pada visibilitas operasional: apa yang dibeli, apa yang dipakai, apa yang terbuang, dari mana kas keluar, dan kewajiban apa yang masih berjalan.

## Source of Truth

Untuk detail implementasi, selalu validasi ke:

1. `docs/data/DATABASE_SCHEMA.md`
2. `docs/engineering/screen-lists/`

## Mengapa Produk Ini Ada

Banyak usaha kuliner masih menjalankan operasional dengan catatan manual, chat, atau spreadsheet yang terpisah-pisah. Dalam kondisi itu, masalah yang paling sering muncul adalah:

- Pengeluaran kecil tidak tercatat secara konsisten.
- Saldo kas sulit dipantau secara cepat.
- Stok fisik dan stok sistem sering tidak cocok.
- Riwayat pembelian tidak terhubung dengan supplier dan utang.
- Owner sulit melihat sumber kebocoran modal.

Produk ini dibuat untuk mengurangi kebocoran modal melalui pencatatan operasional yang sederhana, terstruktur, dan cukup detail untuk diaudit kembali.

## Target Pengguna

Produk ini ditujukan untuk:

- Pemilik restoran kecil hingga menengah.
- Pemilik kafe, katering, dan usaha dapur sejenis.
- Pengguna operasional yang perlu kontrol kas dan stok, tetapi tidak ingin proses pencatatan yang rumit.

## Outcome yang Ingin Dicapai

Setelah menggunakan produk ini, owner seharusnya bisa:

- Mengetahui saldo kas dan riwayat arus kas dengan lebih jelas.
- Mengetahui stok bahan baku yang tersedia, rendah, habis, atau bermasalah.
- Melacak pembelian bahan baku beserta metode pembayarannya.
- Memantau debt ke supplier maupun talangan owner.
- Melihat area kebocoran seperti waste, adjustment, atau pengambilan pribadi.

## Prinsip Produk

- Mudah dipakai dalam operasional harian.
- Cukup rinci untuk kebutuhan kontrol bisnis.
- Data harus konsisten dan dapat ditelusuri.
- Transaksi operasional utama bersifat final setelah tersimpan.
- Nilai turunan (misalnya overdue) dihitung dari data utama, bukan disimpan terpisah tanpa kebutuhan schema.
- Setiap pencatatan harus mendukung pengambilan keputusan.
- Alur utama harus terasa praktis bagi owner dan tim operasional kecil.

## Masalah Utama yang Diselesaikan

### 1. Pencatatan operasional terlalu rumit atau tidak konsisten

Produk harus mempermudah pencatatan transaksi dan pergerakan stok agar operasional harian tetap cepat, tetapi tetap rapi.

### 2. Kebocoran kas sulit dilacak

Produk harus membantu pengguna melihat uang masuk, uang keluar, penggunaan kas untuk operasional, dan pengambilan pribadi owner dalam satu riwayat yang jelas.

### 3. Kebocoran stok sulit diidentifikasi

Produk harus mencatat bahan yang masuk, dipakai, dibuang, dan disesuaikan agar selisih stok dapat ditelusuri.

### 4. Pembelian dan debt tidak terhubung dengan baik

Produk harus menghubungkan pembelian bahan, supplier, metode pembayaran, dan sisa kewajiban agar debt supplier maupun debt ke owner tetap terpantau.

### 5. Tidak ada gambaran kondisi usaha secara cepat

Produk harus menyajikan ringkasan yang membantu owner memahami kondisi kas, stok, utang, dan potensi kebocoran modal tanpa harus membuka banyak catatan terpisah.

## Cakupan Produk

Scope produk saat ini mencakup:

- Authentication dan onboarding merchant.
- Basic account settings dan merchant settings.
- Supplier management.
- Ingredient dan unit management.
- Purchase order bahan baku.
- Stock monitoring, stock usage, stock waste, dan stock adjustment.
- Cash management.
- Debt management.
- Dashboard operasional.
- Reports dan analytics operasional.

## Batasan Scope Saat Ini

Untuk versi inti saat ini, produk belum difokuskan pada:

- Pencatatan penjualan detail per menu.
- Pengelolaan resep atau batch cooking berbasis recipe.
- Rekomendasi supplier atau asisten belanja.
- Analisis multi-cabang yang kompleks.
- Fitur akuntansi penuh seperti jurnal, ledger, atau laporan keuangan formal.

## Catatan Scope

- Detail perilaku fitur ditetapkan di `docs/engineering/screen-lists/` dan `docs/data/DATABASE_SCHEMA.md`.
- Dokumen ini hanya ringkasan arah produk dan outcome bisnis.
