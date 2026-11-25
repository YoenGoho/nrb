import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { satu } from "@/lib/param";
import { KOLOM_TEMUAN, type BarisTemuan } from "@/lib/temuan";
import { KartuTemuan } from "@/app/komponen/KartuTemuan";
import { mulaiInspeksi, tutupInspeksi } from "./aksi";

const kotak = "rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base w-full";
const label = "block text-xs font-semibold text-[#4A5568] mb-1";
const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";
const tombolGaris =
  "rounded-xl border border-[#DCE2EA] bg-white px-4 py-2 text-sm font-semibold text-[#14213D]";

function FormMulaiInspeksi() {
  const hariIni = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  return (
    <form action={mulaiInspeksi} className="mt-4 flex flex-col gap-4">
      <div>
        <label className={label} htmlFor="tanggal">Tanggal</label>
        <input className={kotak} type="date" id="tanggal" name="tanggal" defaultValue={hariIni} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={label} htmlFor="km_awal">KM awal</label>
          <input className={kotak} type="number" id="km_awal" name="km_awal" min="0" max="26" required />
        </div>
        <div className="flex-1">
          <label className={label} htmlFor="km_akhir">KM akhir</label>
          <input className={kotak} type="number" id="km_akhir" name="km_akhir" min="0" max="26" required />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Arah</legend>
        <div className="flex gap-3">
          {["Arah Tangerang", "Arah Jakarta"].map((a) => (
            <label key={a} className="flex-1">
              <input type="radio" name="arah" value={a} className="peer sr-only" required />
              <span className="block cursor-pointer rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-center text-sm peer-checked:border-[#14213D] peer-checked:bg-[#14213D] peer-checked:text-white">
                {a.replace("Arah ", "")}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="pic_atasan">PIC atasan (opsional)</label>
        <input className={kotak} type="text" id="pic_atasan" name="pic_atasan" />
      </div>

      <div>
        <label className={label} htmlFor="cuaca">Cuaca (opsional)</label>
        <input className={kotak} type="text" id="cuaca" name="cuaca" placeholder="Cerah, mendung, hujan" />
      </div>

      <button type="submit" className={tombolUtama}>Mulai inspeksi</button>
    </form>
  );
}

async function IsiCatat({ searchParams }: { searchParams: PageProps<"/catat">["searchParams"] }) {
  await connection();

  const sp = await searchParams;
  const supabase = await createClient();

  const { data: inspeksi, error: galatInspeksi } = await supabase
    .from("inspeksi")
    .select("id, tanggal, sta_awal_m, sta_akhir_m, arah, pic_atasan, cuaca, status")
    .eq("status", "Berjalan")
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pesanGalat = satu(sp.galat) ?? galatInspeksi?.message;

  const kotakGalat = pesanGalat ? (
    <p className="mt-4 rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
      {pesanGalat}
    </p>
  ) : null;

  if (!inspeksi) {
    return (
      <div>
        {kotakGalat}
        <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
          <h2 className="text-lg font-semibold">Belum ada inspeksi berjalan</h2>
          <p className="mt-1 text-sm text-[#4A5568]">
            Mulai satu sesi dulu. Semua temuan hari ini akan terkumpul di dalamnya.
            Sesi yang sudah ditutup ada di halaman{" "}
            <Link href="/riwayat" className="underline">Riwayat inspeksi</Link>.
          </p>
          <FormMulaiInspeksi />
        </div>
      </div>
    );
  }

  const { data: daftar } = await supabase
    .from("temuan")
    .select(KOLOM_TEMUAN)
    .eq("inspeksi_id", inspeksi.id)
    .order("sta_awal_m");

  const temuan = (daftar ?? []) as unknown as BarisTemuan[];

  return (
    <div>
      {kotakGalat}

      <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#4A5568]">Inspeksi berjalan</p>
            <p className="text-lg font-semibold">
              {formatKm(inspeksi.sta_awal_m)} sampai {formatKm(inspeksi.sta_akhir_m)}
            </p>
            <p className="text-sm text-[#4A5568]">
              {inspeksi.tanggal} | {inspeksi.arah}
            </p>
            {inspeksi.pic_atasan ? (
              <p className="text-sm text-[#4A5568]">PIC: {inspeksi.pic_atasan}</p>
            ) : null}
            {inspeksi.cuaca ? (
              <p className="text-sm text-[#4A5568]">Cuaca: {inspeksi.cuaca}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]">
            {temuan.length} temuan
          </span>
        </div>

        <Link href="/catat/temuan" className={`${tombolUtama} mt-4 block text-center`}>
          Tambah temuan
        </Link>
      </div>

      <h2 className="mt-6 text-lg font-semibold">Temuan dalam sesi ini</h2>

      {temuan.length === 0 ? (
        <p className="mt-2 text-sm text-[#4A5568]">Belum ada temuan yang dicatat.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {temuan.map((t) => (
            <KartuTemuan key={t.id} t={t} kembali="/catat" />
          ))}
        </ul>
      )}

      <form action={tutupInspeksi} className="mt-6">
        <input type="hidden" name="inspeksi_id" value={inspeksi.id} />
        <button type="submit" className={tombolGaris}>Tutup inspeksi</button>
        <p className="mt-2 text-xs text-[#4A5568]">
          Menutup sesi tidak menutup temuannya. Temuan tetap berstatus Baru sampai ditangani.
        </p>
      </form>
    </div>
  );
}

export default function Catat(props: PageProps<"/catat">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#4A5568] underline">Beranda</Link>
          <Link href="/riwayat" className="text-sm font-semibold text-[#14213D] underline">
            Riwayat inspeksi
          </Link>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Catat temuan</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <IsiCatat searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
