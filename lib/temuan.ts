import { formatSta } from "@/lib/sta";
import { batasAkhirSesi } from "@/lib/inspeksi";

export type JenisRingkas = { nama: string; kategori: string };

export type BarisTemuan = {
  id: number;
  inspeksi_id: number;
  jenis_temuan_id: number | null;
  jenis_lain: string | null;
  kategori_lain: string | null;
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
  inspeksi: RentangSesi | RentangSesi[] | null;
};

export type RentangSesi = { sta_awal_m: number; sta_akhir_m: number };

// Daftar kolom yang dipakai di semua halaman yang menampilkan temuan,
// ditulis sekali di sini supaya tidak berbeda antar halaman.
export const KOLOM_TEMUAN =
  "id, inspeksi_id, jenis_temuan_id, jenis_lain, kategori_lain, tingkat, tipe_lokasi, sta_awal_m, sta_akhir_m, arah, lajur, " +
  "panjang_m, lebar_m, luas_m2, jumlah, catatan, status, dibuat_pada, ditambahkan_setelah_tutup, " +
  "jenis_temuan(nama, kategori), inspeksi(sta_awal_m, sta_akhir_m)";

// Kategori tambahan untuk jenis yang diketik manual dan tidak cocok di kategori mana pun
export const KATEGORI_LAIN = "Lain-lain";

// Nama jenis yang ditampilkan: dari katalog, atau hasil ketikan manual
export function namaJenis(t: Pick<BarisTemuan, "jenis_temuan" | "jenis_lain">) {
  if (t.jenis_lain) return t.jenis_lain;
  const j = t.jenis_temuan;
  if (!j) return "Jenis tidak dikenali";
  return Array.isArray(j) ? (j[0]?.nama ?? "Jenis tidak dikenali") : j.nama;
}

// Penyeragam nama untuk pemeriksaan kembar:
// huruf kecil semua, spasi di awal dan akhir dibuang, spasi ganda jadi satu.
// "  LUBANG   besar " dan "lubang besar" dianggap sama.
export function seragamkanNama(nama: string) {
  return nama.trim().replace(/\s+/g, " ").toLowerCase();
}

// Merapikan tampilan ketikan manual tanpa mengubah maknanya
export function rapikanNama(nama: string) {
  const bersih = nama.trim().replace(/\s+/g, " ");
  return bersih.charAt(0).toUpperCase() + bersih.slice(1);
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

// Temuan di luar rentang KM sesinya.
// Sesi KM 18 sampai 20 mencakup 18+000 sampai 20+999, sesuai kebiasaan lapangan.
// Temuan rentang dianggap di luar kalau salah satu ujungnya keluar dari rentang sesi.
export function diLuarRentang(t: Pick<BarisTemuan, "inspeksi" | "sta_awal_m" | "sta_akhir_m">) {
  const sesi = Array.isArray(t.inspeksi) ? t.inspeksi[0] : t.inspeksi;
  if (!sesi) return false;
  const ujungAkhir = t.sta_akhir_m ?? t.sta_awal_m;
  return t.sta_awal_m < sesi.sta_awal_m || ujungAkhir > batasAkhirSesi(sesi.sta_akhir_m);
}
