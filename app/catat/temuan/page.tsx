import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { satu, tujuanAman } from "@/lib/param";
import { kodeTemuan } from "@/lib/temuan";
import { IsianTemuan, type JenisKatalog } from "../IsianTemuan";
import { tambahTemuan } from "../aksi";

const tombolUtama = "rounded-xl bg-[#14213D] px-4 py-3 text-sm font-semibold text-white w-full";
const tombolGaris =
  "rounded-xl border border-[#14213D] bg-white px-4 py-3 text-sm font-semibold text-[#14213D] w-full";

async function FormTambah({ searchParams }: { searchParams: PageProps<"/catat/temuan">["searchParams"] }) {
  await connection();

  const sp = await searchParams;
  const galat = satu(sp.galat);
  const tersimpan = satu(sp.tersimpan);
  const idDiminta = Number(satu(sp.inspeksi));

  const supabase = await createClient();
  const kolom = "id, tanggal, sta_awal_m, sta_akhir_m, arah, status";

  // Kalau alamat menyebut sesi tertentu, pakai sesi itu. Kalau tidak, pakai sesi yang sedang berjalan.
  const { data: sesi } =
    Number.isInteger(idDiminta) && idDiminta > 0
      ? await supabase.from("inspeksi").select(kolom).eq("id", idDiminta).maybeSingle()
      : await supabase
          .from("inspeksi")
          .select(kolom)
          .eq("status", "Berjalan")
          .order("dibuat_pada", { ascending: false })
          .limit(1)
          .maybeSingle();

  if (!sesi) {
    return (
      <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <p className="text-sm">Belum ada inspeksi berjalan. Mulai sesi dulu di halaman catat.</p>
        <Link href="/catat" className={`${tombolUtama} mt-4 block text-center`}>Ke halaman catat</Link>
      </div>
    );
  }

  const sesiDitutup = sesi.status === "Selesai";
  const kembali = tujuanAman(satu(sp.kembali), sesiDitutup ? `/riwayat/${sesi.id}` : "/catat");

  const { data: katalog } = await supabase
    .from("jenis_temuan")
    .select("id, kategori, nama, sering")
    .eq("aktif", true)
    .order("kategori")
    .order("nama");

  const jenisDibawa = Number(satu(sp.jenis));

  return (
    <form action={tambahTemuan} className="mt-4 flex flex-col gap-5">
      <input type="hidden" name="inspeksi_id" value={sesi.id} />
      <input type="hidden" name="kembali" value={kembali} />

      {tersimpan ? (
        <p className="rounded-xl border border-[#86C9A0] bg-[#DCFCE7] px-4 py-3 text-sm text-[#14532D]">
          {kodeTemuan(Number(tersimpan), new Date().toISOString())} tersimpan. Pilihan arah, lajur,
          jenis, dan tingkat dibawa ke form ini, tinggal ganti yang berbeda.
        </p>
      ) : null}

      {galat ? (
        <p className="rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
          {galat}
        </p>
      ) : null}

      {sesiDitutup ? (
        <p className="rounded-xl border border-[#C7D2FE] bg-[#E0E7FF] px-4 py-3 text-sm text-[#312E81]">
          Sesi ini sudah ditutup. Temuan yang ditambahkan akan diberi tanda
          &quot;Ditambahkan setelah sesi ditutup&quot; dan tercatat di riwayat.
        </p>
      ) : null}

      <p className="rounded-xl bg-[#EEF1F5] px-4 py-3 text-sm text-[#2D3B52]">
        Sesi {sesi.tanggal}, {formatKm(sesi.sta_awal_m)} sampai {formatKm(sesi.sta_akhir_m)}, {sesi.arah}
      </p>

      <IsianTemuan
        katalog={(katalog ?? []) as JenisKatalog[]}
        awal={{
          jenis_temuan_id: Number.isInteger(jenisDibawa) && jenisDibawa > 0 ? jenisDibawa : null,
          tingkat: satu(sp.tingkat) ?? null,
          arah: satu(sp.arah) ?? sesi.arah,
          lajur: satu(sp.lajur) ?? null,
          jumlah: 1,
        }}
      />

      <div className="flex flex-col gap-2">
        <button type="submit" name="lanjut" value="1" className={tombolUtama}>
          Simpan dan tambah lagi
        </button>
        <button type="submit" name="lanjut" value="0" className={tombolGaris}>
          Simpan dan selesai
        </button>
      </div>
    </form>
  );
}

export default function TambahTemuan(props: PageProps<"/catat/temuan">) {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-5 py-8 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/catat" className="text-sm text-[#4A5568] underline">Kembali</Link>
        <h1 className="mt-3 text-2xl font-semibold">Tambah temuan</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat katalog...</p>}>
          <FormTambah searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
