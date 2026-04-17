# hitung-air

Website Next.js untuk pencatatan penggunaan air dan perhitungan rata-rata pengeluaran air bulanan.

## Fitur

- Pencatatan: tanggal, jam, meter kubik, dan liter
- Dashboard perhitungan bulanan (total dan rata-rata)
- Toggle unit perhitungan: liter / meter kubik
- Data pencatatan disimpan ke Firebase Firestore (`water-records`)

## Menjalankan proyek

1. Install dependency:

```bash
npm install
```

2. Buat file `.env.local` lalu isi:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Dokumentasi Firestore

Lihat [`FIRESTORE.md`](./FIRESTORE.md) untuk detail struktur koleksi, tipe data setiap field, contoh dokumen, dan rekomendasi security rules.
