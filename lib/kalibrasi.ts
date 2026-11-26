import type { createClient } from "@/lib/supabase/server";
import { analisisKalibrasi, type Acuan, type TitikKalibrasi } from "@/lib/ruas";

type KlienSupabase = Awaited<ReturnType<typeof createClient>>;

// Mengambil titik kalibrasi aktif milik akun ini, lalu mengubahnya menjadi daftar acuan koreksi.
// Daftar ini dikirim ke tombol Ambil posisi, supaya hitungan STA bisa dilakukan langsung di HP.
export async function ambilAcuan(supabase: KlienSupabase): Promise<Acuan[]> {
  const { data } = await supabase
    .from("titik_kalibrasi")
    .select("id, arah, sta_patok_m, lat, lon, sumber, perkiraan_galat_m, aktif, catatan, dibuat_pada")
    .eq("aktif", true);

  return analisisKalibrasi((data ?? []) as TitikKalibrasi[]).acuan;
}
