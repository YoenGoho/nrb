"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatSta, keMeter } from "@/lib/sta";
import { tujuanAman } from "@/lib/param";
import { angka, kembaliDenganGalat, teks } from "@/lib/form";
import { catatRiwayat } from "@/lib/riwayat";
import { KATEGORI_LAIN, lokasiTemuan, rapikanNama, seragamkanNama } from "@/lib/temuan";
import { formatWaktu, TOLERANSI_MASA_DEPAN_MS } from "@/lib/waktu";
import { PILIHAN_LAINNYA } from "./IsianTemuan";

// Server Action adalah fungsi yang ditulis di sini tetapi dijalankan di server
// ketika sebuah form dikirim. Isian form masuk lewat FormData.


function perbaruiHalaman() {
  revalidatePath("/catat", "layout");
  revalidatePath("/riwayat", "layout");
}

type IsianTemuan = {
  jenis_temuan_id: number | null;
  jenis_lain: string | null;
  kategori_lain: string | null;
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
  ditemukan_pada: string;
};

type KlienSupabase = Awaited<ReturnType<typeof createClient>>;

// Hasil pembacaan jenis: dari katalog, atau ketikan manual.
// cocokKatalog terisi kalau ketikan manual ternyata sama dengan nama di katalog.
type HasilJenis = {
  jenis_temuan_id: number | null;
  jenis_lain: string | null;
  kategori_lain: string | null;
  cocokKatalog: { diketik: string; nama: string } | null;
};

async function bacaJenis(fd: FormData, asal: string, supabase: KlienSupabase): Promise<HasilJenis> {
  const pilihanJenis = teks(fd, "jenis_temuan_id");
  if (pilihanJenis === null) {
    kembaliDenganGalat(asal, "Jenis temuan wajib dipilih.");
  }

  // Jalur katalog: nilai radionya nomor jenis
  if (pilihanJenis !== PILIHAN_LAINNYA) {
    const id = Number(pilihanJenis);
    if (!Number.isInteger(id) || id <= 0) {
      kembaliDenganGalat(asal, "Jenis temuan tidak dikenali.");
    }
    return { jenis_temuan_id: id, jenis_lain: null, kategori_lain: null, cocokKatalog: null };
  }

  // Jalur manual
  const diketik = teks(fd, "jenis_lain");
  const kategori = teks(fd, "kategori_lain");
  if (diketik === null || diketik.length < 2) {
    kembaliDenganGalat(asal, "Pilihan Lainnya: nama jenis wajib diketik, paling sedikit 2 huruf.");
  }
  if (diketik.length > 80) {
    kembaliDenganGalat(asal, "Nama jenis paling panjang 80 huruf.");
  }

  const { data: katalog } = await supabase.from("jenis_temuan").select("id, nama, kategori");
  const daftar = katalog ?? [];

  // Penjaga salah ketik lapis 2: kalau namanya sudah ada di katalog, pakai yang di katalog.
  // Kalau nama yang sama ada di beberapa kategori, utamakan kategori yang dipilih pengguna.
  const kembar = daftar.filter((j) => seragamkanNama(j.nama) === seragamkanNama(diketik));
  const pilihanKembar = kembar.find((j) => j.kategori === kategori) ?? kembar[0];
  if (pilihanKembar) {
    return {
      jenis_temuan_id: pilihanKembar.id,
      jenis_lain: null,
      kategori_lain: null,
      cocokKatalog: { diketik, nama: `${pilihanKembar.nama} (${pilihanKembar.kategori})` },
    };
  }

  // Kategori harus salah satu kategori katalog, atau Lain-lain
  const kategoriSah = new Set([...daftar.map((j) => j.kategori), KATEGORI_LAIN]);
  if (kategori === null || !kategoriSah.has(kategori)) {
    kembaliDenganGalat(asal, "Pilihan Lainnya: kategori wajib dipilih.");
  }

  return { jenis_temuan_id: null, jenis_lain: rapikanNama(diketik), kategori_lain: kategori, cocokKatalog: null };
}

// Membaca dan memeriksa isian temuan. Dipakai bersama oleh tambah dan ubah.
async function bacaIsianTemuan(
  fd: FormData,
  asal: string,
  supabase: KlienSupabase,
): Promise<{ isian: IsianTemuan; cocokKatalog: HasilJenis["cocokKatalog"] }> {
  const tingkat = teks(fd, "tingkat");
  const tipeLokasi = teks(fd, "tipe_lokasi") ?? "Titik";
  const arah = teks(fd, "arah");
  const lajur = teks(fd, "lajur");
  const kmAwal = angka(fd, "km_awal");
  const mAwal = angka(fd, "m_awal") ?? 0;

  if (tingkat === null || arah === null || lajur === null) {
    kembaliDenganGalat(asal, "Tingkat, arah, dan lajur wajib dipilih.");
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

  // Waktu ditemukan: dikirim isian tersembunyi dalam format ISO, lengkap sampai detik.
  // Kalau kosong (misalnya halaman lama), dipakai waktu sekarang.
  const teksDitemukan = teks(fd, "ditemukan_pada");
  const ditemukan = teksDitemukan ? new Date(teksDitemukan) : new Date();
  if (Number.isNaN(ditemukan.getTime())) {
    kembaliDenganGalat(asal, "Waktu ditemukan tidak terbaca.");
  }
  if (ditemukan.getTime() > Date.now() + TOLERANSI_MASA_DEPAN_MS) {
    kembaliDenganGalat(asal, "Waktu ditemukan tidak boleh di masa depan. Periksa tanggal dan jamnya.");
  }

  const jumlah = angka(fd, "jumlah");
  if (jumlah !== null && (jumlah < 1 || !Number.isInteger(jumlah))) {
    kembaliDenganGalat(asal, "Jumlah harus bilangan bulat, paling kecil 1.");
  }

  const { cocokKatalog, ...jenis } = await bacaJenis(fd, asal, supabase);

  const isian: IsianTemuan = {
    ...jenis,
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
    ditemukan_pada: ditemukan.toISOString(),
  };

  return { isian, cocokKatalog };
}

// Posisi GPS yang dikirim tombol Ambil posisi bersama form temuan
type IsianGps = {
  gps_lat: number;
  gps_lon: number;
  gps_akurasi_m: number;
  gps_sta_m: number;
  gps_diambil_pada: string;
};

// Membaca posisi GPS dari form. Hasilnya null kalau tombol GPS tidak dipakai,
// atau kalau isiannya tidak masuk akal (posisi semacam itu tidak disimpan).
function bacaGps(fd: FormData): IsianGps | null {
  if (teks(fd, "gps_baru") !== "1") return null;

  const lat = angka(fd, "gps_lat");
  const lon = angka(fd, "gps_lon");
  const akurasi = angka(fd, "gps_akurasi_m");
  const sta = angka(fd, "gps_sta_m");
  const waktu = new Date(teks(fd, "gps_diambil_pada") ?? "");

  if (lat === null || lon === null || akurasi === null || sta === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180 || akurasi < 0 || sta < 0) return null;
  if (Number.isNaN(waktu.getTime())) return null;

  return {
    gps_lat: lat,
    gps_lon: lon,
    gps_akurasi_m: Math.round(akurasi * 10) / 10,
    gps_sta_m: Math.round(sta),
    gps_diambil_pada: waktu.toISOString(),
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

  const jenisSesi = teks(formData, "jenis_sesi") ?? "Harian";
  if (jenisSesi !== "Harian" && jenisSesi !== "Berkala") {
    kembaliDenganGalat("/catat", "Jenis sesi tidak dikenali.");
  }
  const rencanaSelesai = jenisSesi === "Berkala" ? teks(formData, "rencana_selesai") : null;
  if (jenisSesi === "Berkala" && rencanaSelesai === null) {
    kembaliDenganGalat("/catat", "Sesi Berkala wajib punya tanggal rencana selesai.");
  }
  if (rencanaSelesai !== null && tanggal !== null && rencanaSelesai < tanggal) {
    kembaliDenganGalat("/catat", "Tanggal rencana selesai tidak boleh sebelum tanggal mulai.");
  }

  const supabase = await createClient();
  const { data: baru, error } = await supabase
    .from("inspeksi")
    .insert({
      ...(tanggal ? { tanggal } : {}),
      sta_awal_m: keMeter(kmAwal, 0),
      sta_akhir_m: keMeter(kmAkhir, 0),
      arah,
      jenis_sesi: jenisSesi,
      rencana_selesai: rencanaSelesai,
      pic_atasan: teks(formData, "pic_atasan"),
      cuaca: teks(formData, "cuaca"),
      diinput_dari: teks(formData, "diinput_dari") ?? "Lapangan",
    })
    .select("id")
    .single();

  if (error) {
    kembaliDenganGalat("/catat", `Gagal memulai inspeksi: ${error.message}`);
  }

  await catatRiwayat(
    supabase,
    "inspeksi",
    baru.id,
    "Inspeksi dimulai",
    jenisSesi === "Berkala" ? `Berkala, rencana selesai ${rencanaSelesai}` : "Harian",
  );

  perbaruiHalaman();
  // Langsung ke halaman kerja sesi yang baru dibuat
  redirect(`/riwayat/${baru.id}`);
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
  redirect(`/riwayat/${inspeksiId}`);
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

  const supabase = await createClient();
  const { isian, cocokKatalog } = await bacaIsianTemuan(formData, asal, supabase);
  const gps = bacaGps(formData);

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
    .insert({ ...isian, ...gps, inspeksi_id: inspeksiId, ditambahkan_setelah_tutup: setelahTutup })
    .select("id")
    .single();

  if (error) {
    kembaliDenganGalat(asal, `Gagal menyimpan temuan: ${error.message}`);
  }

  // Setiap temuan baru tercatat di buku riwayat, supaya kalender cukup membaca satu tabel
  let namaJenisBaru = isian.jenis_lain;
  if (namaJenisBaru === null && isian.jenis_temuan_id !== null) {
    const { data: j } = await supabase.from("jenis_temuan").select("nama").eq("id", isian.jenis_temuan_id).maybeSingle();
    namaJenisBaru = j?.nama ?? null;
  }
  await catatRiwayat(
    supabase,
    "temuan",
    baru.id,
    "Temuan ditambahkan",
    `${namaJenisBaru ?? "Jenis tidak dikenali"}, ${isian.tingkat}, ${lokasiTemuan(isian)} ${isian.arah}, ` +
      `ditemukan ${formatWaktu(isian.ditemukan_pada)}${gps ? ", posisi dari GPS" : ""}`,
  );

  if (cocokKatalog) {
    await catatRiwayat(
      supabase,
      "temuan",
      baru.id,
      "Jenis dicocokkan dengan katalog",
      `Diketik "${cocokKatalog.diketik}", disimpan sebagai ${cocokKatalog.nama}`,
    );
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
      jenis: isian.jenis_temuan_id !== null ? String(isian.jenis_temuan_id) : PILIHAN_LAINNYA,
      ...(isian.jenis_lain ? { jenis_lain: isian.jenis_lain } : {}),
      ...(isian.kategori_lain ? { kategori_lain: isian.kategori_lain } : {}),
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
  jenis_temuan_id: "jenis katalog",
  jenis_lain: "jenis manual",
  kategori_lain: "kategori manual",
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
  ditemukan_pada: "waktu ditemukan",
};

export async function ubahTemuan(formData: FormData) {
  const temuanId = angka(formData, "temuan_id");
  const kembali = tujuanAman(teks(formData, "kembali"), "/riwayat");

  if (temuanId === null) {
    kembaliDenganGalat(kembali, "Temuan tidak dikenali.");
  }
  const asal = `/catat/temuan/${temuanId}?kembali=${encodeURIComponent(kembali)}`;

  const supabase = await createClient();
  const { isian, cocokKatalog } = await bacaIsianTemuan(formData, asal, supabase);
  const gps = bacaGps(formData);

  const { data: lama } = await supabase
    .from("temuan")
    .select("jenis_temuan_id, jenis_lain, kategori_lain, tingkat, tipe_lokasi, sta_awal_m, sta_akhir_m, arah, lajur, panjang_m, lebar_m, jumlah, catatan, ditemukan_pada")
    .eq("id", temuanId)
    .maybeSingle();

  if (!lama) {
    kembaliDenganGalat(kembali, "Temuan tidak ditemukan.");
  }

  // Waktu dari database dan dari form ditulis dengan gaya berbeda ("+00:00" dan "Z"),
  // jadi dibandingkan sebagai angka milidetik. Kalau sama, pakai nilai lama apa adanya.
  if (new Date(lama.ditemukan_pada).getTime() === new Date(isian.ditemukan_pada).getTime()) {
    isian.ditemukan_pada = lama.ditemukan_pada;
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
      .in(
        "id",
        [lama.jenis_temuan_id, isian.jenis_temuan_id].filter((v): v is number => typeof v === "number"),
      );
    for (const j of jenis ?? []) namaJenisMenurutId.set(j.id, j.nama);
  }
  const tampil = (k: keyof IsianTemuan, v: unknown) => {
    if (k === "jenis_temuan_id") return namaJenisMenurutId.get(Number(v)) ?? kosong(v);
    if (k === "ditemukan_pada" && typeof v === "string") return formatWaktu(v);
    return kosong(v);
  };

  const perubahan = kolomBerubah.map(
    (k) => `${NAMA_KOLOM[k]}: ${tampil(k, lama[k])} menjadi ${tampil(k, isian[k])}`,
  );

  // Tidak ada yang berubah dan GPS tidak diambil ulang: langsung kembali tanpa menyimpan
  if (perubahan.length === 0 && gps === null) {
    redirect(kembali);
  }

  const { error } = await supabase.from("temuan").update({ ...isian, ...gps }).eq("id", temuanId);

  if (error) {
    kembaliDenganGalat(asal, `Gagal menyimpan perubahan: ${error.message}`);
  }

  if (perubahan.length > 0) {
    await catatRiwayat(supabase, "temuan", temuanId, "Temuan diubah", perubahan.join("; "));
  }
  if (gps) {
    await catatRiwayat(
      supabase,
      "temuan",
      temuanId,
      "Posisi GPS diperbarui",
      `STA hitungan ${formatSta(gps.gps_sta_m)}, akurasi ${gps.gps_akurasi_m} m`,
    );
  }
  if (cocokKatalog) {
    await catatRiwayat(
      supabase,
      "temuan",
      temuanId,
      "Jenis dicocokkan dengan katalog",
      `Diketik "${cocokKatalog.diketik}", disimpan sebagai ${cocokKatalog.nama}`,
    );
  }

  perbaruiHalaman();
  redirect(kembali);
}
