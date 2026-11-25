import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/sta";
import { KOLOM_SESI, keteranganWaktuSesi, type BarisSesi } from "@/lib/inspeksi";
import { satu, tujuanAman } from "@/lib/param";
import { kodeTemuan } from "@/lib/temuan";
import { IsianTemuan, PILIHAN_LAINNYA, type JenisKatalog } from "../IsianTemuan";
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

  let sesi: BarisSesi | null = null;

  if (Number.isInteger(idDiminta) && idDiminta > 0) {
    // Alamat menyebut sesi tertentu
    const { data } = await supabase.from("inspeksi").select(KOLOM_SESI).eq("id", idDiminta).maybeSingle();
    sesi = data as BarisSesi | null;
  } else {
    // Alamat tidak menyebut sesi. Pakai sesi berjalan hanya kalau jumlahnya tepat satu.
    // Kalau lebih dari satu, pengguna wajib memilih, supaya temuan tidak masuk ke sesi yang salah.
    const { data } = await supabase
      .from("inspeksi")
      .select(KOLOM_SESI)
      .eq("status", "Berjalan")
      .order("tanggal", { ascending: false });
    const berjalan = (data ?? []) as BarisSesi[];

    if (berjalan.length === 1) {
      sesi = berjalan[0];
    } else if (berjalan.length > 1) {
      return (
        <div className="mt-4">
          <p className="rounded-xl bg-[#EEF1F5] px-4 py-3 text-sm text-[#2D3B52]">
            Ada {berjalan.length} sesi berjalan. Pilih sesi tujuan temuan ini.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {berjalan.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/catat/temuan?inspeksi=${b.id}&kembali=${encodeURIComponent(`/riwayat/${b.id}`)}`}
                  className="block rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
                >
                  <span className="block text-base font-semibold">
                    {formatKm(b.sta_awal_m)} sampai {formatKm(b.sta_akhir_m)}, {b.arah}
                  </span>
                  <span className="block text-sm text-[#4A5568]">{keteranganWaktuSesi(b)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }

  if (!sesi) {
    return (
      <div className="mt-4 rounded-xl border border-[#DCE2EA] bg-white p-4">
        <p className="text-sm">Belum ada sesi berjalan. Mulai sesi dulu di halaman catat.</p>
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

  // Pilihan jenis yang dibawa dari temuan sebelumnya: nomor katalog, atau ketikan manual
  const jenisDibawaTeks = satu(sp.jenis);
  const jenisManualDibawa = jenisDibawaTeks === PILIHAN_LAINNYA;
  const jenisDibawa = Number(jenisDibawaTeks);

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

      <div className="rounded-xl border-2 border-[#14213D] bg-white px-4 py-3">
        <p className="text-xs font-semibold text-[#4A5568]">Temuan ini masuk ke sesi</p>
        <p className="text-base font-semibold">
          {formatKm(sesi.sta_awal_m)} sampai {formatKm(sesi.sta_akhir_m)}, {sesi.arah}
        </p>
        <p className="text-sm text-[#4A5568]">{keteranganWaktuSesi(sesi)}</p>
      </div>

      <IsianTemuan
        katalog={(katalog ?? []) as JenisKatalog[]}
        awal={{
          jenis_temuan_id: Number.isInteger(jenisDibawa) && jenisDibawa > 0 ? jenisDibawa : null,
          jenis_lain: jenisManualDibawa ? (satu(sp.jenis_lain) ?? null) : null,
          kategori_lain: jenisManualDibawa ? (satu(sp.kategori_lain) ?? null) : null,
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
