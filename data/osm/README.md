# Data OpenStreetMap ruas Tomang sampai Bitung

Sumber: OpenStreetMap, diambil lewat Overpass Turbo (https://overpass-turbo.eu)
dengan kueri di berkas `kueri-overpass.txt`.

Lisensi data: Open Database License (ODbL).
Wajib mencantumkan atribusi "© OpenStreetMap contributors" di setiap tampilan yang memakai data ini.

Catatan penamaan: di OpenStreetMap, ruas ini tercatat sebagai bagian dari
"Jalan Tol Jakarta–Merak" (ref 1, operator PT Jasa Marga), bukan "Jalan Tol Jakarta–Tangerang".

| Berkas | Isi |
|---|---|
| kueri-overpass.txt | Kueri yang dipakai, supaya pengambilan data bisa diulang |
| jakarta-merak-tomang-bitung.json | Data mentah hasil kueri (diunduh manual 25 Nov 2026) |

Data mentah diolah oleh `scripts/olah-ruas.mjs` menjadi `lib/data/ruas-tomang-bitung.json`,
yaitu garis as dua arah yang dipakai aplikasi. Kalau data mentah diunduh ulang,
jalankan `node scripts/olah-ruas.mjs` dari folder nrb.

Temuan saat diolah:
- Ruas tercatat sebagai dua rantai utuh tanpa cabang, satu per arah.
- Ukuran OpenStreetMap dari ujung Tomang lebih pendek sekitar 470 m dari patok KM resmi
  (diukur dari survei Street View 25 Nov 2026 pada patok 10+000, 13+800, 19+600, 20+200).
- Potongan KM 0 sampai sekitar 0+480 (bagian Simpang Susun Tomang) tidak termasuk dalam data.
- Simpang "Karang Tengah Barat" arah Tangerang diduga salah label, tidak dipakai sebagai acuan.

Isi data saat pertama diperiksa: 99 ruas jalan (way) dengan 403 titik garis,
37 titik simpang (motorway_junction), 62 gardu tol (toll_booth), tanpa patok KM (milestone).
