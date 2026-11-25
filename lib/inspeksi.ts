// Aturan dan pembantu untuk sesi inspeksi

export type BarisSesi = {
  id: number;
  tanggal: string;
  sta_awal_m: number;
  sta_akhir_m: number;
  arah: string;
  status: string;
  jenis_sesi: string;
  rencana_selesai: string | null;
};

export const KOLOM_SESI =
  "id, tanggal, sta_awal_m, sta_akhir_m, arah, status, jenis_sesi, rencana_selesai";

// Tanggal hari ini menurut Waktu Indonesia Barat, format 2026-11-25
export function hariIniWib() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

// Sesi dianggap lewat waktu kalau masih berjalan padahal:
// Harian  → tanggalnya sudah lewat
// Berkala → tanggal rencana selesainya sudah lewat
// Tanggal berformat tahun-bulan-hari, jadi bisa dibandingkan sebagai teks biasa.
export function lewatWaktu(s: Pick<BarisSesi, "status" | "jenis_sesi" | "tanggal" | "rencana_selesai">) {
  if (s.status !== "Berjalan") return false;
  const batas = s.jenis_sesi === "Berkala" ? s.rencana_selesai : s.tanggal;
  return batas !== null && batas < hariIniWib();
}

export function keteranganWaktuSesi(s: Pick<BarisSesi, "jenis_sesi" | "tanggal" | "rencana_selesai">) {
  if (s.jenis_sesi === "Berkala" && s.rencana_selesai) {
    return `Berkala, ${s.tanggal} sampai rencana ${s.rencana_selesai}`;
  }
  return `Harian, ${s.tanggal}`;
}
