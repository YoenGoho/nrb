import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { satu, tujuanAman } from "@/lib/param";
import { KOLOM_TEMUAN, kodeTemuan, namaJenis, type BarisTemuan } from "@/lib/temuan";
import { DaftarRiwayatAksi, type BarisRiwayat } from "@/app/komponen/DaftarRiwayatAksi";
import { IsianTemuan, type JenisKatalog } from "../../IsianTemuan";
import { ubahTemuan } from "../../aksi";

const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";

async function FormUbah({ params, searchParams }: {
  params: PageProps<"/catat/temuan/[id]">["params"];
  searchParams: PageProps<"/catat/temuan/[id]">["searchParams"];
}) {
  await connection();

  const { id } = await params;
  const sp = await searchParams;
  const galat = satu(sp.galat);
  const kembali = tujuanAman(satu(sp.kembali), "/riwayat");
  const temuanId = Number(id);

  const supabase = await createClient();
  const { data } = Number.isInteger(temuanId)
    ? await supabase.from("temuan").select(KOLOM_TEMUAN).eq("id", temuanId).maybeSingle()
    : { data: null };

  const t = data as unknown as BarisTemuan | null;

  if (!t) {
    return (
      <p className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4 text-sm">
        Temuan tidak ditemukan, atau bukan milik akun ini.
      </p>
    );
  }

  const [{ data: katalog }, { data: riwayat }] = await Promise.all([
    supabase
      .from("jenis_temuan")
      .select("id, kategori, nama, sering")
      .eq("aktif", true)
      .order("kategori")
      .order("nama"),
    supabase
      .from("riwayat_aksi")
      .select("id, aksi, keterangan, dibuat_pada")
      .eq("tabel", "temuan")
      .eq("baris_id", t.id)
      .order("dibuat_pada", { ascending: false }),
  ]);

  return (
    <div>
      <p className="mt-2 font-mono text-sm text-[#4A5568]">{kodeTemuan(t.id, t.dibuat_pada)}</p>
      <p className="text-base font-semibold">{namaJenis(t)}</p>

      <form action={ubahTemuan} className="mt-4 flex flex-col gap-5">
        <input type="hidden" name="temuan_id" value={t.id} />
        <input type="hidden" name="kembali" value={kembali} />

        {galat ? (
          <p className="rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
            {galat}
          </p>
        ) : null}

        <IsianTemuan katalog={(katalog ?? []) as JenisKatalog[]} awal={t} />

        <button type="submit" className={tombolUtama}>Simpan perubahan</button>
        <p className="-mt-3 text-xs text-[#4A5568]">
          Setiap perubahan tercatat di riwayat temuan ini, lengkap dengan nilai lama dan nilai baru.
        </p>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Riwayat temuan</h2>
      <DaftarRiwayatAksi baris={(riwayat ?? []) as BarisRiwayat[]} />
    </div>
  );
}

export default function UbahTemuan(props: PageProps<"/catat/temuan/[id]">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/riwayat" className="text-sm text-[#4A5568] underline">Riwayat inspeksi</Link>
        <h1 className="mt-3 text-2xl font-semibold">Ubah temuan</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <FormUbah params={props.params} searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
