-- 005_jenis_manual.sql
-- Jenis temuan yang diketik manual (pilihan Lainnya).
-- Keputusan: jenis manual hanya tersimpan di temuan itu, katalog tidak ikut berubah.
-- Setiap temuan wajib memakai SALAH SATU: jenis dari katalog, atau jenis manual beserta kategorinya.

-- =========================================================
-- 1. Jenis dari katalog sekarang boleh kosong, karena bisa diganti jenis manual
-- =========================================================
alter table public.temuan alter column jenis_temuan_id drop not null;

-- =========================================================
-- 2. Kolom jenis manual dan kategorinya
--    Daftar kategori sengaja TIDAK dikunci di database, supaya kategori baru
--    di katalog bisa langsung dipakai tanpa mengubah naskah SQL.
--    Pemeriksaan nama kategori dilakukan di aplikasi.
-- =========================================================
alter table public.temuan add column jenis_lain text;
alter table public.temuan add column kategori_lain text;

-- =========================================================
-- 3. Aturan: pilih salah satu, tidak boleh dua-duanya, tidak boleh kosong semua
-- =========================================================
alter table public.temuan add constraint jenis_katalog_atau_manual check (
  (jenis_temuan_id is not null and jenis_lain is null and kategori_lain is null)
  or
  (jenis_temuan_id is null and jenis_lain is not null and kategori_lain is not null)
);

alter table public.temuan add constraint panjang_jenis_lain check (
  jenis_lain is null or char_length(btrim(jenis_lain)) between 2 and 80
);
