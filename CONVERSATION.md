# Ringkasan Percakapan - Hitung Air

Dokumen ini berisi rangkuman diskusi mengenai rumus dan implementasi kodingan pada proyek **hitung-air**.

## Tanggal: 7 Juli 2026

### 1. Permintaan Pengguna
Pengguna meminta penjelasan dan dokumentasi mengenai rumus yang digunakan dalam aplikasi `hitung-air`.

### 2. Rumus yang Didokumentasikan
Saya telah menambahkan file `RUMUS.md` yang mencakup:
- **Konversi Satuan**: Liter $\leftrightarrow$ Meter Kubik.
- **Logika Periode**: Siklus tagihan tanggal 10 hingga tanggal 9 bulan berikutnya.
- **Dashboard**: Perhitungan Total dan Rata-rata penggunaan per periode.

### 3. Review Kodingan
Kodingan utama yang direview meliputi:
- `getCalculationMonth`: Fungsi untuk menentukan periode bulan berdasarkan tanggal input.
- `handleCubicMeterChange` & `handleLiterChange`: Fungsi sinkronisasi input satuan.
- `useMemo` hooks: Untuk efisiensi perhitungan total dan rata-rata secara real-time.

### 4. Tindakan yang Diambil
- Membuat file `RUMUS.md`.
- Memperbarui `README.md` untuk mereferensikan dokumentasi rumus.
- Melakukan push perubahan ke branch `main` di GitHub.

---
*Catatan: File ini dibuat secara otomatis untuk menyimpan riwayat pengembangan dan diskusi terkait rumus aplikasi.*
