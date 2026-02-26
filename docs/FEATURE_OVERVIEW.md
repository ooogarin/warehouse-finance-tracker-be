# Fitur Utama

## A. Persiapan Awal (Onboarding)

Setup cepat dalam 3 langkah, siap pakai dalam hitungan menit:

- **STEP 1: Profil Resto**
  - Nama resto
  - Jenis usaha (Warteg/Cafe/Katering/Lainnya)
  - Jam operasional
- **STEP 2: Saldo Awal**
  - Input kas resto saat ini
  - Opsional: Catat utang yang sudah ada
- **STEP 3: Bahan Baku dan Supplier (Opsional)**
  - Centang template bahan populer (konversi sudah diatur)
  - Atau skip, isi sambil jalan
  - Tambah supplier langganan (bisa nanti)

## B. Manajemen Bahan Baku & Stok

**Monitoring Stok:**

- Lihat semua stok di gudang dalam satuan terkecil.
- Indikator warna:
  - 🟢 Hijau = Stok aman
  - 🟡 Kuning = Stok menipis (< batas minimum)
  - 🔴 Merah = Stok kritis (perlu beli segera)
- Filter: Semua/Hampir Habis/Kategori
- Search cepat by nama bahan

**Master Konversi Satuan:**

- Atur hubungan antar satuan per bahan
- Template otomatis untuk bahan populer
- Contoh: 1 Jerigen = 5 Liter = 5.000 ml

**Batas Minimum Stok:**

- Set alarm otomatis per bahan
- Notifikasi saat stok < batas yang ditentukan
- Langsung link ke "Buat Rencana Belanja"

**Riwayat Mutasi Stok:**

- Tracking detail: masuk/pakai/buang
- Filter: Tanggal, Bahan, Jenis mutasi
- Export laporan (Excel/PDF)

## C. Buku Supplier

**Database Supplier:**

- Nama toko, kontak WhatsApp, alamat, dll
- Catatan khusus (misal: "Buka sampai malam", "Bisa kredit")

**Tracking Harga:**

- Otomatis rekam harga per bahan per supplier
- Grafik perbandingan: "Bawang di Toko A vs Toko B"
- Alert: "Harga cabai di Toko Makmur naik 20% dari biasanya"

**Quick Action:**

- Tombol "Hubungi" → Langsung buka WhatsApp
- Tombol "Kirim List Belanja" → Share shopping list. \***_(Soon)_**

**Smart Recommendation:**
Sistem otomatis sarankan supplier termurah per bahan

## D. Pencatatan Belanja

**Pencatatan Belanja:**

- Nama bahan (baru/existing)
- Satuan, jumlah, harga satuan
- Pilih supplier

**Pilihan Pembayaran:**

- **Bayar Tunai (Kas Resto)**
  - Langsung potong saldo kas (semuanya)
  - Stok masuk, uang keluar

- **Bon/Kredit (Hutang ke Supplier)**
  - Potong saldo kas sebagian jika bon sebagian
  - Stok masuk, kas resto tidak berkurang
  - Set tanggal jatuh tempo (opsional)
  - Bisa dibayar nanti lewat menu Utang

- **Uang Pribadi (Talangan Owner)**
  - Potong saldo kas sebagian jika pakai uang pribadi sebagian
  - Stok masuk, kas resto tidak berkurang
  - Tercatat sebagai "Utang ke Owner"
  - Bisa dibayar nanti lewat menu Utang

## E. Pencatatan Penggunaan Bahan

**Mode Pencatatan:**

- **Pakai untuk Operasional**
  - Pilih bahan + jumlah
  - Keterangan (opsional): "Menu hari ini", "Pesanan"
  - Otomatis kurangi stok
- **Lapor Buang (Waste)**
  - Pilih bahan + jumlah terbuang
  - Wajib pilih alasan:
    - ☑️ Basi/Kadaluarsa
    - ☑️ Tumpah/Rusak
    - ☑️ Gosong/Gagal masak
    - ☑️ Lainnya (tulis manual)
  - Sistem hitung nilai kerugian dalam Rupiah
  - Masuk ke laporan "Top 3 Waste"

- **Masak Menu (Batch)** \***_(Soon)_**
  - Pilih menu (misal: Nasi Goreng)
  - Input jumlah porsi
  - Sistem otomatis potong semua bahan sesuai resep

## F. Manajemen Saldo (Cash Flow)

**Uang Masuk:**

- **Setoran Penjualan**
  - Mode Cepat: Input total omzet hari ini
  - Mode Detail: Catat per menu × jumlah porsi \***_(Soon)_**
  - Otomatis tambah kas resto

- **Tambah Modal**
  - Owner setor uang pribadi ke kas resto
  - Bukan utang, tapi penambahan modal
  - Tercatat di laporan modal

**Uang Keluar (Non-Belanja):**

- **Ambil untuk Pribadi**
  - Owner ambil uang untuk kebutuhan pribadi
  - Potong kas resto
  - Tracking: "Bulan ini sudah ambil Rp X"
  - Alert jika > 30% dari omzet

- **Bayar Gaji Karyawan**
  - Catat nama + nominal
  - Potong kas resto
  - Riwayat pembayaran per karyawan

- **Lain-lain**
  - Donasi, darurat, dll
  - Wajib isi keterangan
  - Potong kas resto

- **Dashboard Kas:**
  - Saldo real-time
  - Alert: "Ambil pribadi sudah 40% dari omzet bulan ini"

## G. Manajemen Utang (Debt Management)

**Dashboard Utang:**

- Total utang aktif (Supplier + Owner)
- Utang jatuh tempo minggu ini
- Grafik: Trend utang 3 bulan terakhir

**Daftar Utang dengan Filter:**

- Status: Semua / Belum Dibayar / Cicilan / Lunas
- Urut: Jatuh tempo / Nominal / Supplier
- Warna: 🔴 Telat | 🟡 H-3 | 🟢 Aman

**Mekanisme Pelunasan:**

- Pilih utang → Pilih jumlah bayar
- Pilih sumber: Kas Resto
- Konfirmasi → Otomatis:
  - Kurangi kas resto
  - Update sisa utang
  - Ubah status jika lunas
- Catat riwayat utang beserta pembayaran

## H. Asisten Belanja & Dashboard Insight

**Shopping Planner**

- **Rencana Belanja**
  - Mencatat daftar bahan belanjaan

- **Supplier Recommendation**
  - Bandingkan harga per bahan di semua supplier
  - Tampilkan total jika beli semua di:
    - Toko A: Rp 850.000
    - Toko B: Rp 780.000 ✓ Termurah
    - Toko C: Rp 920.000

- **Jadwal Belanja**
  - Reminder: "Besok waktunya belanja rutin"
  - Integrasi kalender
  - Kirim list ke WhatsApp supplier (Soon)

**Dashboard Kebocoran Modal**

- **Top 3 Waste (Bulan Ini)**
  1.  Tomat - Rp 180.000 (12 kg terbuang)
  1.  Ayam - Rp 120.000 (3 kg busuk)
  1.  Minyak - Rp 65.000 (2 L tumpah)

  Insight: "Tomat 40% terbuang karena basi, coba beli lebih sedikit tapi sering"

- **Prive Meter**
  - Total ambil pribadi bulan ini: Rp 3.2 juta
  - Persentase dari omzet: 35% ⚠️ Tinggi
  - Rekomendasi: Max 25% untuk kesehatan cash flow

- **Debt Watcher**
  - Utang jatuh tempo minggu ini: Rp 1.5 juta
  - Breakdown: Toko Sumber Rezeki (Rp 800rb), Owner Talangan (Rp 700rb)
  - Status kas: ✓ Cukup untuk bayar semua

- **Price Alert & Trend**
  - "Harga cabai naik 25% dalam 2 minggu terakhir"
  - Grafik trend: Cabai rawit per kg (30 hari)
  - Prediksi: Masih akan naik (musim hujan)

- **Efficiency Score** _(Khusus Multi-Cabang)_ \***_Soon_**
  - Cabang A: Score 87 (Efisien)
  - Cabang B: Score 65 (Boros waste 15%)
  - Cabang C: Score 72 (Harga belanja 20% lebih mahal)
  💡 Insight: "Cabang B buang tomat 3x lebih banyak dari cabang lain"
