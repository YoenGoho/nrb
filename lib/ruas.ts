// Perhitungan STA dari koordinat, berdasarkan garis as ruas dan titik kalibrasi.
//
// Gagasan dasarnya dua langkah:
// 1. Proyeksi : titik GPS ditarik tegak lurus ke garis as terdekat, lalu diukur
//               jaraknya dari ujung Tomang menyusuri garis. Hasilnya "ukur OpenStreetMap".
// 2. Koreksi  : ukur OpenStreetMap ditambah koreksi supaya sama dengan angka di patok KM.
//               Koreksi dihitung dari titik kalibrasi, berubah per bagian di antara titik.
//
// Kode ini murni hitungan, tidak memanggil database, jadi bisa dipakai di server
// maupun di browser, termasuk nanti saat HP tanpa sinyal.

import dataRuas from "./data/ruas-tomang-bitung.json";

export type Arah = "Arah Tangerang" | "Arah Jakarta";
export const DAFTAR_ARAH: Arah[] = ["Arah Tangerang", "Arah Jakarta"];

// ---------------------------------------------------------
// Ambang yang dipakai. Semua di satu tempat supaya mudah disesuaikan.
// ---------------------------------------------------------

// Saran arah hanya ditampilkan kalau akurasi GPS sebaik ini atau lebih baik.
// Dasar: simulasi 25 Nov 2026, GPS meleset 5 m menghasilkan 5% saran arah salah,
// meleset 10 m menghasilkan 21% salah, karena dua garis as hanya terpisah sekitar 17 m.
export const AKURASI_SARAN_ARAH_M = 8;

// Lebih jauh dari ini dari garis as terdekat, titik dianggap di luar koridor ruas.
export const BATAS_KORIDOR_M = 60;

// STA dianggap terkalibrasi kalau ada titik kalibrasi aktif dalam jarak ini.
export const JANGKAUAN_KALIBRASI_M = 2000;

// Titik kalibrasi yang koreksinya menyimpang lebih dari ini dari titik sekitarnya ditandai.
export const BATAS_MENYIMPANG_M = 50;

// Titik kalibrasi yang lebih jauh dari ini dari garis arahnya diberi peringatan.
export const BATAS_JAUH_DARI_GARIS_M = 30;

// ---------------------------------------------------------
// Bidang datar setempat
// ---------------------------------------------------------

type XY = [number, number];

const R = 6371008.8;
const LINTANG_ACUAN = (-6.2 * Math.PI) / 180;

function keXY(lat: number, lon: number): XY {
  return [((lon * Math.PI) / 180) * R * Math.cos(LINTANG_ACUAN), ((lat * Math.PI) / 180) * R];
}

type Garis = { xy: XY[]; kumulatif: number[] };

function siapkanGaris(titik: number[][]): Garis {
  const xy = titik.map(([lat, lon]) => keXY(lat, lon));
  const kumulatif = [0];
  for (let i = 1; i < xy.length; i++) {
    kumulatif.push(kumulatif[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  }
  return { xy, kumulatif };
}

const GARIS: Record<Arah, Garis> = {
  "Arah Tangerang": siapkanGaris(dataRuas.arah["Arah Tangerang"].titik),
  "Arah Jakarta": siapkanGaris(dataRuas.arah["Arah Jakarta"].titik),
};

export const ATRIBUSI_PETA = "© OpenStreetMap contributors";
export const TANGGAL_DATA_RUAS = dataRuas.tanggalData;

// ---------------------------------------------------------
// Langkah 1: proyeksi
// ---------------------------------------------------------

export type HasilProyeksi = {
  jarakM: number; // jarak tegak lurus titik ke garis as
  ukurM: number; // jarak menyusuri garis dari ujung Tomang
};

export function proyeksikan(arah: Arah, lat: number, lon: number): HasilProyeksi {
  const [qx, qy] = keXY(lat, lon);
  const { xy, kumulatif } = GARIS[arah];
  let terbaik: HasilProyeksi = { jarakM: Infinity, ukurM: 0 };

  for (let i = 0; i < xy.length - 1; i++) {
    const [ax, ay] = xy[i];
    const [bx, by] = xy[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const L2 = dx * dx + dy * dy;
    // t = posisi kaki tegak lurus di potongan garis ini, 0 di ujung awal, 1 di ujung akhir
    const t = L2 === 0 ? 0 : Math.max(0, Math.min(1, ((qx - ax) * dx + (qy - ay) * dy) / L2));
    const jarak = Math.hypot(qx - (ax + t * dx), qy - (ay + t * dy));
    if (jarak < terbaik.jarakM) {
      terbaik = { jarakM: jarak, ukurM: kumulatif[i] + t * Math.sqrt(L2) };
    }
  }
  return terbaik;
}

// ---------------------------------------------------------
// Langkah 2: koreksi dari titik kalibrasi
// ---------------------------------------------------------

export type TitikKalibrasi = {
  id: number;
  arah: string;
  sta_patok_m: number;
  lat: number;
  lon: number;
  sumber: string;
  perkiraan_galat_m: number | null;
  aktif: boolean;
  catatan: string | null;
  dibuat_pada: string;
};

// Satu acuan koreksi: di ukur OpenStreetMap sekian, koreksinya sekian
export type Acuan = { ukurM: number; koreksiM: number };

export function koreksiPada(ukurM: number, acuan: Acuan[]) {
  if (acuan.length === 0) return { koreksiM: 0, terkalibrasi: false };

  const urut = [...acuan].sort((a, b) => a.ukurM - b.ukurM);
  const terdekat = Math.min(...urut.map((a) => Math.abs(a.ukurM - ukurM)));
  const terkalibrasi = terdekat <= JANGKAUAN_KALIBRASI_M;

  // Di luar rentang titik: pakai koreksi titik paling ujung (tidak ditarik miring)
  if (ukurM <= urut[0].ukurM) return { koreksiM: urut[0].koreksiM, terkalibrasi };
  const akhir = urut[urut.length - 1];
  if (ukurM >= akhir.ukurM) return { koreksiM: akhir.koreksiM, terkalibrasi };

  // Di antara dua titik: garis lurus di antara koreksi keduanya
  for (let i = 0; i < urut.length - 1; i++) {
    const a = urut[i];
    const b = urut[i + 1];
    if (ukurM >= a.ukurM && ukurM <= b.ukurM) {
      const t = b.ukurM === a.ukurM ? 0 : (ukurM - a.ukurM) / (b.ukurM - a.ukurM);
      return { koreksiM: a.koreksiM + t * (b.koreksiM - a.koreksiM), terkalibrasi };
    }
  }
  return { koreksiM: akhir.koreksiM, terkalibrasi };
}

export type TitikTeranalisis = TitikKalibrasi & {
  ukurM: number;
  jarakKeGarisM: number;
  koreksiM: number;
  sisaM: number | null; // selisih koreksi titik ini terhadap koreksi yang ditebak dari titik lain
  menyimpang: boolean;
  jauhDariGaris: boolean;
};

function sebagaiArah(teks: string): Arah {
  return teks === "Arah Jakarta" ? "Arah Jakarta" : "Arah Tangerang";
}

export function analisisKalibrasi(daftar: TitikKalibrasi[]) {
  // Setiap titik diproyeksikan ke garis arahnya sendiri, bukan garis terdekat,
  // karena arah patok sudah pasti diketahui saat dicatat.
  const terukur = daftar.map((t) => {
    const p = proyeksikan(sebagaiArah(t.arah), t.lat, t.lon);
    return { ...t, ukurM: p.ukurM, jarakKeGarisM: p.jarakM, koreksiM: t.sta_patok_m - p.ukurM };
  });

  const aktif = terukur.filter((t) => t.aktif);
  const acuan: Acuan[] = aktif.map((t) => ({ ukurM: t.ukurM, koreksiM: t.koreksiM }));

  // Uji silang: koreksi tiap titik dibandingkan dengan tebakan dari titik-titik lain.
  // Titik yang jauh berbeda dari tetangganya kemungkinan salah baca atau salah jalur.
  const titik: TitikTeranalisis[] = terukur.map((t) => {
    const lain = acuan.filter((_, i) => !(t.aktif && aktif[i].id === t.id));
    const sisaM = lain.length === 0 ? null : t.koreksiM - koreksiPada(t.ukurM, lain).koreksiM;
    return {
      ...t,
      sisaM,
      menyimpang: sisaM !== null && Math.abs(sisaM) > BATAS_MENYIMPANG_M,
      jauhDariGaris: t.jarakKeGarisM > BATAS_JAUH_DARI_GARIS_M,
    };
  });

  const rataKoreksi =
    acuan.length === 0 ? null : acuan.reduce((s, a) => s + a.koreksiM, 0) / acuan.length;

  return { titik, acuan, rataKoreksi };
}

// ---------------------------------------------------------
// Gabungan: dari koordinat sampai STA
// ---------------------------------------------------------

export type HasilPosisi = {
  // null kalau titik di luar koridor ruas. Sengaja dibuat bisa kosong supaya kode yang
  // memakainya DIPAKSA memeriksa dulu, dan STA dari jalan lain tidak pernah ikut tersimpan.
  staM: number | null;
  ukurM: number;
  koreksiM: number;
  terkalibrasi: boolean;
  arahTerdekat: Arah;
  jarakKeAsM: number;
  diLuarKoridor: boolean;
  arahSaran: Arah | null; // null kalau GPS kurang akurat untuk menebak arah
};

export function hitungPosisi(lat: number, lon: number, akurasiM: number | null, acuan: Acuan[]): HasilPosisi {
  const kandidat = DAFTAR_ARAH.map((arah) => ({ arah, ...proyeksikan(arah, lat, lon) }));
  const terdekat = kandidat.reduce((a, b) => (b.jarakM < a.jarakM ? b : a));

  const { koreksiM, terkalibrasi } = koreksiPada(terdekat.ukurM, acuan);
  const diLuarKoridor = terdekat.jarakM > BATAS_KORIDOR_M;
  const gpsCukupAkurat = akurasiM !== null && akurasiM <= AKURASI_SARAN_ARAH_M;

  return {
    staM: diLuarKoridor ? null : Math.max(0, Math.round(terdekat.ukurM + koreksiM)),
    ukurM: terdekat.ukurM,
    koreksiM,
    terkalibrasi: diLuarKoridor ? false : terkalibrasi,
    arahTerdekat: terdekat.arah,
    jarakKeAsM: terdekat.jarakM,
    diLuarKoridor,
    arahSaran: gpsCukupAkurat && !diLuarKoridor ? terdekat.arah : null,
  };
}

// ---------------------------------------------------------
// Kebalikan: dari STA ke koordinat (posisi perkiraan)
// ---------------------------------------------------------
// Dipakai untuk menggambar temuan yang tidak punya GPS di peta.
// Hasilnya titik di garis as, bukan posisi asli, jadi selalu ditandai "perkiraan".

function keLatLon([x, y]: XY): [number, number] {
  return [((y / R) * 180) / Math.PI, ((x / (R * Math.cos(LINTANG_ACUAN))) * 180) / Math.PI];
}

// Titik di garis as pada ukur OpenStreetMap tertentu, dalam lintang dan bujur
export function titikPadaUkur(arah: Arah, ukurM: number): [number, number] {
  const { xy, kumulatif } = GARIS[arah];
  const u = Math.max(0, Math.min(ukurM, kumulatif[kumulatif.length - 1]));
  let i = 0;
  while (i < kumulatif.length - 2 && kumulatif[i + 1] < u) i++;
  const panjang = kumulatif[i + 1] - kumulatif[i];
  const t = panjang === 0 ? 0 : (u - kumulatif[i]) / panjang;
  const [ax, ay] = xy[i];
  const [bx, by] = xy[i + 1];
  return keLatLon([ax + t * (bx - ax), ay + t * (by - ay)]);
}

// Dari STA patok ke koordinat perkiraan.
// STA = ukur + koreksi(ukur), jadi ukur dicari ulang beberapa kali sampai stabil.
// Koreksi berubah pelan sepanjang ruas, sehingga lima putaran sudah lebih dari cukup.
export function koordinatDariSta(arah: Arah, staM: number, acuan: Acuan[]): [number, number] {
  let ukurM = staM;
  for (let putaran = 0; putaran < 5; putaran++) {
    ukurM = staM - koreksiPada(ukurM, acuan).koreksiM;
  }
  return titikPadaUkur(arah, ukurM);
}

// Potongan garis as untuk satu rentang STA, untuk digambar di peta
export function garisAntaraSta(arah: Arah, awalM: number, akhirM: number, acuan: Acuan[]): [number, number][] {
  const langkah = 50;
  const titik: [number, number][] = [];
  for (let s = awalM; s <= akhirM; s += langkah) titik.push(koordinatDariSta(arah, s, acuan));
  titik.push(koordinatDariSta(arah, akhirM, acuan));
  return titik;
}
