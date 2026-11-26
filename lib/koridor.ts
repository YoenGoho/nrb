// Pengelompokan temuan per KM untuk skema koridor Tomang sampai Bitung.
// Murni hitungan, tidak memanggil database.

import type { Arah } from "@/lib/ruas";
import type { BarisTemuan } from "@/lib/temuan";
import { hariIniWib } from "@/lib/inspeksi";
import { tanggalWib } from "@/lib/waktu";

export const KM_TERAKHIR = 26;
export const DAFTAR_KM = Array.from({ length: KM_TERAKHIR + 1 }, (_, i) => i);

// Urutan tingkat untuk mencari yang terberat
const BOBOT_TINGKAT: Record<string, number> = { Ringan: 1, Sedang: 2, Berat: 3 };

export type SelKm = { jumlah: number; terberat: string | null };

// Penyaring waktu berdasarkan waktu ditemukan
export const PILIHAN_PERIODE = {
  semua: "Semua",
  "hari-ini": "Hari ini",
  "7-hari": "7 hari terakhir",
  "bulan-ini": "Bulan ini",
} as const;
export type Periode = keyof typeof PILIHAN_PERIODE;

export function bacaPeriode(nilai: string | undefined): Periode {
  return nilai !== undefined && nilai in PILIHAN_PERIODE ? (nilai as Periode) : "semua";
}

export function dalamPeriode(t: Pick<BarisTemuan, "ditemukan_pada">, periode: Periode) {
  if (periode === "semua") return true;
  const hariIni = hariIniWib();
  if (periode === "hari-ini") return tanggalWib(t.ditemukan_pada) === hariIni;
  if (periode === "bulan-ini") return tanggalWib(t.ditemukan_pada).slice(0, 7) === hariIni.slice(0, 7);
  return Date.now() - new Date(t.ditemukan_pada).getTime() <= 7 * 24 * 60 * 60 * 1000;
}

// Temuan dianggap belum ditangani selama statusnya belum Selesai
export function belumDitangani(t: Pick<BarisTemuan, "status">) {
  return t.status !== "Selesai";
}

// KM mana saja yang disentuh satu temuan. Temuan rentang bisa menyentuh beberapa KM.
export function kmTemuan(t: Pick<BarisTemuan, "sta_awal_m" | "sta_akhir_m">) {
  const awal = Math.min(Math.floor(t.sta_awal_m / 1000), KM_TERAKHIR);
  const akhir = Math.min(Math.floor((t.sta_akhir_m ?? t.sta_awal_m) / 1000), KM_TERAKHIR);
  return DAFTAR_KM.filter((km) => km >= awal && km <= akhir);
}

// Isi skema: untuk setiap arah dan setiap KM, jumlah temuan dan tingkat terberatnya
export function isiSkema(temuan: BarisTemuan[]) {
  const kosong = () => DAFTAR_KM.map((): SelKm => ({ jumlah: 0, terberat: null }));
  const skema: Record<Arah, SelKm[]> = { "Arah Jakarta": kosong(), "Arah Tangerang": kosong() };

  for (const t of temuan) {
    const baris = skema[t.arah as Arah];
    if (!baris) continue;
    for (const km of kmTemuan(t)) {
      const sel = baris[km];
      sel.jumlah += 1;
      if (sel.terberat === null || (BOBOT_TINGKAT[t.tingkat] ?? 0) > (BOBOT_TINGKAT[sel.terberat] ?? 0)) {
        sel.terberat = t.tingkat;
      }
    }
  }
  return skema;
}

// Warna sel menurut tingkat terberat
export function warnaTingkat(tingkat: string | null) {
  if (tingkat === "Berat") return "bg-[#DC2626] text-white";
  if (tingkat === "Sedang") return "bg-[#FB923C] text-[#431407]";
  if (tingkat === "Ringan") return "bg-[#FDE047] text-[#422006]";
  return "bg-[#EEF1F5] text-[#9AA5B5]";
}
