"use client";

// Daftar pilih sesi, muncul kalau ada lebih dari satu sesi berjalan.
// Tombol GPS menandai sesi yang cocok dengan posisi sekarang dan menaikkannya ke atas.
// Pengguna tetap mengetuk sendiri sesi tujuannya, tidak ada perpindahan otomatis.

import Link from "next/link";
import { useState } from "react";
import { hitungPosisi, type Acuan } from "@/lib/ruas";
import { formatKm, formatSta } from "@/lib/sta";

// Sama dengan tombol GPS di form temuan: lebih buruk dari ini, posisi tidak dipakai
const AKURASI_TOLAK_M = 100;

export type SesiPilihan = {
  id: number;
  awalM: number;
  akhirM: number; // sudah sampai ujung KM akhir, contoh 20+999
  arah: string;
  keterangan: string; // contoh "Harian, 2026-11-26"
};

type Posisi = { lat: number; lon: number; akurasiM: number; waktuMs: number; staM: number; arahSaran: string | null };

export function PilihSesiGps({ sesi, acuan }: { sesi: SesiPilihan[]; acuan: Acuan[] }) {
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [posisi, setPosisi] = useState<Posisi | null>(null);

  function cocok(s: SesiPilihan, p: Posisi) {
    const dalamRentang = p.staM >= s.awalM && p.staM <= s.akhirM;
    // Arah hanya ikut dicocokkan kalau GPS cukup akurat untuk menebak arah
    const arahSesuai = p.arahSaran === null || p.arahSaran === s.arah;
    return dalamRentang && arahSesuai;
  }

  function ambil() {
    setPesan(null);
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      setPesan("Lokasi tidak bisa dibaca di alamat ini. Buka NRB lewat alamat https (situs online) atau localhost.");
      return;
    }
    setSibuk(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setSibuk(false);
        const { latitude: lat, longitude: lon, accuracy } = p.coords;
        if (accuracy > AKURASI_TOLAK_M) {
          setPesan(`Sinyal GPS lemah, akurasi sekitar ${Math.round(accuracy)} m. Tunggu sebentar di tempat terbuka, lalu coba lagi.`);
          return;
        }
        const hasil = hitungPosisi(lat, lon, accuracy, acuan);
        if (hasil.staM === null) {
          setPesan(`Posisi ini ${Math.round(hasil.jarakKeAsM)} m dari garis as, di luar ruas Tomang sampai Bitung.`);
          return;
        }
        setPosisi({ lat, lon, akurasiM: accuracy, waktuMs: p.timestamp, staM: hasil.staM, arahSaran: hasil.arahSaran });
      },
      (err) => {
        setSibuk(false);
        setPesan(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan Lokasi untuk NRB di pengaturan situs, lalu coba lagi."
            : "Posisi belum didapat. Pastikan Lokasi di HP menyala, lalu coba lagi di tempat terbuka.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  // Sesi yang cocok naik ke atas, urutan sisanya tetap
  const urut = posisi ? [...sesi].sort((a, b) => Number(cocok(b, posisi)) - Number(cocok(a, posisi))) : sesi;
  const jumlahCocok = posisi ? sesi.filter((s) => cocok(s, posisi)).length : 0;

  function tautan(s: SesiPilihan) {
    const q = new URLSearchParams({ inspeksi: String(s.id), kembali: `/riwayat/${s.id}` });
    // Posisi GPS ikut dibawa supaya form temuan tidak perlu mengambil GPS lagi
    if (posisi) {
      q.set("gps_lat", String(posisi.lat));
      q.set("gps_lon", String(posisi.lon));
      q.set("gps_akurasi", String(posisi.akurasiM));
      q.set("gps_waktu", String(posisi.waktuMs));
    }
    return `/catat/temuan?${q.toString()}`;
  }

  return (
    <div className="mt-4">
      <p className="rounded-xl bg-[#EEF1F5] px-4 py-3 text-sm text-[#2D3B52]">
        Ada {sesi.length} sesi berjalan. Pilih sesi tujuan temuan ini.
      </p>

      <button
        type="button"
        onClick={ambil}
        disabled={sibuk}
        className="mt-3 w-full rounded-xl border border-[#14213D] bg-white px-4 py-3 text-sm font-semibold text-[#14213D] disabled:opacity-60"
      >
        {sibuk ? "Membaca GPS..." : "Cari sesi dari posisi saya"}
      </button>

      {pesan ? (
        <p className="mt-2 rounded-xl border border-[#F4B183] bg-[#FFEDD5] px-3 py-2 text-sm text-[#7C2D12]">{pesan}</p>
      ) : null}

      {posisi ? (
        <p className="mt-2 rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-sm">
          Posisi lu sekitar STA {formatSta(posisi.staM)}
          {posisi.arahSaran ? `, ${posisi.arahSaran}` : ", arah belum bisa ditebak"} (akurasi{" "}
          {Math.round(posisi.akurasiM)} m).{" "}
          {jumlahCocok === 0 ? "Tidak ada sesi yang cocok, pilih sendiri." : `${jumlahCocok} sesi cocok.`}
        </p>
      ) : null}

      <ul className="mt-3 flex flex-col gap-2">
        {urut.map((s) => {
          const ditandai = posisi !== null && cocok(s, posisi);
          return (
            <li key={s.id}>
              <Link
                href={tautan(s)}
                className={`block rounded-xl border px-4 py-3 ${
                  ditandai ? "border-2 border-[#16A34A] bg-[#F0FDF4]" : "border-[#DCE2EA] bg-white"
                }`}
              >
                {ditandai ? (
                  <span className="mb-1 inline-block rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#14532D]">
                    Cocok dengan posisi lu
                  </span>
                ) : null}
                <span className="block text-base font-semibold">
                  {formatKm(s.awalM)} sampai {formatKm(s.akhirM)}, {s.arah}
                </span>
                <span className="block text-sm text-[#4A5568]">{s.keterangan}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
