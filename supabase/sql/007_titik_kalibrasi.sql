-- 007_titik_kalibrasi.sql
-- Titik kalibrasi: pasangan "patok KM resmi" dan "posisi di peta".
-- Dipakai untuk mengoreksi ukuran garis OpenStreetMap supaya cocok dengan patok KM di lapangan.

-- =========================================================
-- 1. Tabel titik_kalibrasi
-- =========================================================
create table public.titik_kalibrasi (
  id bigint primary key generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  arah text not null check (arah in ('Arah Tangerang', 'Arah Jakarta')),
  -- Angka yang tertulis di patok, disimpan dalam meter. Contoh 19+600 menjadi 19600.
  sta_patok_m integer not null check (sta_patok_m >= 0),
  -- Posisi patok. Dari Street View: posisi kamera. Dari lapangan: posisi GPS.
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  sumber text not null default 'Street View' check (sumber in ('Street View', 'GPS lapangan')),
  -- Perkiraan jarak antara posisi yang tercatat dan patok sebenarnya, dalam meter
  perkiraan_galat_m numeric(6,1) check (perkiraan_galat_m is null or perkiraan_galat_m >= 0),
  -- Titik nonaktif tetap disimpan, tetapi tidak dipakai menghitung koreksi
  aktif boolean not null default true,
  catatan text,
  dibuat_pada timestamptz not null default now()
);

create index titik_kalibrasi_user_idx on public.titik_kalibrasi (user_id, sta_patok_m);

-- =========================================================
-- 2. Izin dan aturan pemilik, sama seperti tabel data kerja lainnya
-- =========================================================
grant select, insert, update on public.titik_kalibrasi to authenticated;

alter table public.titik_kalibrasi enable row level security;

create policy "pemilik baca titik kalibrasi" on public.titik_kalibrasi
  for select to authenticated using (auth.uid() = user_id);
create policy "pemilik tambah titik kalibrasi" on public.titik_kalibrasi
  for insert to authenticated with check (auth.uid() = user_id);
create policy "pemilik ubah titik kalibrasi" on public.titik_kalibrasi
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sengaja TIDAK ada izin hapus. Titik yang keliru dinonaktifkan, bukan dihapus,
-- supaya jejak data kalibrasi tetap utuh.

-- =========================================================
-- 3. Riwayat juga mencatat perubahan titik kalibrasi
-- =========================================================
alter table public.riwayat_aksi drop constraint if exists riwayat_aksi_tabel_check;
alter table public.riwayat_aksi add constraint riwayat_aksi_tabel_check
  check (tabel in ('inspeksi', 'temuan', 'titik_kalibrasi'));
