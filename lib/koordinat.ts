// Membaca koordinat dari teks yang ditempel pengguna.
// Bisa menerima tiga bentuk:
// 1. Kode sematan Street View  : ...!1d-6.198585!2d106.710702!3f285.7...
// 2. Alamat Street View di bilah alamat: .../maps/@-6.198585,106.710702,3a,75y,285.7h,...
// 3. Angka biasa               : -6.198585, 106.710702

export type KoordinatTerbaca = {
  lat: number;
  lon: number;
  arahKamera: number | null; // derajat dari utara, hanya ada kalau dari Street View
  bentuk: "Sematan Street View" | "Alamat Street View" | "Angka";
};

const ANGKA = String.raw`-?\d+(?:\.\d+)?`;

function sah(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function bacaKoordinat(teks: string): KoordinatTerbaca | null {
  const isi = teks.trim();
  if (isi === "") return null;

  const sematan = isi.match(new RegExp(`!1d(${ANGKA})!2d(${ANGKA})`));
  if (sematan) {
    const lat = Number(sematan[1]);
    const lon = Number(sematan[2]);
    const arah = isi.match(new RegExp(`!3f(${ANGKA})`));
    if (sah(lat, lon)) {
      return { lat, lon, arahKamera: arah ? Number(arah[1]) : null, bentuk: "Sematan Street View" };
    }
  }

  const alamat = isi.match(new RegExp(`@(${ANGKA}),(${ANGKA}),([^/]*)`));
  if (alamat) {
    const lat = Number(alamat[1]);
    const lon = Number(alamat[2]);
    const arah = alamat[3].match(new RegExp(`(${ANGKA})h`));
    if (sah(lat, lon)) {
      return { lat, lon, arahKamera: arah ? Number(arah[1]) : null, bentuk: "Alamat Street View" };
    }
  }

  const angka = isi.match(new RegExp(`(${ANGKA})\\s*[,;\\s]\\s*(${ANGKA})`));
  if (angka) {
    const lat = Number(angka[1]);
    const lon = Number(angka[2]);
    if (sah(lat, lon)) return { lat, lon, arahKamera: null, bentuk: "Angka" };
  }

  return null;
}
