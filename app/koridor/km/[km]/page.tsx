import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { satu } from "@/lib/param";
import { formatSta } from "@/lib/sta";
import { KOLOM_TEMUAN, kodeTemuan, namaJenis, type BarisTemuan } from "@/lib/temuan";
import { ambilAcuan } from "@/lib/kalibrasi";
import { DAFTAR_ARAH, garisAntaraSta, koordinatDariSta, type Arah } from "@/lib/ruas";
import { bacaPeriode, belumDitangani, dalamPeriode, kmTemuan, KM_TERAKHIR, PILIHAN_PERIODE } from "@/lib/koridor";
import { KartuTemuan } from "@/app/komponen/KartuTemuan";
import { PetaKm, type GarisPeta, type TitikPeta } from "./PetaKm";

async function IsiKm({ params, searchParams }: {
  params: PageProps<"/koridor/km/[km]">["params"];
  searchParams: PageProps<"/koridor/km/[km]">["searchParams"];
}) {
  await connection();
  const { km: teksKm } = await params;
  const sp = await searchParams;
  const km = Number(teksKm);
  const periode = bacaPeriode(satu(sp.periode));
  const akhiran = periode === "semua" ? "" : `?periode=${periode}`;

  if (!Number.isInteger(km) || km < 0 || km > KM_TERAKHIR) {
    return <p className="mt-4 text-sm">KM tidak dikenali. Ruas ini mencakup KM 0 sampai KM {KM_TERAKHIR}.</p>;
  }

  const awalM = km * 1000;
  const akhirM = km * 1000 + 999;

  const supabase = await createClient();
  const [{ data }, acuan] = await Promise.all([
    // Ambil temuan yang mulai sebelum ujung KM ini, lalu saring yang benar-benar menyentuh KM ini
    supabase.from("temuan").select(KOLOM_TEMUAN).neq("status", "Selesai").lte("sta_awal_m", akhirM).order("sta_awal_m"),
    ambilAcuan(supabase),
  ]);

  const temuan = ((data ?? []) as unknown as BarisTemuan[]).filter(
    (t) => belumDitangani(t) && dalamPeriode(t, periode) && kmTemuan(t).includes(km),
  );

  // Titik untuk peta: koordinat GPS kalau ada, kalau tidak dihitung dari STA
  const titik: TitikPeta[] = temuan.map((t) => {
    const punyaGps = t.gps_lat !== null && t.gps_lon !== null;
    const [lat, lon] = punyaGps
      ? [t.gps_lat as number, t.gps_lon as number]
      : koordinatDariSta(t.arah as Arah, t.sta_awal_m, acuan);
    return {
      id: t.id,
      kode: kodeTemuan(t.id, t.dibuat_pada),
      jenis: namaJenis(t),
      tingkat: t.tingkat,
      sta: formatSta(t.sta_awal_m),
      arah: t.arah,
      lat,
      lon,
      perkiraan: !punyaGps,
      akurasiM: t.gps_akurasi_m,
    };
  });
  const garis: GarisPeta[] = DAFTAR_ARAH.map((arah) => ({
    arah,
    koordinat: garisAntaraSta(arah, awalM, akhirM, acuan),
  }));

  return (
    <div>
      <div className="mt-2 flex items-center justify-between text-sm">
        {km > 0 ? (
          <Link href={`/koridor/km/${km - 1}${akhiran}`} className="underline">KM {km - 1}</Link>
        ) : <span />}
        <span className="text-[#4A5568]">
          {formatSta(awalM)} sampai {formatSta(akhirM)}, {PILIHAN_PERIODE[periode].toLowerCase()}
        </span>
        {km < KM_TERAKHIR ? (
          <Link href={`/koridor/km/${km + 1}${akhiran}`} className="underline">KM {km + 1}</Link>
        ) : <span />}
      </div>

      <PetaKm titik={titik} garis={garis} />

      {DAFTAR_ARAH.map((arah) => {
        const diArah = temuan.filter((t) => t.arah === arah);
        return (
          <section key={arah} className="mt-6">
            <h2 className="text-lg font-semibold">
              {arah} ({diArah.length})
            </h2>
            {diArah.length === 0 ? (
              <p className="mt-2 text-sm text-[#4A5568]">Tidak ada temuan belum ditangani di arah ini.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {diArah.map((t) => (
                  <KartuTemuan key={t.id} t={t} kembali={`/koridor/km/${km}${akhiran}`} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default async function HalamanKm(props: PageProps<"/koridor/km/[km]">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/koridor" className="text-sm text-[#4A5568] underline">Skema koridor</Link>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat temuan...</p>}>
          <JudulKm params={props.params} />
          <IsiKm params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function JudulKm({ params }: { params: PageProps<"/koridor/km/[km]">["params"] }) {
  const { km } = await params;
  return <h1 className="mt-3 text-2xl font-semibold">KM {km}</h1>;
}
