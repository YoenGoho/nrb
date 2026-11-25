import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { satu } from "@/lib/param";
import { KOLOM_TEMUAN, type BarisTemuan } from "@/lib/temuan";
import { KartuTemuan } from "@/app/komponen/KartuTemuan";

type BarisInspeksi = {
  id: number;
  tanggal: string;
  sta_awal_m: number;
  sta_akhir_m: number;
  arah: string;
  status: string;
  temuan: { count: number }[];
};

async function DaftarBelumDiukur() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("temuan")
    .select(KOLOM_TEMUAN)
    .or("panjang_m.is.null,lebar_m.is.null")
    .order("dibuat_pada", { ascending: false });

  const temuan = (data ?? []) as unknown as BarisTemuan[];

  return (
    <div>
      <Link href="/riwayat" className="text-sm text-[#4A5568] underline">Kembali ke semua sesi</Link>
      <h2 className="mt-4 text-lg font-semibold">Temuan belum diukur ({temuan.length})</h2>
      <p className="mt-1 text-sm text-[#4A5568]">
        Temuan yang panjang atau lebarnya masih kosong. Tekan Ubah untuk mengisinya.
      </p>
      {temuan.length === 0 ? (
        <p className="mt-4 text-sm text-[#4A5568]">Semua temuan sudah diukur.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {temuan.map((t) => (
            <KartuTemuan key={t.id} t={t} kembali="/riwayat?tampil=belum-diukur" />
          ))}
        </ul>
      )}
    </div>
  );
}

async function DaftarSesi({ searchParams }: { searchParams: PageProps<"/riwayat">["searchParams"] }) {
  await connection();
  const sp = await searchParams;

  if (satu(sp.tampil) === "belum-diukur") {
    return <DaftarBelumDiukur />;
  }

  const supabase = await createClient();
  const [{ data }, { count: jumlahBelumDiukur }] = await Promise.all([
    supabase
      .from("inspeksi")
      .select("id, tanggal, sta_awal_m, sta_akhir_m, arah, status, temuan(count)")
      .order("tanggal", { ascending: false })
      .order("dibuat_pada", { ascending: false }),
    supabase
      .from("temuan")
      .select("id", { count: "exact", head: true })
      .or("panjang_m.is.null,lebar_m.is.null"),
  ]);

  const sesi = (data ?? []) as unknown as BarisInspeksi[];
  // Sesi yang masih berjalan selalu di paling atas
  const urut = [...sesi.filter((s) => s.status === "Berjalan"), ...sesi.filter((s) => s.status !== "Berjalan")];

  return (
    <div>
      {jumlahBelumDiukur ? (
        <Link
          href="/riwayat?tampil=belum-diukur"
          className="mt-4 block rounded-xl border border-[#FCD34D] bg-[#FEF3C7] px-4 py-3 text-sm text-[#78350F]"
        >
          <span className="font-semibold">{jumlahBelumDiukur} temuan belum diukur.</span> Tekan untuk melihat
          dan melengkapinya.
        </Link>
      ) : null}

      {urut.length === 0 ? (
        <p className="mt-4 text-sm text-[#4A5568]">
          Belum ada sesi inspeksi. Mulai dari <Link href="/catat" className="underline">halaman catat</Link>.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {urut.map((s) => (
            <li key={s.id}>
              <Link
                href={`/riwayat/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
              >
                <span>
                  <span className="block text-base font-semibold">
                    {s.tanggal}, {formatKm(s.sta_awal_m)} sampai {formatKm(s.sta_akhir_m)}
                  </span>
                  <span className="block text-sm text-[#4A5568]">
                    {s.arah} | {s.temuan?.[0]?.count ?? 0} temuan
                  </span>
                </span>
                <span
                  className={
                    s.status === "Berjalan"
                      ? "rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]"
                      : "rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]"
                  }
                >
                  {s.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Riwayat(props: PageProps<"/riwayat">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#4A5568] underline">Beranda</Link>
          <Link href="/catat" className="text-sm font-semibold text-[#14213D] underline">Halaman catat</Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Riwayat inspeksi</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <DaftarSesi searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
