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
  const halamanSah = ["/catat", "/riwayat", "/koridor"];
  if (!halamanSah.some((awalan) => nilai.startsWith(awalan))) return cadangan;
  return nilai;
}

// Format waktu sekarang diatur di lib/waktu.ts. Baris ini supaya halaman lama tetap jalan.
export { formatWaktu } from "@/lib/waktu";
