// Semua urusan tampilan waktu, selalu dalam Waktu Indonesia Barat (WIB).
// Database menyimpan waktu dalam UTC sampai pecahan detik. Berkas ini hanya mengubah cara tampilnya.
// Tidak memanggil server, jadi bisa dipakai di server maupun di browser HP.

const ZONA = "Asia/Jakarta";
const SELISIH_WIB_MS = 7 * 60 * 60 * 1000;

// Waktu ditemukan boleh maju sedikit dari jam server, karena jam HP bisa selisih
export const TOLERANSI_MASA_DEPAN_MS = 5 * 60 * 1000;

// Nama peristiwa yang dikirim tombol GPS supaya isian waktu ditemukan ikut berganti
export const PERISTIWA_WAKTU_GPS = "nrb:waktu-gps";

// "2026-11-26T08:28:07Z" menjadi "Kam, 26 Nov 2026, 15.28 WIB"
export function formatWaktu(iso: string) {
  const teks = new Date(iso).toLocaleString("id-ID", {
    timeZone: ZONA,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${teks} WIB`;
}

// Tanggal menurut WIB, format 2026-11-26. Bisa dibandingkan sebagai teks biasa.
export function tanggalWib(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: ZONA });
}

// Untuk isian tanggal dan jam di HP: "2026-11-26T08:28:07Z" menjadi "2026-11-26T15:28"
export function isoKeIsianWib(iso: string) {
  return new Date(new Date(iso).getTime() + SELISIH_WIB_MS).toISOString().slice(0, 16);
}

// Kebalikannya: "2026-11-26T15:28" (jam WIB) menjadi "2026-11-26T08:28:00.000Z"
export function isianWibKeIso(isian: string) {
  return new Date(`${isian}:00+07:00`).toISOString();
}
