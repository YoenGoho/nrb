// Pembantu membaca isian alamat (query string) dengan aman.

// Next.js memberi nilai query sebagai teks, daftar teks, atau kosong.
// Fungsi ini selalu mengembalikan satu teks atau undefined.
export function satu(nilai: string | string[] | undefined) {
  return Array.isArray(nilai) ? nilai[0] : nilai;
}

// Alamat tujuan kembali hanya boleh mengarah ke halaman NRB sendiri.
// Ini mencegah tautan palsu yang mengalihkan pengguna ke situs lain.
export function tujuanAman(nilai: string | null | undefined, cadangan: string) {
  if (!nilai) return cadangan;
  if (!nilai.startsWith("/") || nilai.startsWith("//")) return cadangan;
  if (!(nilai.startsWith("/catat") || nilai.startsWith("/riwayat"))) return cadangan;
  return nilai;
}

// Tanggal dan jam dalam Waktu Indonesia Barat
export function formatWaktu(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
