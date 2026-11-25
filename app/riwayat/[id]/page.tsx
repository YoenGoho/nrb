import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { formatWaktu, satu } from "@/lib/param";
import { KOLOM_TEMUAN, belumDiukur, type BarisTemuan } from "@/lib/temuan";
import { KartuTemuan } from "@/app/komponen/KartuTemuan";
import { DaftarRiwayatAksi, type BarisRiwayat } from "@/app/komponen/DaftarRiwayatAksi";
import { bukaKembaliInspeksi, tutupInspeksi } from "@/app/catat/aksi";

const kotak = "rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base w-full";
const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";
const tombolGaris =
  "rounded-xl border border-[#14213D] bg-white px-4 py-3 text-sm font-semibold text-[#14213D] w-full";

async function DetailSesi({ params, searchParams }: {
  params: PageProps<"/riwayat/[id]">["params"];
  searchParams: PageProps<"/riwayat/[id]">["searchParams"];
}) {
  await connection();

  const { id } = await params;
  const sp = await searchParams;
  const galat = satu(sp.galat);
  const saringBelumDiukur = satu(sp.saring) === "belum-diukur";
  const inspeksiId = Number(id);

  const supabase = await createClient();
  const { data: sesi } = Number.isInteger(inspeksiId)
    ? await supabase
        .from("inspeksi")
        .select("id, tanggal, sta_awal_m, sta_akhir_m, arah, pic_atasan, cuaca, status, dibuat_pada, ditutup_pada")
        .eq("id", inspeksiId)
        .maybeSingle()
    : { data: null };

  if (!sesi) {
    return (
      <p className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4 text-sm">
        Sesi tidak ditemukan, atau bukan milik akun ini.
      </p>
    );
  }

  const [{ data: daftar }, { data: riwayat }] = await Promise.all([
    supabase.from("temuan").select(KOLOM_TEMUAN).eq("inspeksi_id", sesi.id).order("sta_awal_m"),
    supabase
      .from("riwayat_aksi")
      .select("id, aksi, keterangan, dibuat_pada")
      .eq("tabel", "inspeksi")
      .eq("baris_id", sesi.id)
      .order("dibuat_pada", { ascending: false }),
  ]);

  const semua = (daftar ?? []) as unknown as BarisTemuan[];
  const temuan = saringBelumDiukur ? semua.filter(belumDiukur) : semua;
  const jumlahBelumDiukur = semua.filter(belumDiukur).length;
  const ditutup = sesi.status === "Selesai";
  const alamatIni = `/riwayat/${sesi.id}`;

  return (
    <div>
      {galat ? (
        <p className="mt-4 rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
          {galat}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">
              {formatKm(sesi.sta_awal_m)} sampai {formatKm(sesi.sta_akhir_m)}
            </p>
            <p className="text-sm text-[#4A5568]">{sesi.tanggal} | {sesi.arah}</p>
            {sesi.pic_atasan ? <p className="text-sm text-[#4A5568]">PIC: {sesi.pic_atasan}</p> : null}
            {sesi.cuaca ? <p className="text-sm text-[#4A5568]">Cuaca: {sesi.cuaca}</p> : null}
            <p className="mt-2 text-xs text-[#4A5568]">Dimulai {formatWaktu(sesi.dibuat_pada)}</p>
            {sesi.ditutup_pada ? (
              <p className="text-xs text-[#4A5568]">Ditutup {formatWaktu(sesi.ditutup_pada)}</p>
            ) : null}
          </div>
          <span
            className={
              ditutup
                ? "rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]"
                : "rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]"
            }
          >
            {sesi.status}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={`/catat/temuan?inspeksi=${sesi.id}&kembali=${encodeURIComponent(alamatIni)}`}
            className={`${ditutup ? tombolGaris : tombolUtama} block text-center`}
          >
            {ditutup ? "Tambah temuan susulan ke sesi ini" : "Tambah temuan"}
          </Link>

          {ditutup ? (
            <details className="rounded-xl border border-[#DCE2EA] bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                Buka kembali sesi ini
              </summary>
              <form action={bukaKembaliInspeksi} className="flex flex-col gap-3 border-t border-[#DCE2EA] px-4 py-3">
                <input type="hidden" name="inspeksi_id" value={sesi.id} />
                <label className="text-xs font-semibold text-[#4A5568]" htmlFor="alasan">
                  Alasan membuka kembali (dianjurkan, tercatat di riwayat)
                </label>
                <input className={kotak} id="alasan" name="alasan" placeholder="Contoh: lupa mencatat dua temuan di KM 19" />
                <button type="submit" className={tombolUtama}>Buka kembali</button>
              </form>
            </details>
          ) : (
            <form action={tutupInspeksi}>
              <input type="hidden" name="inspeksi_id" value={sesi.id} />
              <button type="submit" className={tombolGaris}>Tutup inspeksi</button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Temuan ({semua.length})</h2>
        {jumlahBelumDiukur > 0 ? (
          <Link
            href={saringBelumDiukur ? alamatIni : `${alamatIni}?saring=belum-diukur`}
            className="text-sm font-semibold text-[#78350F] underline"
          >
            {saringBelumDiukur ? "Tampilkan semua" : `${jumlahBelumDiukur} belum diukur`}
          </Link>
        ) : null}
      </div>

      {temuan.length === 0 ? (
        <p className="mt-2 text-sm text-[#4A5568]">Tidak ada temuan untuk ditampilkan.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {temuan.map((t) => (
            <KartuTemuan key={t.id} t={t} kembali={alamatIni} />
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Riwayat sesi</h2>
      <DaftarRiwayatAksi baris={(riwayat ?? []) as BarisRiwayat[]} />
    </div>
  );
}

export default function DetailRiwayat(props: PageProps<"/riwayat/[id]">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/riwayat" className="text-sm text-[#4A5568] underline">Semua sesi</Link>
        <h1 className="mt-3 text-2xl font-semibold">Detail inspeksi</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <DetailSesi params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
