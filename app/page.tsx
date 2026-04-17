"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
const currentMonth = now.toISOString().slice(0, 7);

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export default function Home() {
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [cubicMeter, setCubicMeter] = useState("");
  const [liter, setLiter] = useState("");
  const [records, setRecords] = useState<WaterRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [displayUnit, setDisplayUnit] = useState<"liter" | "m3">("liter");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    });

    return () => unsubscribe();
  }, []);

  const monthlyRecords = useMemo(
    () => records.filter((record) => record.date.startsWith(selectedMonth)),
    [records, selectedMonth]
  );

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
      await addDoc(collection(db, "water-records"), {
        date,
        time,
        cubicMeter: cubicMeterValue,
        liter: literValue,
        createdAt: serverTimestamp(),
      });

      setCubicMeter("");
      setLiter("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Gagal menyimpan pencatatan.");
    } finally {
      setIsSaving(false);
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
      <h1 className="text-3xl font-bold">Dashboard Pengeluaran Air</h1>

      {!isFirebaseConfigured ? (
        <div className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-3 text-amber-900">
          Firebase belum dikonfigurasi. Tambahkan variabel NEXT_PUBLIC_FIREBASE_*
          agar data tersimpan ke database.
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="mb-3 text-xl font-semibold">Pencatatan</h2>
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

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving || !isFirebaseConfigured}
              className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSaving ? "Menyimpan..." : "Simpan Pencatatan"}
            </button>
          </div>
        </form>
        {errorMessage ? <p className="mt-2 text-red-600">{errorMessage}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Dashboard Perhitungan</h2>

          <div className="flex items-center gap-2">
            <label htmlFor="month-filter">Bulan:</label>
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
              Total Bulanan ({displayUnit === "liter" ? "L" : "m³"})
            </p>
            <p className="text-2xl font-bold">
              {numberFormatter.format(totalDisplayValue)}
            </p>
          </article>
          <article className="rounded-lg bg-zinc-100 p-3">
            <p className="text-sm text-zinc-700">
              Rata-rata Bulanan ({displayUnit === "liter" ? "L" : "m³"})
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
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2">{record.date}</td>
                  <td className="px-2 py-2">{record.time}</td>
                  <td className="px-2 py-2">
                    {numberFormatter.format(record.cubicMeter)}
                  </td>
                  <td className="px-2 py-2">
                    {numberFormatter.format(record.liter)}
                  </td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-zinc-500" colSpan={4}>
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
