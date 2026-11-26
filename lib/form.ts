import { redirect } from "next/navigation";

// Pembantu membaca isian form di Server Action, dipakai bersama oleh semua halaman

// Isian berupa angka. Kosong atau bukan angka menjadi null.
export function angka(fd: FormData, nama: string) {
  const isi = fd.get(nama);
  if (isi === null || isi === "") return null;
  const n = Number(isi);
  return Number.isFinite(n) ? n : null;
}

// Isian berupa teks. Spasi di awal dan akhir dibuang, kosong menjadi null.
export function teks(fd: FormData, nama: string) {
  const isi = fd.get(nama);
  if (typeof isi !== "string") return null;
  const bersih = isi.trim();
  return bersih === "" ? null : bersih;
}

// Kembali ke halaman asal sambil membawa pesan galat lewat alamat
export function kembaliDenganGalat(tujuan: string, pesan: string): never {
  const pemisah = tujuan.includes("?") ? "&" : "?";
  redirect(`${tujuan}${pemisah}galat=${encodeURIComponent(pesan)}`);
}
