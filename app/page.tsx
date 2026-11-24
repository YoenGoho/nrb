import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TombolMasukGoogle } from "@/app/komponen/TombolMasukGoogle";
import { TombolKeluar } from "@/app/komponen/TombolKeluar";

const tahapan = [
  { sesi: "Sesi 1", judul: "Alat dan folder siap", selesai: true },
  { sesi: "Sesi 2", judul: "Proyek jalan di laptop, lalu simpan ke GitHub", selesai: true },
  { sesi: "Sesi 3", judul: "Tayang online lewat Vercel", selesai: true },
  { sesi: "Sesi 4", judul: "Database Supabase dan daftar gerbang", selesai: true },
  { sesi: "Sesi 5", judul: "Login Google dan pasang di HP", selesai: false },
];

type Gerbang = {
  id: number;
  nama: string;
  jenis: string;
  sta_m: number;
};

// Ubah meter jadi format STA, contoh 19600 menjadi 19+600
function formatSta(meter: number) {
  const km = Math.floor(meter / 1000);
  const sisa = meter % 1000;
  return `${km}+${String(sisa).padStart(3, "0")}`;
}

// Tampilkan tombol masuk, atau nama pengguna kalau sudah login
async function StatusMasuk() {
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const pengguna = data?.claims;

  if (!pengguna) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <TombolMasukGoogle />
        <span className="text-sm text-[#C9D3E3]">
          Masuk untuk membuka halaman pencatatan.
        </span>
      </div>
    );
  }

  const nama =
    (pengguna.user_metadata as { full_name?: string } | undefined)?.full_name ??
    pengguna.email ??
    "Pengguna";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <span className="text-sm text-[#E3E8F0]">Masuk sebagai {nama}</span>
      <Link
        href="/catat"
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#14213D]"
      >
        Buka halaman catat
      </Link>
      <TombolKeluar />
    </div>
  );
}

// Baca tabel gerbang dari Supabase setiap kali halaman dibuka
async function DaftarGerbang() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gerbang")
    .select("id, nama, jenis, sta_m")
    .order("sta_m");

  if (error) {
    return (
      <p className="mt-4 rounded-xl border border-[#F5C2C0] bg-[#FDECEC] px-4 py-3 text-sm text-[#7A1C1C]">
        Gagal memuat daftar gerbang: {error.message}
      </p>
    );
  }

  const gerbang = (data ?? []) as Gerbang[];

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {gerbang.map((g) => (
        <li
          key={g.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
        >
          <span>
            <span className="block text-base">{g.nama}</span>
            <span className="block text-xs text-[#4A5568]">{g.jenis}</span>
          </span>
          <span className="font-mono text-sm font-semibold">{formatSta(g.sta_m)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] text-[#14213D]">
      <section className="bg-[#14213D] px-6 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[#C9D3E3]">Mulai dibangun 23 November 2026</p>
          <h1 className="mt-2 text-4xl font-semibold">NRB</h1>
          <p className="mt-1 text-lg text-[#E3E8F0]">Nugroho Road Bridge</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#E3E8F0]">
            Aplikasi pencatatan inspeksi dan pemeliharaan jalan tol, mulai dari
            ruas Tomang sampai Bitung.
          </p>
          <Suspense
            fallback={<p className="mt-6 text-sm text-[#C9D3E3]">Memeriksa status masuk...</p>}
          >
            <StatusMasuk />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-8">
        <h2 className="text-lg font-semibold">Progres pembangunan</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {tahapan.map((t) => (
            <li
              key={t.sesi}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
            >
              <span>
                <span className="block text-xs font-semibold text-[#4A5568]">{t.sesi}</span>
                <span className="block text-base">{t.judul}</span>
              </span>
              <span
                className={
                  t.selesai
                    ? "rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]"
                    : "rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]"
                }
              >
                {t.selesai ? "Selesai" : "Berikutnya"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-10">
        <h2 className="text-lg font-semibold">Titik referensi ruas Tomang sampai Bitung</h2>
        <p className="mt-1 text-sm text-[#4A5568]">
          Dibaca langsung dari database Supabase. Posisi masih perkiraan dari data publik.
        </p>
        <Suspense fallback={<p className="mt-4 text-sm text-[#4A5568]">Memuat daftar gerbang...</p>}>
          <DaftarGerbang />
        </Suspense>
      </section>
    </main>
  );
}
