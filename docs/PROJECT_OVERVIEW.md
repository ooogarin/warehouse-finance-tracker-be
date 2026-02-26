# PROJECT OVERVIEW

## Pengelola Modal Dapur - Warehouse & Finance Management API

---

## 1. VISI PRODUK

### Pernyataan Visi

Menjadi **asisten keuangan dapur** untuk resto kecil-menengah yang berfokus pada **pencatatan kas dan modal dengan mudah**. Aplikasi ini dirancang untuk mencatat segala bentuk pengeluaran dan pergerakan bahan baku dalam operasional bisnis guna menghentikan kebocoran uang dan bahan baku melalui pencatatan yang **mudah digunakan** namun memberikan analisis **setajam konsultan bisnis**.

### Target Market

- **Primary:** Resto kecil-menengah (10-50 karyawan)
- **Secondary:** Kafe, catering, food truck
- **Criteria:** Owner yang ingin kontrol kas & stok tapi tidak punya background keuangan

### Filosofi Desain

- **Kemudahan** - Sesederhana mungkin, tidak butuh training lama
- **Akurasi** - Data harus akurat untuk analisis yang reliable
- **Insight** - Memberikan visibility tentang arus kas & stok
- **Action** - Actionable recommendations, bukan hanya data

---

## 2. MASALAH YANG DIPECAHKAN

### Problem #1: Kemudahan Penggunaan

**Situasi:**

- Aplikasi yang rumit, butuh waktu lama untuk belajar
- Data yang tidak terstruktur, sulit dianalisis
- Tidak ada dashboard untuk quick overview

**Solusi:**

- UI yang intuitif dengan minimal klik
- Data terstruktur dengan tagging otomatis
- Dashboard real-time dengan insight utama

### Problem #2: Kebocoran Kas (Cash Leakage)

**Situasi:**

- Owner tidak tahu kemana uang pergi setiap hari
- Transaksi kecil-kecilan tidak tercatat
- Sulit identify apakah ada pencurian/mismanagement

**Solusi:**

- Setiap transaksi kas tercatat terstruktur
- Kategorisasi otomatis (belanja, gaji, withdraw, dll)
- Dashboard real-time kas balance
- Historical report per kategori

### Problem #3: Kebocoran Bahan Baku (Stock Leakage)

**Situasi:**

- Barang masuk tapi stok tidak match dengan fisik
- Tidak tahu mana bahan yang expired
- Permintaan bahan tidak ter-planning

**Solusi:**

- Setiap pergerakan barang tercatat (masuk/pakai/rusak)
- FIFO tracking dengan expiry date awareness
- Stock alert untuk barang yang mau habis
- Monthly reconciliation stok fisik vs sistem

### Problem #4: Manajemen Hutang Tidak Jelas

**Situasi:**

- Utang supplier tidak tertrack
- Tidak tahu siapa yang hutang ke kita
- Pembayaran cicilan tanpa dokumentasi

**Solusi:**

- Hutang supplier tercatat dengan due date
- Hutang owner (ambil pribadi) terpisah & tercatat
- Payment history per utang
- Reminder untuk utang yang akan jatuh tempo

### Problem #5: Tidak Ada Visibility Arus Kas

**Situasi:**

- Tidak tahu berapa profit sebenarnya
- Tidak ada data untuk decision making
- Comparison dengan bulan lalu sulit

**Solusi:**

- Dashboard kas harian, mingguan, bulanan
- Cost breakdown per kategori
- Profit margin tracking (jika ada sales integration)
- Monthly financial summary

---

## 3. CORE FEATURES

### A. MANAJEMEN KAS (Cash Management)

#### Feature: Pencatatan Kas Harian

```
Transaksi Masuk:
- Hasil penjualan
- Setoran modal owner
- Pembayaran hutang dari customer

Transaksi Keluar:
- Pembayaran belanja bahan
- Pembayaran utang supplier
- Gaji karyawan
- Utility (listrik, air, gas)
- Sewa tempat
- Maintenance/service
- Ambil pribadi (withdraw owner)
```

**Kemudahan Pencatatan:**

- Cepat & simple (2-3 clicks)
- Otomatis categorize berdasarkan tipe
- Receipt/bukti upload (optional)
- Multiple payment method support

#### Feature: Dashboard Kas

- Saldo kas hari ini (real-time)
- Kas masuk vs keluar hari ini
- Top spending categories hari ini
- Comparison dengan kemarin & bulan lalu
- Cash flow projection (jika ada pattern)

#### Feature: Laporan Kas

- Laporan harian (per hari)
- Laporan mingguan (per minggu)
- Laporan bulanan (per bulan)
- Per kategori breakdown
- Comparison dengan periode sebelumnya

---

### B. MANAJEMEN STOK (Stock Management)

#### Feature: Tracking Bahan Baku

```
Data per bahan:
- Nama bahan & kategori (daging, sayur, minyak, dll)
- Unit satuan (kg, liter, pcs, dll)
- Stok saat ini
- Harga pokok (untuk COGS)
- Min stock alert (jika kurang, perlu order)
```

#### Feature: Pencatatan Pergerakan Stok

- **Masuk**: Dari pembelian supplier
- **Pakai**: Digunakan untuk operasional
- **Rusak**: Waste/expired yang harus dibuang
- **Adjustment**: Hasil inventory opname (koreksi sistem vs fisik)

#### Feature: Pembelian Bahan (Purchase Orders)

```
PO tracking:
- Supplier mana
- Tanggal beli
- Total belanja
- Bayar berapa (tunai/hutang)
- Barang apa & berapa
- Invoice number (untuk matching dengan supplier)
```

#### Feature: FIFO Cost Tracking

- Setiap batch bahan tercatat dengan harga pokok
- Saat dipakai, dihitung dari batch tertua dulu (FIFO)
- Cost of goods sold (COGS) otomatis terhitung
- Profit margin jadi akurat

#### Feature: Inventory Opname

- Monthly/quarterly physical count vs sistem
- Identify variances (barang hilang/tercuri/error pencatatan)
- Auto-create adjustment jika ada selisih

---

### C. MANAJEMEN HUTANG (Debt Management)

#### Feature: Hutang Supplier

```
Track per supplier:
- Total hutang
- Sudah bayar berapa
- Sisa berapa
- Due date
- Payment history
```

#### Feature: Hutang Owner

```
Track personal withdrawal:
- Total ambil pribadi
- Kapan ambil
- Untuk apa (optional notes)
- Belum di-return berapa
```

#### Feature: Pembayaran Hutang

- Record setiap pembayaran
- Multiple payment method (cash/transfer)
- Reference number (untuk matching)
- Update hutang status otomatis

---

### D. MULTI-MERCHANT SUPPORT

#### Feature: Multiple Restaurants/Branches

- Owner bisa manage multiple resto sekaligus
- Tiap resto = terpisah kas, stok, hutang
- Bisa switch antar resto dalam satu dashboard
- Consolidated report untuk semua resto (optional)

#### Feature: User Management

- Owner = full access
- Staff/Cashier = limited access (hanya catet transaksi)
- Role-based permissions

---

## 4. USER STORIES & USE CASES

### Use Case #1: Pencatatan Kas Harian (5 menit)

```
Skenario: Cashier catat transaksi harian

Morning:
1. Input: "Bayar listrik Rp 150,000"
   → Auto-categorize: Utilities
   → Auto-deduct dari saldo

2. Input: "Bayar gaji staff Rp 2,000,000"
   → Auto-categorize: Salary
   → Auto-deduct dari saldo

Afternoon:
3. Input: "Beli bahan supplier A Rp 500,000"
   → Auto-categorize: Purchase Payment
   → Ask: Bayar tunai/hutang?
   → Update stok ingredients

Evening:
4. Dashboard show:
   - Saldo hari ini: Rp XXX (dari pagi)
   - Keluar hari ini: Rp 2,650,000
   - Breakdown per kategori
```

### Use Case #2: Purchase Order & Stock In

```
Skenario: Manager order bahan ke supplier

Step 1: Create Purchase Order
- Supplier: PT Daging Jaya
- Total: Rp 5,000,000
- Items:
  - Ayam Broiler 100kg @ 50,000/kg
  - Daging Sapi 50kg @ 80,000/kg

Step 2: Terima barang
- Barang sampai hari Kamis
- System auto-update stok:
  - Ayam Broiler: +100kg
  - Daging Sapi: +50kg
- Record batch untuk FIFO tracking
- Create hutang: Rp 5,000,000 (jika belum bayar)

Step 3: Pembayaran
- Owner bayar via transfer Rp 3,000,000 hari Jumat
- Sisa hutang Rp 2,000,000 (due hari Senin)
- System reminder hari Senin
```

### Use Case #3: Stock Adjustment

```
Skenario: Daily stock usage & inventory opname

Daily:
1. Masak pakai 20kg Ayam Broiler
   - Input: "Pakai ayam 20kg"
   - System deduct stok: 100kg - 20kg = 80kg
   - Calculate COGS: 20kg × 50,000 = 1,000,000

2. Daging rusak 5kg
   - Input: "Rusak daging 5kg"
   - System deduct: 50kg - 5kg = 45kg
   - Log as waste (separate dari COGS)

Monthly Inventory Opname:
1. Physical count: Ayam Broiler = 75kg (sistem 80kg)
2. Selisih: -5kg (error pencatatan atau hilang)
3. System: Create adjustment -5kg
4. Update stok: 80kg - 5kg = 75kg ✓

Result: COGS accurate, Waste tracked, Stock = fisik
```

### Use Case #4: Monthly Financial Analysis

```
Skenario: Owner lihat laporan bulanan

Dashboard Summary:
- Total kas in: Rp 50,000,000
- Total kas out: Rp 45,000,000
- Profit: Rp 5,000,000

Breakdown:
- Belanja bahan: Rp 20,000,000 (44%)
- Gaji: Rp 15,000,000 (33%)
- Utility: Rp 5,000,000 (11%)
- Maintenance: Rp 2,000,000 (4%)
- Other: Rp 3,000,000 (7%)

Insight:
- Belanja bahan naik 10% vs bulan lalu
- Gaji stabil
- Utility naik karena cuaca panas (AC++)
- Rekomendasi: Cek supplier, ada yang lebih murah?

Action:
- Download laporan PDF untuk konsultasi
- Compare dengan bulan sebelumnya
- Set budget untuk bulan depan
```

---

## 5. CORE FEATURES PRIORITY

### Phase 1: Foundation (MVP)

- [x] Database schema
- [x] Authentication (JWT)
- [x] Kas management (in/out)
- [x] Supplier management
- [x] Stock tracking (in/out/waste)
- [x] Debt management
- [x] Basic reporting

### Phase 2: Enhancement

- [ ] Expiry date tracking
- [ ] PO status workflow (draft → confirmed → received)
- [ ] Reconciliation tools
- [ ] Alerts & reminders
- [ ] Better reporting (charts, trends)

### Phase 3: Advanced

- [ ] Budget planning
- [ ] Cost analysis per menu (if sales integrated)
- [ ] Supplier performance tracking
- [ ] Inventory forecasting
- [ ] Mobile app (if web first)

---

## 6. SUCCESS METRICS

### For User (Owner/Manager)

- ✅ Dapat catat transaksi dalam < 1 menit
- ✅ Dashboard kas update real-time
- ✅ Stok selalu match dengan fisik
- ✅ Tahu kemana uang pergi setiap bulan
- ✅ Dapat ambil decision berdasarkan data

### For Business

- ✅ Reduce kas leakage by 20-30%
- ✅ Better inventory management (reduce waste)
- ✅ Clear financial visibility
- ✅ Faster transaction processing
- ✅ Scalable to multiple locations

---

## 7. COMPETITIVE ADVANTAGES

### 1. **Simplicity First**

- Pencatatan sangat simple
- No complex UI, no learning curve
- Ideal untuk owner tanpa financial background

### 2. **Designed untuk Resto, bukan generic**

- Specific untuk warehouse + keuangan dapur
- Understand pain points operator
- Not over-engineered

### 3. **FIFO Cost Tracking**

- Accurate profit calculation
- Batch tracking untuk quality control
- Expiry date awareness

### 4. **Complete Audit Trail**

- Setiap transaksi tercatat
- Easy tracing untuk investigasi
- Compliance-ready

### 5. **Multi-tenancy**

- Manage multiple resto di satu platform
- Consolidated reporting
- Easy scaling

---

## 8. GO-TO-MARKET STRATEGY

### Target Customer Profile

- Owner resto kecil-menengah (1-5 lokasi)
- Struggling dengan cash flow yang rumit
- Willing to pay untuk solution

### Pricing Model (Suggested)

```
FREE:
- 1 resto, basic features
- Limited access and reporting

BASIC (Rp 60K/bulan):
- 1 resto, all features

PROFESSIONAL (Rp 140K/bulan):
- 3 resto, advanced reporting

ENTERPRISE (custom):
- Custom integration, dedicated support
```

### Go-Live Checklist

- [ ] MVP ready (core features)
- [ ] Beta testing dengan 3-5 real customers
- [ ] Documentation complete
- [ ] Customer support process
- [ ] Basic onboarding training
- [ ] Security audit
- [ ] Performance testing

---

## 9. RISKS & MITIGATION

### Risk #1: User tidak terbiasa teknologi

**Mitigation:**

- Super simple UI
- Video tutorials (YouTube)
- WhatsApp support

### Risk #2: Data security & trust

**Mitigation:**

- Proper encryption
- Regular backups
- Clear privacy policy
- ISO certification (future)

### Risk #3: Data accuracy (garbage in, garbage out)

**Mitigation:**

- Input validation
- Reconciliation tools
- Data consistency checks
- Training untuk user

### Risk #4: Integration dengan sistem existing

**Mitigation:**

- Standalone system dulu (no integration)
- Import/export data tools

---

## 10. GLOSSARY & DEFINITIONS

### Key Terms

- **Merchant** = Resto/cafe/catering (satu lokasi)
- **Stock Leakage** = Barang yang hilang, tidak match antara sistem & fisik
- **Cash Leakage** = Uang yang tidak tercatat atau hilang
- **FIFO** = First In First Out (batch tracking untuk cost)
- **COGS** = Cost of Goods Sold (harga pokok barang yang dipakai)
- **PO** = Purchase Order (belanja ke supplier)
- **Soft Delete** = Data ditandai deleted tapi tidak dihapus dari DB
- **Debt** = Hutang (supplier atau personal)

---

## APPENDIX: KEY DOCUMENTS REFERENCE

All supporting documentation:

- `database_schema.md` - Full database design
- `folder_structure_summary.md` - Project structure (backend)

---

**Project:** Pengelola Modal Dapur (Warehouse & Finance Management)
**Version:** 1.0
**Last Updated:** 2025-02-12
**Status:** Ready for Implementation

---
