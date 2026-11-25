import { formatSta } from "@/lib/sta";

export type JenisRingkas = { nama: string; kategori: string };

export type BarisTemuan = {
  id: number;
  inspeksi_id: number;
  jenis_temuan_id: number;
  tingkat: string;
  tipe_lokasi: string;
  sta_awal_m: number;
  sta_akhir_m: number | null;
  arah: string;
  lajur: string;
  panjang_m: number | null;
  lebar_m: number | null;
  luas_m2: number | null;
  jumlah: number | null;
  catatan: string | null;
  status: string;
  dibuat_pada: string;
  ditambahkan_setelah_tutup: boolean;
  jenis_temuan: JenisRingkas | JenisRingkas[] | null;
};

// Daftar kolom yang dipakai di semua halaman yang menampilkan temuan,
// ditulis sekali di sini supaya tidak berbeda antar halaman.
export const KOLOM_TEMUAN =
  "id, inspeksi_id, jenis_temuan_id, tingkat, tipe_lokasi, sta_awal_m, sta_akhir_m, arah, lajur, " +
  "panjang_m, lebar_m, luas_m2, jumlah, catatan, status, dibuat_pada, ditambahkan_setelah_tutup, " +
  "jenis_temuan(nama, kategori)";

export function namaJenis(j: BarisTemuan["jenis_temuan"]) {
  if (!j) return "Jenis tidak dikenali";
  return Array.isArray(j) ? (j[0]?.nama ?? "Jenis tidak dikenali") : j.nama;
}

// Kode tampilan, contoh TMN-2026-0007. Tahun mengikuti Waktu Indonesia Barat.
export function kodeTemuan(id: number, dibuatPada: string) {
  const tahun = new Date(dibuatPada).toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  });
  return `TMN-${tahun}-${String(id).padStart(4, "0")}`;
}

export function lokasiTemuan(t: Pick<BarisTemuan, "tipe_lokasi" | "sta_awal_m" | "sta_akhir_m">) {
  if (t.tipe_lokasi === "Rentang" && t.sta_akhir_m !== null) {
    return `${formatSta(t.sta_awal_m)} sampai ${formatSta(t.sta_akhir_m)}`;
  }
  return formatSta(t.sta_awal_m);
}

// Temuan dianggap belum diukur kalau panjang atau lebarnya masih kosong
export function belumDiukur(t: Pick<BarisTemuan, "panjang_m" | "lebar_m">) {
  return t.panjang_m === null || t.lebar_m === null;
}
