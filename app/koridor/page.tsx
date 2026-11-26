import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { satu } from "@/lib/param";
import { KOLOM_TEMUAN, type BarisTemuan } from "@/lib/temuan";
import {
  bacaPeriode,
  belumDitangani,
  DAFTAR_KM,
  dalamPeriode,
  isiSkema,
  PILIHAN_PERIODE,
  warnaTingkat,
  type Periode,
  type SelKm,
} from "@/lib/koridor";

// Skema koridor: satu baris per KM, Arah Jakarta di kiri dan Arah Tangerang di kanan.
// Susunan tegak dipilih supaya 27 KM tetap mudah diketuk di layar HP yang sempit.
// Kolom kiri dan kanan mengikuti posisi jalur saat menghadap Bitung (lalu lintas lajur kiri).

type Penanda = { nama: string; jenis: string; sta_m: number };

function Sel({ sel }: { sel: SelKm }) {
  return (
    <span
      className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold ${warnaTingkat(sel.terberat)}`}
    >
      {sel.jumlah > 0 ? sel.jumlah : ""}
    </span>
  );
}

async function Skema({ searchParams }: { searchParams: PageProps<"/koridor">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const periode: Periode = bacaPeriode(satu(sp.periode));

  const supabase = await createClient();
  const [{ data: dataTemuan, error }, { data: dataPenanda }] = await Promise.all([
    supabase.from("temuan").select(KOLOM_TEMUAN).neq("status", "Selesai"),
    supabase.from("gerbang").select("nama, jenis, sta_m").order("sta_m"),
  ]);

  if (error) {
    return <p className="mt-4 text-sm text-[#7A1C1C]">Gagal memuat temuan: {error.message}</p>;
  }

  const temuan = ((dataTemuan ?? []) as unknown as BarisTemuan[]).filter(
    (t) => belumDitangani(t) && dalamPeriode(t, periode),
  );
  const skema = isiSkema(temuan);
  const penanda = (dataPenanda ?? []) as Penanda[];

  return (
    <div>
      {/* Pilihan periode */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(PILIHAN_PERIODE) as Periode[]).map((p) => (
          <Link
            key={p}
            href={p === "semua" ? "/koridor" : `/koridor?periode=${p}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              p === periode
                ? "border-[#14213D] bg-[#14213D] text-white"
                : "border-[#DCE2EA] bg-white text-[#14213D]"
            }`}
          >
            {PILIHAN_PERIODE[p]}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-sm text-[#4A5568]">
        {temuan.length} temuan belum ditangani. Angka di kotak adalah jumlah temuan, warnanya mengikuti
        tingkat terberat di KM itu. Ketuk satu baris untuk melihat temuannya.
      </p>

      {/* Keterangan warna */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#4A5568]">
        {["Berat", "Sedang", "Ringan"].map((t) => (
          <span key={t} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded ${warnaTingkat(t)}`} />
            {t}
          </span>
        ))}
      </div>

      {/* Kepala kolom */}
      <div className="mt-4 grid grid-cols-[1fr_7rem_1fr] gap-2 text-center text-xs font-semibold text-[#4A5568]">
        <span>Arah Jakarta</span>
        <span>KM</span>
        <span>Arah Tangerang</span>
      </div>

      {/* Satu baris per KM */}
      <ol className="mt-1 flex flex-col gap-1">
        {DAFTAR_KM.map((km) => {
          const diKm = penanda.filter((p) => Math.floor(p.sta_m / 1000) === km);
          return (
            <li key={km}>
              <Link
                href={`/koridor/km/${km}${periode === "semua" ? "" : `?periode=${periode}`}`}
                className="grid grid-cols-[1fr_7rem_1fr] items-center gap-2 rounded-lg px-1 py-1 hover:bg-white"
              >
                <Sel sel={skema["Arah Jakarta"][km]} />
                <span className="text-center">
                  <span className="block text-sm font-semibold">KM {km}</span>
                  {diKm.map((p) => (
                    <span key={p.nama} className="block truncate text-[10px] leading-tight text-[#4A5568]">
                      {p.nama}
                    </span>
                  ))}
                </span>
                <Sel sel={skema["Arah Tangerang"][km]} />
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-[#4A5568]">
        Posisi gerbang, simpang susun, dan jembatan masih perkiraan dari data publik.
      </p>
    </div>
  );
}

export default function Koridor(props: PageProps<"/koridor">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#4A5568] underline">Beranda</Link>
          <Link href="/catat" className="text-sm font-semibold text-[#14213D] underline">Catat temuan</Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Koridor Tomang sampai Bitung</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat skema...</p>}>
          <Skema searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
