-- 008_lokasi_gps_temuan.sql
-- Menyimpan posisi GPS asli setiap temuan, di samping STA yang tercatat.
-- Peta tidak wajib ditampilkan, tetapi lokasi aslinya tetap tersimpan untuk peta detail nanti.
-- Semua kolom boleh kosong, karena temuan lama dan temuan yang STA-nya diketik manual tidak punya GPS.

alter table public.temuan
  add column gps_lat double precision check (gps_lat is null or gps_lat between -90 and 90),
  add column gps_lon double precision check (gps_lon is null or gps_lon between -180 and 180),
  -- Akurasi yang dilaporkan HP, dalam meter. Makin kecil makin baik.
  add column gps_akurasi_m numeric(7,1) check (gps_akurasi_m is null or gps_akurasi_m >= 0),
  -- STA hasil hitungan aplikasi dari posisi GPS, sebelum disesuaikan pengguna.
  -- Nanti dibandingkan dengan sta_awal_m untuk melihat seberapa sering STA dikoreksi manual.
  add column gps_sta_m integer check (gps_sta_m is null or gps_sta_m >= 0),
  add column gps_diambil_pada timestamptz;

-- Koordinat harus berpasangan, tidak boleh hanya lintang atau hanya bujur yang terisi
alter table public.temuan add constraint temuan_gps_berpasangan
  check ((gps_lat is null) = (gps_lon is null));

-- Izin dan policy tabel temuan tidak perlu diubah: grant di naskah 003 berlaku untuk
-- seluruh tabel, jadi kolom baru otomatis ikut terlindungi aturan pemilik yang sama.
