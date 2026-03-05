# 📦 Panduan Menggunakan Dashboard Alat Ganti Komputer

## 🎯 Cara Menambah Peralatan Baru

### Langkah 1: Klik Tombol "Tambah Peralatan Baru"
Cari tombol berwarna biru dengan tanda **➕ Tambah Nama Peralatan Baru** di bagian atas "Senarai Peralatan"

### Langkah 2: Form Modal Akan Terbuka
Sebuah jendela (modal) akan muncul dengan form untuk menambah peralatan baru

### Langkah 3: Isi Data Peralatan
Isi semua kolom yang diperlukan (ditandai dengan *):

**Field Wajib Diisi:**
- **Nama Peralatan** - Contoh: "RAM Kingston 8GB", "SSD Samsung 256GB"
- **Kategori** - Pilih dari dropdown (Desktop,Laptop)


### Langkah 4: Simpan Peralatan
Klik tombol **💾 Simpan Peralatan**

### Langkah 5: Lihat Hasil
Peralatan akan langsung muncul di tabel "Senarai Peralatan" dengan:
- Nama peralatan
- Kategori
- Tombol Edit dan Hapus

## 📝 Contoh Penambahan

### Contoh: Menambah RAM
1. Klik "Tambah Peralatan Baru"
2. Isi:
   - Nama: RAM Kingston 8GB
   - Kategori: Laptop
3. Klik "Simpan Peralatan"
4. RAM akan muncul di tabel


## ✏️ Cara Edit Peralatan
1. Di tabel "Senarai Peralatan", klik tombol **✏️ Edit** pada peralatan yang ingin diubah
2. Form akan terbuka dengan data existing
3. Ubah data yang diperlukan
4. Klik "Simpan Peralatan"

## 🗑️ Cara Hapus Peralatan
1. Di tabel "Senarai Peralatan", klik tombol **🗑️ Hapus** pada peralatan yang ingin dihapus
2. Konfirmasi penghapusan
3. Peralatan akan dihapus dari sistem

## 💾 Penyimpanan Data
- **Data disimpan otomatis** di browser (localStorage)
- Data akan tetap ada meski browser ditutup dan dibuka ulang
- Untuk reset data, buka DevTools (F12) → Console → Jalankan: `localStorage.clear()` → Refresh

## 📊 Dashboard
- **Total Item** - Jumlah jenis peralatan yang ada
- **Tersedia** - Peralatan dalam kondisi baik
- **Stok Rendah** - Peralatan dengan jumlah ≤ 2
- **Rusak/Diperbaiki** - Peralatan yang sedang diperbaiki

## 📖 Navigasi Menu
- **Dashboard** - Ringkasan statistik
- **Senarai Peralatan** - Daftar lengkap peralatan
- **Inventori** - Daftar item dengan filter
- **Tambah Item** - Form tambah item (untuk inventori)
- **Laporan** - Export dan cetak data

---

✅ Selamat menggunakan Dashboard Alat Ganti Komputer!
