"use client";

// Tombol yang membaca GPS HP, menghitung STA, lalu mengisi kotak STA di form temuan.
// "use client" artinya kode ini dijalankan di browser HP, bukan di server,
// karena hanya browser yang bisa membaca GPS. Hitungan STA juga terjadi di HP.

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AKURASI_SARAN_ARAH_M, hitungPosisi, type Acuan } from "@/lib/ruas";
import { formatKm, formatSta } from "@/lib/sta";
import { PERISTIWA_WAKTU_GPS } from "@/lib/waktu";

// Akurasi lebih buruk dari ini: STA sama sekali tidak diisi
const AKURASI_TOLAK_M = 100;
// Akurasi lebih buruk dari ini: STA tetap diisi, tetapi diberi peringatan
const AKURASI_WASPADA_M = 20;
// Paling lama menunggu GPS mengunci posisi, dalam milidetik
const BATAS_TUNGGU_MS = 20000;
// Posisi yang dibawa dari halaman pilih sesi hanya dipakai kalau umurnya belum lewat dari ini
const UMUR_POSISI_DIBAWA_MS = 10 * 60 * 1000;

// Posisi GPS yang sudah diambil di halaman pilih sesi, dibawa lewat alamat halaman
export type PosisiAwal = { lat: number; lon: number; akurasiM: number; waktuMs: number };

// Rentang sesi tujuan temuan. akhirM sudah sampai ujung KM akhir (contoh 20+999).
export type RentangGps = { awalM: number; akhirM: number; arah: string };

type Pesan = { jenis: "berhasil" | "waspada" | "gagal"; baris: string[] };

type DataGps = { lat: number; lon: number; akurasiM: number; staM: number; waktu: string };

const warnaPesan: Record<Pesan["jenis"], string> = {
  berhasil: "border-[#86C9A0] bg-[#DCFCE7] text-[#14532D]",
  waspada: "border-[#F2C94C] bg-[#FEF9C3] text-[#713F12]",
  gagal: "border-[#F4B183] bg-[#FFEDD5] text-[#7C2D12]",
};

function pesanGalatGps(err: GeolocationPositionError): string {
  if (err.code === err.PERMISSION_DENIED) {
    return "Izin lokasi ditolak. Buka pengaturan situs di browser, izinkan Lokasi untuk NRB, lalu coba lagi.";
  }
  if (err.code === err.TIMEOUT) {
    return "GPS belum mengunci posisi dalam 20 detik. Pindah ke tempat terbuka, lalu coba lagi.";
  }
  return "Posisi belum didapat. Pastikan Lokasi di HP menyala, lalu coba lagi.";
}

// Mengisi satu kotak isian di form tempat tombol ini berada
function isiKotak(form: HTMLFormElement, nama: string, nilai: string) {
  const kotak = form.elements.namedItem(nama);
  if (kotak instanceof HTMLInputElement) kotak.value = nilai;
}

export function TombolAmbilPosisi({
  acuan,
  target,
  simpanKoordinat,
  rentangSesi,
  posisiAwal,
}: {
  acuan: Acuan[];
  target: "awal" | "akhir"; // STA mana yang diisi
  simpanKoordinat: boolean; // hanya STA awal yang menyimpan koordinat dan waktu temuan
  rentangSesi?: RentangGps; // untuk peringatan kalau posisi di luar rentang sesi
  posisiAwal?: PosisiAwal; // posisi yang dibawa dari halaman pilih sesi
}) {
  const tombol = useRef<HTMLButtonElement>(null);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Pesan | null>(null);
  const [gps, setGps] = useState<DataGps | null>(null);

  function olah(lat: number, lon: number, akurasiM: number, waktuMs: number, dibawa = false) {
    const akurasi = Math.round(akurasiM);

    // Langkah 1: GPS terlalu kasar, jangan isi apa pun
    if (akurasiM > AKURASI_TOLAK_M) {
      setPesan({
        jenis: "gagal",
        baris: [
          `Sinyal GPS lemah, akurasi sekitar ${akurasi} m. STA tidak diisi.`,
          "Tunggu sebentar di tempat terbuka, lalu ambil lagi.",
        ],
      });
      return;
    }

    // Langkah 2: hitung STA dari koordinat dan titik kalibrasi
    const hasil = hitungPosisi(lat, lon, akurasiM, acuan);

    // Langkah 3: di luar ruas, jangan isi
    if (hasil.staM === null) {
      setPesan({
        jenis: "gagal",
        baris: [
          `Posisi ini ${Math.round(hasil.jarakKeAsM)} m dari garis as terdekat, di luar ruas Tomang sampai Bitung.`,
          "STA tidak diisi.",
        ],
      });
      return;
    }

    // Langkah 4: isi kotak KM dan meter
    const form = tombol.current?.form;
    if (!form) return;
    isiKotak(form, `km_${target}`, String(Math.floor(hasil.staM / 1000)));
    isiKotak(form, `m_${target}`, String(hasil.staM % 1000));

    const baris = [
      ...(dibawa ? ["Posisi dibawa dari halaman pilih sesi."] : []),
      `STA ${formatSta(hasil.staM)} sudah diisi. Akurasi GPS ${akurasi} m.`,
    ];
    let jenis: Pesan["jenis"] = "berhasil";

    // Langkah 5: arah hanya dipilihkan kalau GPS cukup akurat, dan hanya untuk STA awal
    if (target === "awal") {
      if (hasil.arahSaran) {
        const pilihanArah = form.elements.namedItem("arah");
        if (pilihanArah instanceof RadioNodeList) pilihanArah.value = hasil.arahSaran;
        baris.push(`${hasil.arahSaran} dipilih otomatis. Periksa lagi sebelum menyimpan.`);
      } else {
        baris.push(
          `Arah tidak dipilih otomatis, karena perlu akurasi ${AKURASI_SARAN_ARAH_M} m atau lebih baik. Pilih arah sendiri.`,
        );
      }
    }

    // Langkah 6: peringatan kalau hasilnya perlu dicocokkan dengan patok
    if (!hasil.terkalibrasi) {
      jenis = "waspada";
      baris.push("Belum ada titik kalibrasi dalam 2 km dari sini. STA bisa meleset puluhan meter, cocokkan dengan patok terdekat.");
    }
    if (akurasiM > AKURASI_WASPADA_M) {
      jenis = "waspada";
      baris.push(`Akurasi kurang baik. STA bisa meleset sekitar ${akurasi} m, cocokkan dengan patok terdekat.`);
    }

    // Langkah 7: bandingkan dengan rentang dan arah sesi tujuan
    if (rentangSesi && (hasil.staM < rentangSesi.awalM || hasil.staM > rentangSesi.akhirM)) {
      jenis = "waspada";
      baris.push(
        `STA ini di luar rentang sesi (${formatKm(rentangSesi.awalM)} sampai ${formatKm(rentangSesi.akhirM)}). ` +
          "Periksa lagi sesinya. Kalau tetap disimpan, temuan diberi tanda di luar rentang.",
      );
    }
    if (rentangSesi && target === "awal" && hasil.arahSaran && hasil.arahSaran !== rentangSesi.arah) {
      jenis = "waspada";
      baris.push(`Posisi lu di jalur ${hasil.arahSaran}, sedangkan sesi ini ${rentangSesi.arah}.`);
    }

    // Langkah 8: simpan koordinat asli, dan kabari isian waktu ditemukan supaya ikut waktu GPS
    if (simpanKoordinat) {
      const waktu = new Date(waktuMs).toISOString();
      setGps({ lat, lon, akurasiM, staM: hasil.staM, waktu });
      form.dispatchEvent(new CustomEvent(PERISTIWA_WAKTU_GPS, { detail: waktu }));
    }

    setPesan({ jenis, baris });
  }

  // Posisi yang dibawa dari halaman pilih sesi diolah sekali saat form pertama tampil.
  // useEffectEvent membungkus fungsi olah supaya efek di bawah hanya bergantung pada posisiAwal,
  // tidak terulang setiap kali komponen digambar ulang.
  const olahPosisiDibawa = useEffectEvent((p: PosisiAwal) => {
    if (Date.now() - p.waktuMs > UMUR_POSISI_DIBAWA_MS) {
      setPesan({
        jenis: "waspada",
        baris: ["Posisi dari halaman pilih sesi sudah lebih dari 10 menit. Tekan tombol GPS untuk mengambil ulang."],
      });
      return;
    }
    olah(p.lat, p.lon, p.akurasiM, p.waktuMs, true);
  });
  useEffect(() => {
    if (!posisiAwal) return;
    // Ditunda sampai form selesai tampil, lalu diolah sekali.
    // Kalau komponen keburu dilepas, penundaannya dibatalkan.
    const penunda = setTimeout(() => olahPosisiDibawa(posisiAwal), 0);
    return () => clearTimeout(penunda);
  }, [posisiAwal]);

  function ambil() {
    setPesan(null);

    // GPS hanya boleh dibaca dari alamat https atau localhost
    if (!window.isSecureContext || !("geolocation" in navigator)) {
      setPesan({
        jenis: "gagal",
        baris: ["Lokasi tidak bisa dibaca di alamat ini. Buka NRB lewat alamat https (situs online) atau localhost."],
      });
      return;
    }

    setSibuk(true);
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        setSibuk(false);
        olah(posisi.coords.latitude, posisi.coords.longitude, posisi.coords.accuracy, posisi.timestamp);
      },
      (err) => {
        setSibuk(false);
        setPesan({ jenis: "gagal", baris: [pesanGalatGps(err)] });
      },
      // enableHighAccuracy: minta GPS satelit, bukan perkiraan dari Wi-Fi
      // maximumAge 0: jangan pakai posisi lama yang tersimpan di HP
      { enableHighAccuracy: true, timeout: BATAS_TUNGGU_MS, maximumAge: 0 },
    );
  }

  return (
    <div className="mt-2">
      <button
        ref={tombol}
        type="button"
        onClick={ambil}
        disabled={sibuk}
        className="rounded-xl border border-[#14213D] bg-white px-4 py-2 text-sm font-semibold text-[#14213D] disabled:opacity-60"
      >
        {sibuk ? "Membaca GPS..." : target === "awal" ? "Ambil posisi dari GPS" : "Ambil posisi akhir dari GPS"}
      </button>

      {pesan ? (
        <div className={`mt-2 rounded-xl border px-3 py-2 text-sm ${warnaPesan[pesan.jenis]}`}>
          {pesan.baris.map((b) => (
            <p key={b}>{b}</p>
          ))}
        </div>
      ) : null}

      {gps ? (
        <>
          <input type="hidden" name="gps_baru" value="1" />
          <input type="hidden" name="gps_lat" value={gps.lat} />
          <input type="hidden" name="gps_lon" value={gps.lon} />
          <input type="hidden" name="gps_akurasi_m" value={gps.akurasiM} />
          <input type="hidden" name="gps_sta_m" value={gps.staM} />
          <input type="hidden" name="gps_diambil_pada" value={gps.waktu} />
        </>
      ) : null}
    </div>
  );
}
