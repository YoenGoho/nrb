"use client";

// Isian waktu ditemukan. Tampil ringkas satu baris, dengan tombol Ubah untuk membuka
// isian tanggal dan jam. Kalau tombol GPS dipakai, waktunya otomatis ikut waktu GPS.

import { useEffect, useRef, useState } from "react";
import { formatWaktu, isianWibKeIso, isoKeIsianWib, PERISTIWA_WAKTU_GPS, tanggalWib } from "@/lib/waktu";

export type Periode = { mulai: string; akhir: string | null };

export function IsianWaktuDitemukan({ awalIso, periode }: {
  awalIso: string; // isi awal: waktu form dibuka, atau waktu yang sudah tersimpan
  periode: Periode | null; // periode sesi, untuk peringatan di luar periode
}) {
  const [iso, setIso] = useState(awalIso);
  const [buka, setBuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  // Mendengarkan kabar dari tombol GPS di form yang sama
  useEffect(() => {
    const form = wadah.current?.closest("form");
    if (!form) return;
    const dengar = (e: Event) => {
      const waktu = (e as CustomEvent<string>).detail;
      if (typeof waktu === "string") setIso(waktu);
    };
    form.addEventListener(PERISTIWA_WAKTU_GPS, dengar);
    return () => form.removeEventListener(PERISTIWA_WAKTU_GPS, dengar);
  }, []);

  const tanggal = tanggalWib(iso);
  const diLuar =
    periode !== null && (tanggal < periode.mulai || (periode.akhir !== null && tanggal > periode.akhir));

  return (
    <div ref={wadah}>
      <p className="mb-1 block text-xs font-semibold text-[#4A5568]">Waktu ditemukan</p>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DCE2EA] bg-white px-3 py-2">
        {/* suppressHydrationWarning: server dan HP bisa berbeda sedikit cara menulis jamnya */}
        <p className="text-base" suppressHydrationWarning>{formatWaktu(iso)}</p>
        <button
          type="button"
          onClick={() => setBuka(!buka)}
          className="shrink-0 text-sm font-semibold text-[#14213D] underline"
        >
          {buka ? "Selesai" : "Ubah"}
        </button>
      </div>

      {buka ? (
        <input
          type="datetime-local"
          aria-label="Tanggal dan jam ditemukan"
          className="mt-2 w-full rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base"
          value={isoKeIsianWib(iso)}
          onChange={(e) => {
            if (e.target.value) setIso(isianWibKeIso(e.target.value));
          }}
        />
      ) : null}

      {/* Nilai yang benar-benar dikirim ke server, lengkap sampai detik */}
      <input type="hidden" name="ditemukan_pada" value={iso} />

      {diLuar ? (
        <p className="mt-2 rounded-xl border border-[#F2C94C] bg-[#FEF9C3] px-3 py-2 text-sm text-[#713F12]">
          Tanggal ini di luar periode sesi ({periode.mulai}
          {periode.akhir && periode.akhir !== periode.mulai ? ` sampai ${periode.akhir}` : ""}). Temuan tetap
          bisa disimpan dan akan diberi tanda.
        </p>
      ) : null}
    </div>
  );
}
