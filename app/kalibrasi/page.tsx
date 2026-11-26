import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatSta } from "@/lib/sta";
import { satu } from "@/lib/param";
import { bacaKoordinat } from "@/lib/koordinat";
import {
  ATRIBUSI_PETA,
  JANGKAUAN_KALIBRASI_M,
  TANGGAL_DATA_RUAS,
  analisisKalibrasi,
  hitungPosisi,
  type TitikKalibrasi,
  type TitikTeranalisis,
} from "@/lib/ruas";
import { GrafikKoreksi } from "./GrafikKoreksi";
import { imporTitikAwal, tambahTitikKalibrasi, ubahStatusTitik } from "./aksi";

const kotak = "rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base w-full";
const label = "block text-xs font-semibold text-[#4A5568] mb-1";
const pilihan =
  "block cursor-pointer rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-center text-sm " +
  "peer-checked:border-[#14213D] peer-checked:bg-[#14213D] peer-checked:text-white";
const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";
const tombolGaris =
  "rounded-xl border border-[#14213D] bg-white px-3 py-2 text-xs font-semibold text-[#14213D]";

function Radio({ nama, nilai, teks, wajib, terpilih }: {
  nama: string; nilai: string; teks: string; wajib?: boolean; terpilih?: boolean;
}) {
  return (
    <label>
      <input type="radio" name={nama} value={nilai} className="peer sr-only" required={wajib} defaultChecked={terpilih} />
      <span className={pilihan}>{teks}</span>
    </label>
  );
}

function meterBertanda(m: number) {
  const bulat = Math.round(m);
  return `${bulat >= 0 ? "+" : ""}${bulat} m`;
}

// Satu kartu titik kalibrasi
function KartuTitik({ t }: { t: TitikTeranalisis }) {
  return (
    <li className="rounded-xl border border-[#DCE2EA] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">Patok {formatSta(t.sta_patok_m)}</p>
          <p className="text-sm text-[#4A5568]">
            {t.arah} | {t.sumber}
            {t.perkiraan_galat_m !== null ? ` | galat sekitar ${t.perkiraan_galat_m} m` : ""}
          </p>
          <p className="mt-1 text-sm">
            Koreksi <span className="font-semibold">{meterBertanda(t.koreksiM)}</span>
            {t.sisaM !== null ? <> | sisa uji silang {meterBertanda(t.sisaM)}</> : null}
          </p>
          <p className="text-xs text-[#4A5568]">
            Ukur OpenStreetMap {(t.ukurM / 1000).toFixed(3)} km | {t.jarakKeGarisM.toFixed(1)} m dari garis as
          </p>
          {t.catatan ? <p className="mt-1 text-xs text-[#4A5568]">{t.catatan}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={t.aktif
              ? "rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#14532D]"
              : "rounded-full bg-[#EEF1F5] px-2 py-0.5 text-xs font-semibold text-[#2D3B52]"}>
              {t.aktif ? "Aktif" : "Nonaktif"}
            </span>
            {t.menyimpang ? (
              <span className="rounded-full bg-[#FFEDD5] px-2 py-0.5 text-xs font-semibold text-[#7C2D12]">
                Menyimpang dari titik sekitarnya
              </span>
            ) : null}
            {t.jauhDariGaris ? (
              <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-xs font-semibold text-[#7A1C1C]">
                Jauh dari garis as
              </span>
            ) : null}
          </div>
        </div>

        <form action={ubahStatusTitik} className="shrink-0">
          <input type="hidden" name="id" value={t.id} />
          <input type="hidden" name="aktifkan" value={t.aktif ? "0" : "1"} />
          <button type="submit" className={tombolGaris}>{t.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
        </form>
      </div>
    </li>
  );
}

async function IsiKalibrasi({ searchParams }: { searchParams: PageProps<"/kalibrasi">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const galat = satu(sp.galat);
  const tersimpan = satu(sp.tersimpan);
  const teksUji = satu(sp.uji) ?? "";

  const supabase = await createClient();
  const { data } = await supabase
    .from("titik_kalibrasi")
    .select("id, arah, sta_patok_m, lat, lon, sumber, perkiraan_galat_m, aktif, catatan, dibuat_pada")
    .order("sta_patok_m");

  const daftar = (data ?? []) as TitikKalibrasi[];
  const { titik, acuan, rataKoreksi } = analisisKalibrasi(daftar);
  const jumlahAktif = titik.filter((t) => t.aktif).length;

  // Uji hitung STA dari tempelan
  const koordinatUji = teksUji ? bacaKoordinat(teksUji) : null;
  const hasilUji = koordinatUji ? hitungPosisi(koordinatUji.lat, koordinatUji.lon, 5, acuan) : null;

  return (
    <div>
      {galat ? (
        <p className="mt-4 rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">{galat}</p>
      ) : null}
      {tersimpan ? (
        <p className="mt-4 rounded-xl border border-[#86C9A0] bg-[#DCFCE7] px-4 py-3 text-sm text-[#14532D]">
          Titik kalibrasi tersimpan. Lihat grafiknya: kalau titik baru langsung bertanda menyimpang, periksa
          lagi angka patok dan arahnya.
        </p>
      ) : null}

      {/* Ringkasan */}
      <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <p className="text-sm text-[#4A5568]">
          {jumlahAktif} titik aktif dari {titik.length} titik tersimpan
        </p>
        <p className="text-lg font-semibold">
          {rataKoreksi === null ? "Belum ada koreksi" : `Koreksi rata-rata ${meterBertanda(rataKoreksi)}`}
        </p>
        <p className="mt-1 text-xs text-[#4A5568]">
          STA dianggap terkalibrasi kalau ada titik aktif dalam jarak {JANGKAUAN_KALIBRASI_M / 1000} km.
          Di luar itu, STA tetap dihitung tetapi diberi tanda belum pasti.
        </p>
      </div>

      {titik.length === 0 ? (
        <form action={imporTitikAwal} className="mt-4 rounded-xl border border-dashed border-[#9FB0C6] bg-white p-4">
          <p className="text-sm">
            Belum ada titik kalibrasi. Impor tujuh titik hasil survei Street View 25 November 2026:
            empat aktif, tiga nonaktif sesuai keputusan nomor 110.
          </p>
          <button type="submit" className={`${tombolUtama} mt-3`}>Impor 7 titik awal</button>
        </form>
      ) : null}

      {/* Uji hitung */}
      <div className="mt-6 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <h2 className="text-base font-semibold">Uji hitung STA</h2>
        <p className="mt-1 text-xs text-[#4A5568]">
          Tempel tautan Street View dari patok yang BELUM dipakai sebagai titik kalibrasi. Kalau STA hasil
          hitungan dekat dengan angka di patok, berarti kalibrasinya bekerja.
        </p>
        <form method="get" className="mt-3 flex flex-col gap-2">
          <textarea className={kotak} name="uji" rows={2} defaultValue={teksUji}
                    placeholder="Tempel tautan Street View atau koordinat" />
          <button type="submit" className={tombolUtama}>Hitung</button>
        </form>

        {teksUji && !koordinatUji ? (
          <p className="mt-3 text-sm text-[#7A1C1C]">Koordinat tidak terbaca dari tempelan itu.</p>
        ) : null}

        {hasilUji && hasilUji.staM === null ? (
          <div className="mt-3 rounded-xl border border-[#FDBA74] bg-[#FFEDD5] p-3 text-sm text-[#7C2D12]">
            <p className="text-base font-semibold">Di luar ruas Tomang sampai Bitung</p>
            <p className="mt-1">
              Lokasi ini {(hasilUji.jarakKeAsM / 1000).toFixed(2)} km dari garis as terdekat. STA tidak dihitung,
              karena patok KM di lokasi itu kemungkinan milik jalan tol lain yang punya KM 0 sendiri.
            </p>
            <p className="mt-1 text-xs">Dibaca dari {koordinatUji?.bentuk}.</p>
          </div>
        ) : null}

        {hasilUji && hasilUji.staM !== null ? (
          <div className="mt-3 rounded-xl bg-[#EEF1F5] p-3 text-sm">
            <p className="text-2xl font-semibold">STA {formatSta(hasilUji.staM)}</p>
            <p>{hasilUji.arahTerdekat}, {hasilUji.jarakKeAsM.toFixed(1)} m dari garis as</p>
            <p>Ukur OpenStreetMap {(hasilUji.ukurM / 1000).toFixed(3)} km, koreksi {meterBertanda(hasilUji.koreksiM)}</p>
            <p className="mt-1 font-semibold">
              {hasilUji.terkalibrasi
                ? "Terkalibrasi"
                : "Belum pasti, tidak ada titik kalibrasi aktif dalam 2 km"}
            </p>
            <p className="mt-1 text-xs text-[#4A5568]">
              Dibaca dari {koordinatUji?.bentuk}. Akurasi posisi dianggap 5 m karena berasal dari kamera Street View.
            </p>
          </div>
        ) : null}
      </div>

      {/* Grafik */}
      <h2 className="mt-6 text-lg font-semibold">Grafik koreksi</h2>
      <GrafikKoreksi titik={titik} />

      {/* Daftar titik */}
      <h2 className="mt-6 text-lg font-semibold">Titik kalibrasi ({titik.length})</h2>
      {titik.length === 0 ? (
        <p className="mt-2 text-sm text-[#4A5568]">Belum ada.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {titik.map((t) => <KartuTitik key={t.id} t={t} />)}
        </ul>
      )}

      {/* Tambah titik */}
      <details className="mt-6 rounded-xl border border-[#DCE2EA] bg-white" open={titik.length > 0 && Boolean(galat)}>
        <summary className="cursor-pointer px-4 py-3 text-base font-semibold">Tambah titik kalibrasi</summary>
        <form action={tambahTitikKalibrasi} className="flex flex-col gap-4 border-t border-[#DCE2EA] px-4 py-4">
          <fieldset>
            <legend className={label}>Arah</legend>
            <div className="grid grid-cols-2 gap-2">
              <Radio nama="arah" nilai="Arah Tangerang" teks="Tangerang" wajib />
              <Radio nama="arah" nilai="Arah Jakarta" teks="Jakarta" />
            </div>
          </fieldset>

          <div>
            <p className={label}>Angka di patok</p>
            <div className="flex items-center gap-2">
              <input className={kotak} type="number" name="km" min="0" max="30" placeholder="KM" aria-label="KM patok" required />
              <span className="text-lg font-semibold">+</span>
              <input className={kotak} type="number" name="meter" min="0" max="999" placeholder="meter" aria-label="Meter patok" defaultValue={0} />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="lokasi">Tautan Street View atau koordinat</label>
            <textarea className={kotak} id="lokasi" name="lokasi" rows={3} required
                      placeholder="Tempel kode sematan Street View, alamat Street View, atau -6.2, 106.7" />
          </div>

          <fieldset>
            <legend className={label}>Sumber</legend>
            <div className="grid grid-cols-2 gap-2">
              <Radio nama="sumber" nilai="Street View" teks="Street View" terpilih />
              <Radio nama="sumber" nilai="GPS lapangan" teks="GPS lapangan" />
            </div>
          </fieldset>

          <div>
            <label className={label} htmlFor="perkiraan_galat_m">Perkiraan jarak posisi ke patok (m, opsional)</label>
            <input className={kotak} type="number" step="0.5" min="0" id="perkiraan_galat_m" name="perkiraan_galat_m" />
          </div>

          <div>
            <label className={label} htmlFor="catatan">Catatan (opsional)</label>
            <textarea className={kotak} id="catatan" name="catatan" rows={2} />
          </div>

          <button type="submit" className={tombolUtama}>Simpan titik</button>
        </form>
      </details>

      <p className="mt-8 text-xs text-[#4A5568]">
        Garis ruas: {ATRIBUSI_PETA}, data per {TANGGAL_DATA_RUAS?.slice(0, 10) ?? "tidak diketahui"}.
      </p>
    </div>
  );
}

export default function Kalibrasi(props: PageProps<"/kalibrasi">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#4A5568] underline">Beranda</Link>
          <Link href="/catat" className="text-sm font-semibold text-[#14213D] underline">Halaman catat</Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Kalibrasi STA</h1>
        <p className="mt-1 text-sm text-[#4A5568]">
          Mencocokkan ukuran garis peta dengan angka di patok KM, supaya STA dari GPS sama dengan di lapangan.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <IsiKalibrasi searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
