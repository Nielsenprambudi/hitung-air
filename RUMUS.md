# Rumus Perhitungan - Hitung Air

Dokumen ini menjelaskan rumus-rumus yang digunakan dalam aplikasi **hitung-air** untuk melakukan perhitungan penggunaan air.

## 1. Konversi Satuan
Aplikasi ini mendukung dua satuan: **Meter Kubik (m³)** dan **Liter (L)**.
- **Meter Kubik ke Liter**:
  $$ \text{Liter} = \text{Meter Kubik} \times 1000 $$
- **Liter ke Meter Kubik**:
  $$ \text{Meter Kubik} = \frac{\text{Liter}}{1000} $$

## 2. Penentuan Periode Tagihan (Bulan Perhitungan)
Aplikasi menggunakan logika siklus tagihan dari **tanggal 10 ke tanggal 9 bulan berikutnya**.
- Jika tanggal pencatatan $< 10$: Masuk ke periode bulan sebelumnya.
- Jika tanggal pencatatan $\ge 10$: Masuk ke periode bulan berjalan.

**Contoh:**
- Pencatatan tanggal `2026-05-05` masuk ke periode `2026-04`.
- Pencatatan tanggal `2026-05-15` masuk ke periode `2026-05`.

## 3. Total Penggunaan Periode
Total penggunaan dihitung berdasarkan jumlah seluruh liter dalam periode yang dipilih.
$$ \text{Total} = \sum_{i=1}^{n} \text{Liter}_i $$
Dimana $n$ adalah jumlah data pada periode tersebut.

## 4. Rata-rata Penggunaan
Rata-rata dihitung dengan membagi total penggunaan dengan jumlah entri data dalam periode tersebut.
$$ \text{Rata-rata} = \frac{\text{Total Penggunaan}}{\text{Jumlah Pencatatan}} $$

---
*Catatan: Semua perhitungan dilakukan secara otomatis oleh sistem saat Anda memasukkan data atau mengubah unit tampilan.*
