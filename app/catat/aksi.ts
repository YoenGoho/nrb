"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { keMeter } from "@/lib/sta";
import { tujuanAman } from "@/lib/param";
import { catatRiwayat } from "@/lib/riwayat";

// Server Action adalah fungsi yang ditulis di sini tetapi dijalankan di server
// ketika sebuah form dikirim. Isian form masuk lewat FormData.

function angka(fd: FormData, nama: string) {
  const isi = fd.get(nama);
  if (isi === null || isi === "") return null;
  const n = Number(isi);
  return Number.isFinite(n) ? n : null;
}

function teks(fd: FormData, nama: string) {
  const isi = fd.get(nama);
  if (typeof isi !== "string") return null;
  const bersih = isi.trim();
  return bersih === "" ? null : bersih;
}

function kembaliDenganGalat(tujuan: string, pesan: string): never {
  const pemisah = tujuan.includes("?") ? "&" : "?";
  redirect(`${tujuan}${pemisah}galat=${encodeURIComponent(pesan)}`);
}

function perbaruiHalaman() {
  revalidatePath("/catat", "layout");
  revalidatePath("/riwayat", "layout");
}

// Kode 23505 dari database artinya melanggar aturan unik.
// Di NRB satu-satunya aturan unik pada inspeksi adalah satu sesi berjalan per pengguna.
const KODE_UNIK = "23505";

type IsianTemuan = {
  jenis_temuan_id: number;
  tingkat: string;
  tipe_lokasi: string;
  sta_awal_m: number;
  sta_akhir_m: number | null;
  arah: string;
  lajur: string;
  panjang_m: number | null;
  lebar_m: number | null;
  jumlah: number | null;
  catatan: string | null;
};

// Membaca dan memeriksa isian temuan. Dipakai bersama oleh tambah dan ubah.
function bacaIsianTemuan(fd: FormData, asal: string): IsianTemuan {
  const jenisId = angka(fd, "jenis_temuan_id");
  const tingkat = teks(fd, "tingkat");
  const tipeLokasi = teks(fd, "tipe_lokasi") ?? "Titik";
  const arah = teks(fd, "arah");
  const lajur = teks(fd, "lajur");
  const kmAwal = angka(fd, "km_awal");
  const mAwal = angka(fd, "m_awal") ?? 0;

  if (jenisId === null || tingkat === null || arah === null || lajur === null) {
    kembaliDenganGalat(asal, "Jenis, tingkat, arah, dan lajur wajib dipilih.");
  }
  if (kmAwal === null) {
    kembaliDenganGalat(asal, "KM lokasi wajib diisi.");
  }
  if (mAwal < 0 || mAwal > 999) {
    kembaliDenganGalat(asal, "Meter harus bernilai 0 sampai 999.");
  }

  const staAwal = keMeter(kmAwal, mAwal);
  let staAkhir: number | null = null;

  if (tipeLokasi === "Rentang") {
    const kmAkhir = angka(fd, "km_akhir");
    const mAkhir = angka(fd, "m_akhir") ?? 0;
    if (kmAkhir === null) {
      kembaliDenganGalat(asal, "Untuk lokasi rentang, KM akhir wajib diisi.");
    }
    if (mAkhir < 0 || mAkhir > 999) {
      kembaliDenganGalat(asal, "Meter akhir harus bernilai 0 sampai 999.");
    }
    staAkhir = keMeter(kmAkhir, mAkhir);
    if (staAkhir < staAwal) {
      kembaliDenganGalat(asal, "STA akhir tidak boleh lebih kecil dari STA awal.");
    }
  }

  const jumlah = angka(fd, "jumlah");
  if (jumlah !== null && (jumlah < 1 || !Number.isInteger(jumlah))) {
    kembaliDenganGalat(asal, "Jumlah harus bilangan bulat, paling kecil 1.");
  }

  return {
    jenis_temuan_id: jenisId,
    tingkat,
    tipe_lokasi: tipeLokasi,
    sta_awal_m: staAwal,
    sta_akhir_m: staAkhir,
    arah,
    lajur,
    panjang_m: angka(fd, "panjang_m"),
    lebar_m: angka(fd, "lebar_m"),
    jumlah,
    catatan: teks(fd, "catatan"),
  };
}

// =========================================================
// Inspeksi
// =========================================================

export async function mulaiInspeksi(formData: FormData) {
  const kmAwal = angka(formData, "km_awal");
  const kmAkhir = angka(formData, "km_akhir");
  const arah = teks(formData, "arah");

  if (kmAwal === null || kmAkhir === null || arah === null) {
    kembaliDenganGalat("/catat", "KM awal, KM akhir, dan arah wajib diisi.");
  }
  if (kmAkhir < kmAwal) {
    kembaliDenganGalat("/catat", "KM akhir tidak boleh lebih kecil dari KM awal.");
  }

  // Kolom tanggal tidak boleh diisi null. Kalau kosong, biarkan database
  // memakai nilai bawaannya, yaitu tanggal hari ini.
  const tanggal = teks(formData, "tanggal");

  const supabase = await createClient();
  const { data: baru, error } = await supabase
    .from("inspeksi")
    .insert({
      ...(tanggal ? { tanggal } : {}),
      sta_awal_m: keMeter(kmAwal, 0),
      sta_akhir_m: keMeter(kmAkhir, 0),
      arah,
      pic_atasan: teks(formData, "pic_atasan"),
      cuaca: teks(formData, "cuaca"),
      diinput_dari: teks(formData, "diinput_dari") ?? "Lapangan",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === KODE_UNIK) {
      kembaliDenganGalat("/catat", "Masih ada sesi inspeksi yang berjalan. Tutup dulu sebelum memulai sesi baru.");
    }
    kembaliDenganGalat("/catat", `Gagal memulai inspeksi: ${error.message}`);
  }

  await catatRiwayat(supabase, "inspeksi", baru.id, "Inspeksi dimulai");

  perbaruiHalaman();
  redirect("/catat");
}

export async function tutupInspeksi(formData: FormData) {
  const inspeksiId = angka(formData, "inspeksi_id");
  if (inspeksiId === null) {
    kembaliDenganGalat("/catat", "Inspeksi tidak dikenali.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inspeksi")
    .update({ status: "Selesai", ditutup_pada: new Date().toISOString() })
    .eq("id", inspeksiId)
    .eq("status", "Berjalan");

  if (error) {
    kembaliDenganGalat("/catat", `Gagal menutup inspeksi: ${error.message}`);
  }

  await catatRiwayat(supabase, "inspeksi", inspeksiId, "Inspeksi ditutup");

  perbaruiHalaman();
  // Langsung tampilkan sesi yang barusan ditutup, supaya jelas datanya tidak hilang
  redirect(`/riwayat/${inspeksiId}`);
}

export async function bukaKembaliInspeksi(formData: FormData) {
  const inspeksiId = angka(formData, "inspeksi_id");
  if (inspeksiId === null) {
    kembaliDenganGalat("/riwayat", "Inspeksi tidak dikenali.");
  }
  const asal = `/riwayat/${inspeksiId}`;
  const alasan = teks(formData, "alasan");

  const supabase = await createClient();
  const { error } = await supabase
    .from("inspeksi")
    .update({ status: "Berjalan", ditutup_pada: null })
    .eq("id", inspeksiId)
    .eq("status", "Selesai");

  if (error) {
    if (error.code === KODE_UNIK) {
      kembaliDenganGalat(asal, "Masih ada sesi lain yang berjalan. Tutup sesi itu dulu sebelum membuka kembali sesi ini.");
    }
    kembaliDenganGalat(asal, `Gagal membuka kembali: ${error.message}`);
  }

  await catatRiwayat(
    supabase,
    "inspeksi",
    inspeksiId,
    "Inspeksi dibuka kembali",
    alasan ? `Alasan: ${alasan}` : "Tanpa alasan tertulis",
  );

  perbaruiHalaman();
  redirect("/catat");
}

// =========================================================
// Temuan
// =========================================================

export async function tambahTemuan(formData: FormData) {
  const inspeksiId = angka(formData, "inspeksi_id");
  const kembali = tujuanAman(teks(formData, "kembali"), "/catat");

  if (inspeksiId === null) {
    kembaliDenganGalat("/catat", "Sesi inspeksi tidak dikenali.");
  }
  const asal = `/catat/temuan?inspeksi=${inspeksiId}&kembali=${encodeURIComponent(kembali)}`;
  const isian = bacaIsianTemuan(formData, asal);

  const supabase = await createClient();
  const { data: sesi } = await supabase
    .from("inspeksi")
    .select("id, status")
    .eq("id", inspeksiId)
    .maybeSingle();

  if (!sesi) {
    kembaliDenganGalat(asal, "Sesi inspeksi tidak ditemukan.");
  }

  const setelahTutup = sesi.status === "Selesai";

  const { data: baru, error } = await supabase
    .from("temuan")
    .insert({ ...isian, inspeksi_id: inspeksiId, ditambahkan_setelah_tutup: setelahTutup })
    .select("id")
    .single();

  if (error) {
    kembaliDenganGalat(asal, `Gagal menyimpan temuan: ${error.message}`);
  }

  if (setelahTutup) {
    await catatRiwayat(
      supabase,
      "inspeksi",
      inspeksiId,
      "Temuan ditambahkan setelah sesi ditutup",
      `Temuan nomor ${baru.id}`,
    );
  }

  perbaruiHalaman();

  // Tombol "Simpan dan tambah lagi" mengirim lanjut=1.
  // Arah, lajur, jenis, dan tingkat dibawa ke form berikutnya.
  if (formData.get("lanjut") === "1") {
    const q = new URLSearchParams({
      inspeksi: String(inspeksiId),
      kembali,
      jenis: String(isian.jenis_temuan_id),
      tingkat: isian.tingkat,
      arah: isian.arah,
      lajur: isian.lajur,
      tersimpan: String(baru.id),
    });
    redirect(`/catat/temuan?${q.toString()}`);
  }

  redirect(kembali);
}

const NAMA_KOLOM: Record<keyof IsianTemuan, string> = {
  jenis_temuan_id: "jenis",
  tingkat: "tingkat",
  tipe_lokasi: "bentuk lokasi",
  sta_awal_m: "STA awal",
  sta_akhir_m: "STA akhir",
  arah: "arah",
  lajur: "lajur",
  panjang_m: "panjang",
  lebar_m: "lebar",
  jumlah: "jumlah",
  catatan: "catatan",
};

export async function ubahTemuan(formData: FormData) {
  const temuanId = angka(formData, "temuan_id");
  const kembali = tujuanAman(teks(formData, "kembali"), "/riwayat");

  if (temuanId === null) {
    kembaliDenganGalat(kembali, "Temuan tidak dikenali.");
  }
  const asal = `/catat/temuan/${temuanId}?kembali=${encodeURIComponent(kembali)}`;
  const isian = bacaIsianTemuan(formData, asal);

  const supabase = await createClient();
  const { data: lama } = await supabase
    .from("temuan")
    .select("jenis_temuan_id, tingkat, tipe_lokasi, sta_awal_m, sta_akhir_m, arah, lajur, panjang_m, lebar_m, jumlah, catatan")
    .eq("id", temuanId)
    .maybeSingle();

  if (!lama) {
    kembaliDenganGalat(kembali, "Temuan tidak ditemukan.");
  }

  // Bandingkan nilai lama dan baru, supaya yang tercatat hanya yang benar-benar berubah
  const kosong = (v: unknown) => (v === null || v === undefined || v === "" ? "kosong" : String(v));
  const kolomBerubah = (Object.keys(isian) as (keyof IsianTemuan)[]).filter(
    (k) => kosong(lama[k]) !== kosong(isian[k]),
  );

  // Jenis disimpan sebagai nomor. Supaya riwayat mudah dibaca, nomornya diganti nama.
  const namaJenisMenurutId = new Map<number, string>();
  if (kolomBerubah.includes("jenis_temuan_id")) {
    const { data: jenis } = await supabase
      .from("jenis_temuan")
      .select("id, nama")
      .in("id", [lama.jenis_temuan_id, isian.jenis_temuan_id]);
    for (const j of jenis ?? []) namaJenisMenurutId.set(j.id, j.nama);
  }
  const tampil = (k: keyof IsianTemuan, v: unknown) =>
    k === "jenis_temuan_id" ? (namaJenisMenurutId.get(Number(v)) ?? kosong(v)) : kosong(v);

  const perubahan = kolomBerubah.map(
    (k) => `${NAMA_KOLOM[k]}: ${tampil(k, lama[k])} menjadi ${tampil(k, isian[k])}`,
  );

  if (perubahan.length === 0) {
    redirect(kembali);
  }

  const { error } = await supabase.from("temuan").update(isian).eq("id", temuanId);

  if (error) {
    kembaliDenganGalat(asal, `Gagal menyimpan perubahan: ${error.message}`);
  }

  await catatRiwayat(supabase, "temuan", temuanId, "Temuan diubah", perubahan.join("; "));

  perbaruiHalaman();
  redirect(kembali);
}
