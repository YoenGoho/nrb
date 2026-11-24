import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Halaman ini dijaga oleh proxy.ts. Pengunjung yang belum login
// dikembalikan ke beranda sebelum halaman ini sempat dibuka.
async function IsiCatat() {
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const pengguna = data?.claims;

  return (
    <div className="mt-6 rounded-xl border border-[#DCE2EA] bg-white px-4 py-4">
      <p className="text-sm text-[#4A5568]">Masuk sebagai</p>
      <p className="text-base font-semibold">{pengguna?.email ?? "tidak diketahui"}</p>
      <p className="mt-4 text-sm leading-6 text-[#4A5568]">
        Halaman ini nanti berisi formulir pencatatan temuan: jenis kerusakan,
        tingkat kerusakan, posisi STA, arah, lajur, dan foto.
      </p>
    </div>
  );
}

export default function Catat() {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] px-6 py-10 text-[#14213D]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-[#4A5568] underline">
          Kembali ke beranda
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Catat temuan</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-[#4A5568]">Memuat...</p>}>
          <IsiCatat />
        </Suspense>
      </div>
    </main>
  );
}
