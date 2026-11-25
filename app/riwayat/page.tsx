import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { satu } from "@/lib/param";
import { KOLOM_SESI, keteranganWaktuSesi, lewatWaktu, type BarisSesi } from "@/lib/inspeksi";
import { KOLOM_TEMUAN, belumDiukur, diLuarRentang, type BarisTemuan } from "@/lib/temuan";
import { KartuTemuan } from "@/app/komponen/KartuTemuan";
import { PenandaSesi } from "@/app/komponen/PenandaSesi";

type SesiDenganJumlah = BarisSesi & { temuan: { count: number }[] };

// Daftar penyaring yang bisa ditampilkan lewat alamat /riwayat?tampil=...
const PENYARING = {
  "belum-diukur": {
    judul: "Temuan belum diukur",
    keterangan: "Temuan yang panjang atau lebarnya masih kosong. Tekan Ubah untuk mengisinya.",
    kosong: "Semua temuan sudah diukur.",
    saring: belumDiukur,
  },
  "luar-rentang": {
    judul: "Temuan di luar rentang sesi",
    keterangan:
      "STA temuan berada di luar rentang KM sesinya. Periksa apakah memang begitu di lapangan, " +
      "atau temuan masuk ke sesi yang salah.",
    kosong: "Tidak ada temuan di luar rentang sesinya.",
    saring: diLuarRentang,
  },
} as const;

type KunciPenyaring = keyof typeof PENYARING;

function adalahPenyaring(nilai: string | undefined): nilai is KunciPenyaring {
  return nilai === "belum-diukur" || nilai === "luar-rentang";
}

async function DaftarSesi({ searchParams }: { searchParams: PageProps<"/riwayat">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const tampil = satu(sp.tampil);

  const supabase = await createClient();
  const [{ data: dataSesi }, { data: dataTemuan }] = await Promise.all([
    supabase
      .from("inspeksi")
      .select(`${KOLOM_SESI}, temuan(count)`)
      .order("tanggal", { ascending: false })
      .order("dibuat_pada", { ascending: false }),
    supabase.from("temuan").select(KOLOM_TEMUAN).order("dibuat_pada", { ascending: false }),
  ]);

  const semuaTemuan = (dataTemuan ?? []) as unknown as BarisTemuan[];

  // Tampilan penyaring: daftar temuan, bukan daftar sesi
  if (adalahPenyaring(tampil)) {
    const p = PENYARING[tampil];
    const hasil = semuaTemuan.filter(p.saring);
    return (
      <div>
        <Link href="/riwayat" className="mt-2 inline-block text-sm text-[#4A5568] underline">
          Kembali ke semua sesi
        </Link>
        <h2 className="mt-4 text-lg font-semibold">{p.judul} ({hasil.length})</h2>
        <p className="mt-1 text-sm text-[#4A5568]">{p.keterangan}</p>
        {hasil.length === 0 ? (
          <p className="mt-4 text-sm text-[#4A5568]">{p.kosong}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {hasil.map((t) => (
              <KartuTemuan key={t.id} t={t} kembali={`/riwayat?tampil=${tampil}`} />
            ))}
          </ul>
        )}
      </div>
    );
  }

  const sesi = (dataSesi ?? []) as unknown as SesiDenganJumlah[];
  // Urutan: sesi berjalan yang lewat waktu, sesi berjalan lainnya, lalu sesi selesai
  const urut = [
    ...sesi.filter((s) => s.status === "Berjalan" && lewatWaktu(s)),
    ...sesi.filter((s) => s.status === "Berjalan" && !lewatWaktu(s)),
    ...sesi.filter((s) => s.status !== "Berjalan"),
  ];

  const jumlahBelumDiukur = semuaTemuan.filter(belumDiukur).length;
  const jumlahLuarRentang = semuaTemuan.filter(diLuarRentang).length;

  return (
    <div>
      <div className="mt-4 flex flex-col gap-2">
        {jumlahLuarRentang > 0 ? (
          <Link
            href="/riwayat?tampil=luar-rentang"
            className="block rounded-xl border border-[#FDBA74] bg-[#FFEDD5] px-4 py-3 text-sm text-[#7C2D12]"
          >
            <span className="font-semibold">{jumlahLuarRentang} temuan di luar rentang sesinya.</span>{" "}
            Tekan untuk memeriksa.
          </Link>
        ) : null}
        {jumlahBelumDiukur > 0 ? (
          <Link
            href="/riwayat?tampil=belum-diukur"
            className="block rounded-xl border border-[#FCD34D] bg-[#FEF3C7] px-4 py-3 text-sm text-[#78350F]"
          >
            <span className="font-semibold">{jumlahBelumDiukur} temuan belum diukur.</span> Tekan untuk
            melihat dan melengkapinya.
          </Link>
        ) : null}
      </div>

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
                className="flex items-start justify-between gap-3 rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-base font-semibold">
                    {formatKm(s.sta_awal_m)} sampai {formatKm(s.sta_akhir_m)}
                  </span>
                  <span className="block text-sm text-[#4A5568]">{keteranganWaktuSesi(s)}</span>
                  <span className="block text-sm text-[#4A5568]">
                    {s.arah} | {s.temuan?.[0]?.count ?? 0} temuan
                  </span>
                </span>
                <PenandaSesi s={s} />
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
