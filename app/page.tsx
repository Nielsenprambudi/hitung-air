"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";

type WaterRecord = {
  id: string;
  date: string;
  time: string;
  cubicMeter: number;
  liter: number;
};

const now = new Date();
const today = now.toISOString().slice(0, 10);
const currentTime = now.toTimeString().slice(0, 5);

// Helper to get the calculation month for a given date (10th to 9th)
// If date is >= 10, it's the current month. If < 10, it's the previous month.
const getCalculationMonth = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  
  if (d.getDate() < 10) {
    d.setMonth(d.getMonth() - 1);
  }
  return d.toISOString().slice(0, 7);
};

const currentCalculationMonth = getCalculationMonth(today);

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export default function Home() {
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [cubicMeter, setCubicMeter] = useState("");
  const [liter, setLiter] = useState("");
  const [records, setRecords] = useState<WaterRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentCalculationMonth);
  const [displayUnit, setDisplayUnit] = useState<"liter" | "m3">("liter");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingRecord, setEditingRecord] = useState<WaterRecord | null>(null);

  useEffect(() => {
    if (!db) {
      return;
    }

    const recordsQuery = query(
      collection(db, "water-records"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const nextRecords = snapshot.docs.map((doc) => ({
        id: doc.id,
        date: String(doc.data().date ?? ""),
        time: String(doc.data().time ?? ""),
        cubicMeter: Number(doc.data().cubicMeter ?? 0),
        liter: Number(doc.data().liter ?? 0),
      }));

      setRecords(nextRecords);
    }, (error) => {
      console.error("Firestore error:", error);
      setErrorMessage("Gagal mengambil data dari database. Pastikan Index Firestore sudah dibuat.");
    });

    return () => unsubscribe();
  }, []);

  const monthlyRecords = useMemo(() => {
    return records.filter((record) => getCalculationMonth(record.date) === selectedMonth);
  }, [records, selectedMonth]);

  const totalLiter = useMemo(
    () => monthlyRecords.reduce((total, item) => total + item.liter, 0),
    [monthlyRecords]
  );

  const averageLiter =
    monthlyRecords.length > 0 ? totalLiter / monthlyRecords.length : 0;

  const totalDisplayValue = displayUnit === "liter" ? totalLiter : totalLiter / 1000;
  const averageDisplayValue =
    displayUnit === "liter" ? averageLiter : averageLiter / 1000;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!db) {
      setErrorMessage("Konfigurasi Firebase belum lengkap.");
      return;
    }

    const cubicMeterValue = Number(cubicMeter);
    const literValue = Number(liter);

    if (
      Number.isNaN(cubicMeterValue) ||
      Number.isNaN(literValue) ||
      cubicMeterValue < 0 ||
      literValue < 0
    ) {
      setErrorMessage("Nilai meter kubik dan liter harus valid.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      if (editingRecord) {
        await updateDoc(doc(db as any, "water-records", editingRecord.id), {
          date,
          time,
          cubicMeter: cubicMeterValue,
          liter: literValue,
        });
        setEditingRecord(null);
      } else {
        await addDoc(collection(db, "water-records"), {
          date,
          time,
          cubicMeter: cubicMeterValue,
          liter: literValue,
          createdAt: serverTimestamp(),
        });
      }

      setCubicMeter("");
      setLiter("");
      setDate(today);
      setTime(currentTime);
    } catch (error) {
      console.error(error);
      setErrorMessage("Gagal menyimpan pencatatan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db || !confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await deleteDoc(doc(db as any, "water-records", id));
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data.");
    }
  }

  function handleEdit(record: WaterRecord) {
    setEditingRecord(record);
    setDate(record.date);
    setTime(record.time);
    setCubicMeter(String(record.cubicMeter));
    setLiter(String(record.liter));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function clearPreviousData() {
    if (!db || !confirm("Hapus semua data dari bulan-bulan sebelumnya?")) return;
    
    const previousRecords = records.filter(
      (record) => getCalculationMonth(record.date) < currentCalculationMonth
    );

    if (previousRecords.length === 0) {
      alert("Tidak ada data bulan sebelumnya untuk dihapus.");
      return;
    }

    try {
      if (!db) return;
      const batch = writeBatch(db);
      previousRecords.forEach((record) => {
        batch.delete(doc(db as any, "water-records", record.id));
      });
      await batch.commit();
      alert(`Berhasil menghapus ${previousRecords.length} data lama.`);
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus data lama.");
    }
  }

  function handleCubicMeterChange(value: string) {
    setCubicMeter(value);
    const parsed = Number(value);
    setLiter(value && !Number.isNaN(parsed) ? String(parsed * 1000) : "");
  }

  function handleLiterChange(value: string) {
    setLiter(value);
    const parsed = Number(value);
    setCubicMeter(value && !Number.isNaN(parsed) ? String(parsed / 1000) : "");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard Pengeluaran Air</h1>
        <button
          onClick={clearPreviousData}
          className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Hapus Data Bulan Lalu
        </button>
      </div>

      {!isFirebaseConfigured ? (
        <div className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-3 text-amber-900">
          Firebase belum dikonfigurasi. Tambahkan variabel NEXT_PUBLIC_FIREBASE_*
          agar data tersimpan ke database.
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="mb-3 text-xl font-semibold">
          {editingRecord ? "Edit Pencatatan" : "Pencatatan Baru"}
        </h2>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span>Tanggal</span>
            <input
              type="date"
              className="rounded border border-zinc-300 px-3 py-2"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Jam</span>
            <input
              type="time"
              className="rounded border border-zinc-300 px-3 py-2"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Meter Kubik (m³)</span>
            <input
              type="number"
              step="0.001"
              min="0"
              className="rounded border border-zinc-300 px-3 py-2"
              value={cubicMeter}
              onChange={(event) => handleCubicMeterChange(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Liter (L)</span>
            <input
              type="number"
              step="1"
              min="0"
              className="rounded border border-zinc-300 px-3 py-2"
              value={liter}
              onChange={(event) => handleLiterChange(event.target.value)}
              required
            />
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving || !isFirebaseConfigured}
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSaving ? "Menyimpan..." : editingRecord ? "Simpan Perubahan" : "Simpan Pencatatan"}
            </button>
            {editingRecord && (
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setCubicMeter("");
                  setLiter("");
                  setDate(today);
                  setTime(currentTime);
                }}
                className="rounded border border-zinc-300 px-4 py-2 font-medium text-zinc-700"
              >
                Batal
              </button>
            )}
          </div>
        </form>
        {errorMessage ? <p className="mt-2 text-red-600">{errorMessage}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Dashboard Perhitungan</h2>
            <p className="text-xs text-zinc-500 italic">Periode: Tanggal 10 s/d Tanggal 9 bulan berikutnya</p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="month-filter">Bulan Tagihan:</label>
            <input
              id="month-filter"
              type="month"
              className="rounded border border-zinc-300 px-3 py-2"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDisplayUnit("liter")}
            className={`rounded px-3 py-1 ${
              displayUnit === "liter"
                ? "bg-blue-600 text-white"
                : "border border-zinc-300"
            }`}
          >
            Liter
          </button>
          <button
            type="button"
            onClick={() => setDisplayUnit("m3")}
            className={`rounded px-3 py-1 ${
              displayUnit === "m3"
                ? "bg-blue-600 text-white"
                : "border border-zinc-300"
            }`}
          >
            Meter Kubik
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg bg-zinc-100 p-3">
            <p className="text-sm text-zinc-700">Jumlah Pencatatan</p>
            <p className="text-2xl font-bold">{monthlyRecords.length}</p>
          </article>
          <article className="rounded-lg bg-zinc-100 p-3">
            <p className="text-sm text-zinc-700">
              Total Periode ({displayUnit === "liter" ? "L" : "m³"})
            </p>
            <p className="text-2xl font-bold">
              {numberFormatter.format(totalDisplayValue)}
            </p>
          </article>
          <article className="rounded-lg bg-zinc-100 p-3">
            <p className="text-sm text-zinc-700">
              Rata-rata Periode ({displayUnit === "liter" ? "L" : "m³"})
            </p>
            <p className="text-2xl font-bold">
              {numberFormatter.format(averageDisplayValue)}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="mb-3 text-xl font-semibold">Riwayat Pencatatan</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-2 py-2">Tanggal</th>
                <th className="px-2 py-2">Jam</th>
                <th className="px-2 py-2">Meter Kubik</th>
                <th className="px-2 py-2">Liter</th>
                <th className="px-2 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-2 py-2">{record.date}</td>
                  <td className="px-2 py-2">{record.time}</td>
                  <td className="px-2 py-2">
                    {numberFormatter.format(record.cubicMeter)}
                  </td>
                  <td className="px-2 py-2">
                    {numberFormatter.format(record.liter)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => handleEdit(record)}
                      className="mr-2 text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-zinc-500" colSpan={5}>
                    Belum ada data pencatatan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
