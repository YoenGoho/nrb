import Link from "next/link";
import {
  belumDiukur,
  diinputBelakangan,
  diLuarPeriode,
  diLuarRentang,
  kodeTemuan,
  lokasiTemuan,
  namaJenis,
  type BarisTemuan,
} from "@/lib/temuan";
import { formatWaktu } from "@/lib/waktu";

// Satu kartu temuan, dipakai di halaman catat, riwayat, dan daftar belum diukur
export function KartuTemuan({ t, kembali }: { t: BarisTemuan; kembali: string }) {
  const tautanUbah = `/catat/temuan/${t.id}?kembali=${encodeURIComponent(kembali)}`;

  return (
    <li className="rounded-xl border border-[#DCE2EA] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[#4A5568]">{kodeTemuan(t.id, t.dibuat_pada)}</p>
          <p className="text-base font-semibold">{namaJenis(t)}</p>
          <p className="text-sm text-[#4A5568]">
            {lokasiTemuan(t)} | {t.lajur} | {t.arah}
          </p>
          <p className="text-sm text-[#4A5568]">
            {t.jumlah !== null ? `Jumlah ${t.jumlah}` : "Jumlah belum diisi"}
            {t.luas_m2 !== null ? `, luas ${t.luas_m2} meter persegi` : ""}
          </p>
          <p className="text-sm text-[#4A5568]">Ditemukan {formatWaktu(t.ditemukan_pada)}</p>
          {diinputBelakangan(t) ? (
            <p className="text-xs text-[#4A5568]">Diinput {formatWaktu(t.dibuat_pada)}</p>
          ) : null}
          {t.catatan ? <p className="mt-1 text-sm">{t.catatan}</p> : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {belumDiukur(t) ? (
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#78350F]">
                Belum diukur
              </span>
            ) : null}
            {diLuarRentang(t) ? (
              <span className="rounded-full bg-[#FFEDD5] px-2 py-0.5 text-xs font-semibold text-[#7C2D12]">
                Di luar rentang sesi
              </span>
            ) : null}
            {diLuarPeriode(t) ? (
              <span className="rounded-full bg-[#FFEDD5] px-2 py-0.5 text-xs font-semibold text-[#7C2D12]">
                Di luar periode sesi
              </span>
            ) : null}
            {t.jenis_lain ? (
              <span className="rounded-full bg-[#F3E8FF] px-2 py-0.5 text-xs font-semibold text-[#581C87]">
                Jenis diketik manual, {t.kategori_lain}
              </span>
            ) : null}
            {t.ditambahkan_setelah_tutup ? (
              <span className="rounded-full bg-[#E0E7FF] px-2 py-0.5 text-xs font-semibold text-[#312E81]">
                Ditambahkan setelah sesi ditutup
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]">
            {t.tingkat}
          </span>
          <Link href={tautanUbah} className="text-sm font-semibold text-[#14213D] underline">
            Ubah
          </Link>
        </div>
      </div>
    </li>
  );
}
