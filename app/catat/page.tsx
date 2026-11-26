import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { satu } from "@/lib/param";
import { KOLOM_SESI, hariIniWib, keteranganWaktuSesi, type BarisSesi } from "@/lib/inspeksi";
import { PenandaSesi } from "@/app/komponen/PenandaSesi";
import { mulaiInspeksi } from "./aksi";

const kotak = "rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base w-full";
const label = "block text-xs font-semibold text-[#4A5568] mb-1";
const pilihan =
  "block cursor-pointer rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-center text-sm " +
  "peer-checked:border-[#14213D] peer-checked:bg-[#14213D] peer-checked:text-white";
const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";
const tombolGaris =
  "rounded-xl border border-[#14213D] bg-white px-4 py-2 text-sm font-semibold text-[#14213D]";

type SesiDenganJumlah = BarisSesi & { pic_atasan: string | null; temuan: { count: number }[] };

function FormMulaiInspeksi() {
  const hariIni = hariIniWib();

  return (
    <form action={mulaiInspeksi} className="mt-4 flex flex-col gap-4">
      <fieldset>
        <legend className={label}>Jenis sesi</legend>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <input type="radio" name="jenis_sesi" value="Harian" className="peer sr-only" defaultChecked />
            <span className={pilihan}>Harian</span>
          </label>
          <label>
            <input type="radio" name="jenis_sesi" value="Berkala" className="peer sr-only" />
            <span className={pilihan}>Berkala</span>
          </label>
        </div>
        <p className="mt-1 text-xs text-[#4A5568]">
          Harian untuk satu kegiatan satu hari. Berkala untuk inspeksi beberapa hari dengan satu laporan.
        </p>
      </fieldset>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={label} htmlFor="tanggal">Tanggal mulai</label>
          <input className={kotak} type="date" id="tanggal" name="tanggal" defaultValue={hariIni} />
        </div>
        <div className="flex-1">
          <label className={label} htmlFor="rencana_selesai">Rencana selesai (Berkala)</label>
          <input className={kotak} type="date" id="rencana_selesai" name="rencana_selesai" min={hariIni} />
        </div>
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
        <div className="grid grid-cols-2 gap-2">
          {["Arah Tangerang", "Arah Jakarta"].map((a) => (
            <label key={a}>
              <input type="radio" name="arah" value={a} className="peer sr-only" required />
              <span className={pilihan}>{a.replace("Arah ", "")}</span>
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

  const { data, error } = await supabase
    .from("inspeksi")
    .select(`${KOLOM_SESI}, pic_atasan, temuan(count)`)
    .eq("status", "Berjalan")
    .order("tanggal", { ascending: false })
    .order("dibuat_pada", { ascending: false });

  const berjalan = (data ?? []) as unknown as SesiDenganJumlah[];
  const pesanGalat = satu(sp.galat) ?? error?.message;

  return (
    <div>
      {pesanGalat ? (
        <p className="mt-4 rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
          {pesanGalat}
        </p>
      ) : null}

      <h2 className="mt-6 text-lg font-semibold">
        Sesi berjalan {berjalan.length > 0 ? `(${berjalan.length})` : ""}
      </h2>

      {berjalan.length === 0 ? (
        <p className="mt-2 text-sm text-[#4A5568]">
          Tidak ada sesi yang berjalan. Mulai sesi baru di bawah. Sesi yang sudah ditutup ada di{" "}
          <Link href="/riwayat" className="underline">Riwayat inspeksi</Link>.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {berjalan.map((s) => (
            <li key={s.id} className="rounded-xl border border-[#DCE2EA] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold">
                    {formatKm(s.sta_awal_m)} sampai {formatKm(s.sta_akhir_m)}
                  </p>
                  <p className="text-sm text-[#4A5568]">{s.arah}</p>
                  <p className="text-sm text-[#4A5568]">{keteranganWaktuSesi(s)}</p>
                  {s.pic_atasan ? <p className="text-sm text-[#4A5568]">PIC: {s.pic_atasan}</p> : null}
                  <p className="mt-1 text-sm font-semibold">{s.temuan?.[0]?.count ?? 0} temuan</p>
                </div>
                <PenandaSesi s={s} />
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/catat/temuan?inspeksi=${s.id}&kembali=${encodeURIComponent(`/riwayat/${s.id}`)}`}
                  className={`${tombolUtama} block flex-1 text-center`}
                >
                  Tambah temuan
                </Link>
                <Link href={`/riwayat/${s.id}`} className={`${tombolGaris} block text-center`}>
                  Buka sesi
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <details
        className="mt-6 rounded-xl border border-[#DCE2EA] bg-white"
        open={berjalan.length === 0}
      >
        <summary className="cursor-pointer px-4 py-3 text-base font-semibold">
          Mulai sesi inspeksi baru
        </summary>
        <div className="border-t border-[#DCE2EA] px-4 pb-4">
          <FormMulaiInspeksi />
        </div>
      </details>
    </div>
  );
}

export default function Catat(props: PageProps<"/catat">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[#4A5568] underline">Beranda</Link>
          <span className="flex gap-4">
            <Link href="/koridor" className="text-sm font-semibold text-[#14213D] underline">
              Koridor
            </Link>
            <Link href="/kalibrasi" className="text-sm font-semibold text-[#14213D] underline">
              Kalibrasi
            </Link>
            <Link href="/riwayat" className="text-sm font-semibold text-[#14213D] underline">
              Riwayat inspeksi
            </Link>
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold">Catat temuan</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <IsiCatat searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
