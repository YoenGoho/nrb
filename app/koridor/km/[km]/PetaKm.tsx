"use client";

// Peta detail satu KM. Peta baru dimuat setelah tombol ditekan, supaya hemat kuota
// dan halaman daftar tetap cepat dibuka. Peta butuh sinyal internet untuk mengambil gambar petanya.

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { ATRIBUSI_PETA } from "@/lib/ruas";

export type TitikPeta = {
  id: number;
  kode: string;
  jenis: string;
  tingkat: string;
  sta: string; // contoh "14+792"
  arah: string;
  lat: number;
  lon: number;
  perkiraan: boolean; // true kalau tidak ada GPS, posisi dihitung dari STA
  akurasiM: number | null;
};

export type GarisPeta = { arah: string; koordinat: [number, number][] };

const WARNA_TINGKAT: Record<string, string> = { Berat: "#DC2626", Sedang: "#F97316", Ringan: "#EAB308" };
const WARNA_ARAH: Record<string, string> = { "Arah Jakarta": "#2563EB", "Arah Tangerang": "#475569" };

// Isi jendela keterangan dibuat dengan elemen dan textContent, bukan teks HTML,
// supaya nama jenis yang diketik manual tidak bisa menyisipkan kode ke halaman.
function isiKeterangan(t: TitikPeta) {
  const wadah = document.createElement("div");
  const baris = (teks: string, tebal = false) => {
    const p = document.createElement("p");
    p.textContent = teks;
    p.style.margin = "0";
    if (tebal) p.style.fontWeight = "600";
    wadah.appendChild(p);
  };
  baris(t.kode);
  baris(t.jenis, true);
  baris(`${t.sta}, ${t.arah}, ${t.tingkat}`);
  baris(t.perkiraan ? "Posisi perkiraan dari STA" : `Posisi GPS, akurasi ${Math.round(t.akurasiM ?? 0)} m`);
  const tautan = document.createElement("a");
  tautan.href = `https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}`;
  tautan.target = "_blank";
  tautan.rel = "noopener noreferrer";
  tautan.textContent = "Buka di Google Maps";
  wadah.appendChild(tautan);
  return wadah;
}

export function PetaKm({ titik, garis }: { titik: TitikPeta[]; garis: GarisPeta[] }) {
  const [tampil, setTampil] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const wadahPeta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tampil || !wadahPeta.current) return;
    const elemen = wadahPeta.current;
    let peta: import("leaflet").Map | null = null;
    let batal = false;

    // Leaflet hanya bisa jalan di browser, jadi dimuat di sini, bukan di bagian atas berkas
    import("leaflet")
      .then(({ default: L }) => {
        if (batal) return;
        peta = L.map(elemen);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: ATRIBUSI_PETA,
        }).addTo(peta);

        const batas = L.latLngBounds([]);
        for (const g of garis) {
          L.polyline(g.koordinat, { color: WARNA_ARAH[g.arah] ?? "#475569", weight: 4, opacity: 0.6 }).addTo(peta);
          g.koordinat.forEach((k) => batas.extend(k));
        }
        for (const t of titik) {
          L.circleMarker([t.lat, t.lon], {
            radius: 8,
            color: WARNA_TINGKAT[t.tingkat] ?? "#14213D",
            weight: 3,
            // Posisi perkiraan: lingkaran putus-putus berisi putih. Posisi GPS: lingkaran penuh.
            dashArray: t.perkiraan ? "4 4" : undefined,
            fillColor: t.perkiraan ? "#FFFFFF" : (WARNA_TINGKAT[t.tingkat] ?? "#14213D"),
            fillOpacity: t.perkiraan ? 0.9 : 0.8,
          })
            .bindPopup(isiKeterangan(t))
            .addTo(peta);
          batas.extend([t.lat, t.lon]);
        }
        if (batas.isValid()) peta.fitBounds(batas, { padding: [24, 24] });
      })
      .catch(() => setGalat("Peta gagal dimuat. Periksa sinyal internet, lalu coba lagi."));

    // Saat peta ditutup atau halaman ditinggalkan, peta dibongkar supaya tidak membebani HP
    return () => {
      batal = true;
      peta?.remove();
    };
  }, [tampil, titik, garis]);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setTampil(!tampil)}
        className="w-full rounded-xl border border-[#14213D] bg-white px-4 py-3 text-sm font-semibold text-[#14213D]"
      >
        {tampil ? "Tutup peta" : "Lihat di peta"}
      </button>

      {tampil ? (
        <>
          <div ref={wadahPeta} className="mt-3 h-80 w-full overflow-hidden rounded-xl border border-[#DCE2EA]" />
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#4A5568]">
            <span>Lingkaran penuh: posisi GPS</span>
            <span>Lingkaran putus-putus: posisi perkiraan dari STA</span>
            <span>Garis biru: Arah Jakarta, garis abu: Arah Tangerang</span>
          </div>
          {galat ? <p className="mt-2 text-sm text-[#7A1C1C]">{galat}</p> : null}
        </>
      ) : null}
    </div>
  );
}
