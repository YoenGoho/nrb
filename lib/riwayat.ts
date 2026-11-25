import type { createClient } from "@/lib/supabase/server";

type KlienSupabase = Awaited<ReturnType<typeof createClient>>;

// Menulis satu baris ke tabel riwayat_aksi.
// Kalau penulisan riwayat gagal, tindakan utamanya tidak dibatalkan,
// tetapi kegagalan dicatat di log server supaya bisa ditelusuri.
export async function catatRiwayat(
  supabase: KlienSupabase,
  tabel: "inspeksi" | "temuan",
  barisId: number,
  aksi: string,
  keterangan?: string | null,
) {
  const { error } = await supabase.from("riwayat_aksi").insert({
    tabel,
    baris_id: barisId,
    aksi,
    keterangan: keterangan ?? null,
  });
  if (error) {
    console.error(`Gagal mencatat riwayat ${tabel} ${barisId}: ${error.message}`);
  }
}
