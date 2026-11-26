// Skrip pengolah data garis ruas Tomang sampai Bitung.
//
// Masukan : data/osm/jakarta-merak-tomang-bitung.json (data mentah OpenStreetMap)
// Keluaran: lib/data/ruas-tomang-bitung.json (garis as dua arah, siap dipakai aplikasi)
//
// Cara menjalankan dari folder nrb:
//   node scripts/olah-ruas.mjs
//
// Skrip ini cukup dijalankan ulang kalau data OpenStreetMap diunduh ulang.

import { readFileSync, writeFileSync } from "node:fs";

const MASUKAN = "data/osm/jakarta-merak-tomang-bitung.json";
const KELUARAN = "lib/data/ruas-tomang-bitung.json";

// Garis dipotong pada jarak ini dari ujung Tomang, diukur menurut OpenStreetMap.
// Dengan koreksi sekitar +470 m, 27.000 m OpenStreetMap kira-kira sama dengan KM 27+470,
// jadi seluruh KM 0 sampai 26+999 tercakup.
const POTONG_DI_M = 27000;

// Jari-jari bumi rata-rata (meter) dan lintang acuan ruas ini.
// Di sepanjang 30 km pada lintang 6 derajat selatan, bidang datar setempat sudah sangat teliti.
const R = 6371008.8;
const LINTANG_ACUAN = (-6.2 * Math.PI) / 180;

function keXY(lat, lon) {
  return [
    ((lon * Math.PI) / 180) * R * Math.cos(LINTANG_ACUAN),
    ((lat * Math.PI) / 180) * R,
  ];
}

function jarakM(a, b) {
  const [ax, ay] = keXY(a.lat, a.lon);
  const [bx, by] = keXY(b.lat, b.lon);
  return Math.hypot(bx - ax, by - ay);
}

const kunci = (p) => `${p.lat.toFixed(7)},${p.lon.toFixed(7)}`;

const mentah = JSON.parse(readFileSync(MASUKAN, "utf-8"));
const ruasJalan = mentah.elements.filter((e) => e.type === "way");

// 1. Peta titik awal dan titik akhir tiap potongan jalan
const mulaiDi = new Map();
const berakhirDi = new Set();
for (const w of ruasJalan) {
  const awal = kunci(w.geometry[0]);
  if (!mulaiDi.has(awal)) mulaiDi.set(awal, []);
  mulaiDi.get(awal).push(w);
  berakhirDi.add(kunci(w.geometry[w.geometry.length - 1]));
}

// 2. Kepala rantai = potongan yang titik awalnya bukan titik akhir potongan lain.
//    Jalan tol searah (oneway), jadi tiap arah menghasilkan satu rantai.
const kepala = ruasJalan.filter((w) => !berakhirDi.has(kunci(w.geometry[0])));
if (kepala.length !== 2) {
  throw new Error(`Diharapkan 2 rantai (satu per arah), ditemukan ${kepala.length}. Periksa data mentah.`);
}

function susunRantai(awal) {
  const titik = [];
  const dilewati = new Set();
  let kini = awal;
  while (kini && !dilewati.has(kini.id)) {
    dilewati.add(kini.id);
    for (const p of kini.geometry) {
      if (titik.length === 0 || kunci(titik[titik.length - 1]) !== kunci(p)) titik.push(p);
    }
    const lanjut = mulaiDi.get(kunci(kini.geometry[kini.geometry.length - 1])) ?? [];
    if (lanjut.length > 1) throw new Error(`Rantai bercabang setelah potongan ${kini.id}.`);
    kini = lanjut[0];
  }
  return titik;
}

// 3. Susun dua rantai, lalu tentukan arahnya.
//    Rantai yang bergerak ke barat (bujur mengecil) adalah Arah Tangerang.
//    Rantai arah Jakarta dibalik supaya kedua garis sama-sama diurutkan mulai dari Tomang.
const garis = {};
for (const k of kepala) {
  const titik = susunRantai(k);
  const keBarat = titik[0].lon > titik[titik.length - 1].lon;
  if (keBarat) garis["Arah Tangerang"] = titik;
  else garis["Arah Jakarta"] = [...titik].reverse();
}

// 4. Potong tiap garis pada POTONG_DI_M dari Tomang
function potong(titik, batas) {
  const hasil = [titik[0]];
  let ukur = 0;
  for (let i = 1; i < titik.length; i++) {
    const L = jarakM(titik[i - 1], titik[i]);
    if (ukur + L >= batas) {
      const t = (batas - ukur) / L;
      hasil.push({
        lat: titik[i - 1].lat + t * (titik[i].lat - titik[i - 1].lat),
        lon: titik[i - 1].lon + t * (titik[i].lon - titik[i - 1].lon),
      });
      return { titik: hasil, panjang: batas };
    }
    hasil.push(titik[i]);
    ukur += L;
  }
  return { titik: hasil, panjang: ukur };
}

const keluaran = {
  keterangan:
    "Garis as Jalan Tol Jakarta–Merak ruas Tomang sampai lewat Bitung, dua arah, " +
    "keduanya diurutkan mulai dari Tomang. Koordinat [lintang, bujur].",
  sumber: "OpenStreetMap, diolah oleh scripts/olah-ruas.mjs",
  lisensi: "Open Database License (ODbL). Atribusi: © OpenStreetMap contributors",
  tanggalData: mentah.osm3s?.timestamp_osm_base ?? null,
  dipotongPadaM: POTONG_DI_M,
  arah: {},
};

for (const [arah, titik] of Object.entries(garis)) {
  const { titik: terpotong, panjang } = potong(titik, POTONG_DI_M);
  keluaran.arah[arah] = {
    panjangM: Math.round(panjang),
    jumlahTitik: terpotong.length,
    // 6 angka di belakang koma kira-kira setara 0,11 meter, lebih dari cukup
    titik: terpotong.map((p) => [Number(p.lat.toFixed(6)), Number(p.lon.toFixed(6))]),
  };
}

// Ditulis satu titik per baris, supaya perubahan data mudah dibaca di riwayat Git
const teks = JSON.stringify(keluaran, null, 2).replace(
  /\[\s+(-?\d+\.\d+),\s+(-?\d+\.\d+)\s+\]/g,
  "[$1, $2]",
);
writeFileSync(KELUARAN, teks + "\n", "utf-8");

for (const [arah, isi] of Object.entries(keluaran.arah)) {
  console.log(`${arah}: ${isi.jumlahTitik} titik, panjang ${(isi.panjangM / 1000).toFixed(2)} km`);
}
console.log(`Tersimpan di ${KELUARAN}`);
