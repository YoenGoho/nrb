"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { angka, kembaliDenganGalat, teks } from "@/lib/form";
import { keMeter, formatSta } from "@/lib/sta";
import { bacaKoordinat } from "@/lib/koordinat";
import { proyeksikan, type Arah } from "@/lib/ruas";
import { catatRiwayat } from "@/lib/riwayat";

const HALAMAN = "/kalibrasi";

// Titik yang lebih jauh dari ini dari garis arahnya hampir pasti salah tempel,
// misalnya tautan tempat lain atau arah yang tertukar. Ditolak, bukan sekadar ditandai.
const TOLAK_JIKA_LEBIH_DARI_M = 300;

export async function tambahTitikKalibrasi(formData: FormData) {
  const arah = teks(formData, "arah");
  const km = angka(formData, "km");
  const meter = angka(formData, "meter") ?? 0;
  const tempelan = teks(formData, "lokasi");
  const sumber = teks(formData, "sumber") ?? "Street View";
  const galat = angka(formData, "perkiraan_galat_m");

  if (arah !== "Arah Tangerang" && arah !== "Arah Jakarta") {
    kembaliDenganGalat(HALAMAN, "Arah wajib dipilih.");
  }
  if (km === null || km < 0 || km > 30 || !Number.isInteger(km)) {
    kembaliDenganGalat(HALAMAN, "KM patok wajib diisi, bilangan bulat 0 sampai 30.");
  }
  if (meter < 0 || meter > 999) {
    kembaliDenganGalat(HALAMAN, "Meter patok harus 0 sampai 999.");
  }
  if (sumber !== "Street View" && sumber !== "GPS lapangan") {
    kembaliDenganGalat(HALAMAN, "Sumber tidak dikenali.");
  }
  if (tempelan === null) {
    kembaliDenganGalat(HALAMAN, "Tempel tautan Street View atau koordinat lokasi patok.");
  }

  const lokasi = bacaKoordinat(tempelan);
  if (!lokasi) {
    kembaliDenganGalat(
      HALAMAN,
      "Koordinat tidak terbaca. Tempel kode sematan Street View, alamat Street View, atau angka seperti -6.2, 106.7.",
    );
  }

  const proyeksi = proyeksikan(arah as Arah, lokasi.lat, lokasi.lon);
  if (proyeksi.jarakM > TOLAK_JIKA_LEBIH_DARI_M) {
    kembaliDenganGalat(
      HALAMAN,
      `Lokasi ini ${Math.round(proyeksi.jarakM)} m dari garis ${arah}. Periksa tautan dan arahnya.`,
    );
  }

  const staPatok = keMeter(km, meter);

  const supabase = await createClient();
  const { data: baru, error } = await supabase
    .from("titik_kalibrasi")
    .insert({
      arah,
      sta_patok_m: staPatok,
      lat: lokasi.lat,
      lon: lokasi.lon,
      sumber,
      perkiraan_galat_m: galat,
      catatan: teks(formData, "catatan"),
    })
    .select("id")
    .single();

  if (error) {
    kembaliDenganGalat(HALAMAN, `Gagal menyimpan titik: ${error.message}`);
  }

  await catatRiwayat(
    supabase,
    "titik_kalibrasi",
    baru.id,
    "Titik kalibrasi ditambahkan",
    `${arah}, patok ${formatSta(staPatok)}, dibaca dari ${lokasi.bentuk}`,
  );

  revalidatePath(HALAMAN);
  redirect(`${HALAMAN}?tersimpan=${baru.id}`);
}

export async function ubahStatusTitik(formData: FormData) {
  const id = angka(formData, "id");
  const aktifkan = teks(formData, "aktifkan") === "1";
  const alasan = teks(formData, "alasan");

  if (id === null) {
    kembaliDenganGalat(HALAMAN, "Titik tidak dikenali.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("titik_kalibrasi").update({ aktif: aktifkan }).eq("id", id);

  if (error) {
    kembaliDenganGalat(HALAMAN, `Gagal mengubah status: ${error.message}`);
  }

  await catatRiwayat(
    supabase,
    "titik_kalibrasi",
    id,
    aktifkan ? "Titik kalibrasi diaktifkan" : "Titik kalibrasi dinonaktifkan",
    alasan ? `Alasan: ${alasan}` : "Tanpa alasan tertulis",
  );

  revalidatePath(HALAMAN);
  redirect(HALAMAN);
}

// Tujuh titik hasil survei Street View tanggal 25 November 2026.
// Hanya bisa diimpor kalau akun ini belum punya titik kalibrasi sama sekali.
const TITIK_AWAL = [
  { arah: "Arah Jakarta", sta_patok_m: 400, lat: -6.18223317215568, lon: 106.7932934681536, galat: null, aktif: false,
    catatan: "Posisi kamera 78 m dari garis, di luar ujung data OpenStreetMap (bagian Simpang Susun Tomang)." },
  { arah: "Arah Tangerang", sta_patok_m: 10000, lat: -6.198585528258416, lon: 106.7107022270508, galat: null, aktif: true, catatan: null },
  { arah: "Arah Jakarta", sta_patok_m: 13800, lat: -6.214003623521378, lon: 106.6805805989091, galat: 1, aktif: true, catatan: null },
  { arah: "Arah Tangerang", sta_patok_m: 19600, lat: -6.223455679549181, lon: 106.6291186162322, galat: null, aktif: true,
    catatan: "Dekat Jembatan Cisadane." },
  { arah: "Arah Tangerang", sta_patok_m: 20200, lat: -6.224178881019003, lon: 106.6235658133947, galat: 1, aktif: true, catatan: null },
  { arah: "Arah Tangerang", sta_patok_m: 25800, lat: -6.221764129605554, lon: 106.5754157630431, galat: 2, aktif: false,
    catatan: "Bertentangan dengan patok 26+405. Menunggu titik tambahan KM 21 sampai 25." },
  { arah: "Arah Tangerang", sta_patok_m: 26405, lat: -6.221038429989382, lon: 106.5688532045498, galat: 5, aktif: false,
    catatan: "Bertentangan dengan patok 25+800. Menunggu titik tambahan KM 21 sampai 25." },
];

export async function imporTitikAwal() {
  const supabase = await createClient();

  const { count } = await supabase.from("titik_kalibrasi").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    kembaliDenganGalat(HALAMAN, "Titik kalibrasi sudah ada, impor titik awal hanya untuk daftar yang masih kosong.");
  }

  const { data, error } = await supabase
    .from("titik_kalibrasi")
    .insert(
      TITIK_AWAL.map((t) => ({
        arah: t.arah,
        sta_patok_m: t.sta_patok_m,
        lat: t.lat,
        lon: t.lon,
        sumber: "Street View",
        perkiraan_galat_m: t.galat,
        aktif: t.aktif,
        catatan: t.catatan ? `Survei Street View 25 Nov 2026. ${t.catatan}` : "Survei Street View 25 Nov 2026.",
      })),
    )
    .select("id");

  if (error) {
    kembaliDenganGalat(HALAMAN, `Gagal mengimpor titik awal: ${error.message}`);
  }

  for (const baris of data ?? []) {
    await catatRiwayat(supabase, "titik_kalibrasi", baris.id, "Diimpor dari survei Street View 25 Nov 2026");
  }

  revalidatePath(HALAMAN);
  redirect(HALAMAN);
}
