-- 003_inspeksi_temuan.sql
-- Tabel data kerja: satu inspeksi berisi banyak temuan.
-- Berbeda dengan gerbang dan jenis_temuan, tabel ini berisi data milik pengguna,
-- jadi aturannya: hanya pemilik baris yang boleh membaca dan mengubah.

-- =========================================================
-- 1. Tabel inspeksi, satu baris untuk satu sesi kerja
-- =========================================================
create table public.inspeksi (
  id bigint primary key generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tanggal date not null default current_date,
  sta_awal_m integer not null check (sta_awal_m >= 0),
  sta_akhir_m integer not null check (sta_akhir_m >= 0),
  arah text not null check (arah in ('Arah Tangerang', 'Arah Jakarta')),
  pic_atasan text,
  cuaca text,
  catatan text,
  status text not null default 'Berjalan' check (status in ('Berjalan', 'Selesai')),
  diinput_dari text not null default 'Lapangan' check (diinput_dari in ('Lapangan', 'Kantor')),
  dibuat_pada timestamptz not null default now(),
  ditutup_pada timestamptz,
  constraint urutan_sta_inspeksi check (sta_akhir_m >= sta_awal_m)
);

-- =========================================================
-- 2. Tabel temuan, menempel pada satu inspeksi
-- =========================================================
create table public.temuan (
  id bigint primary key generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  inspeksi_id bigint not null references public.inspeksi(id) on delete cascade,
  jenis_temuan_id bigint not null references public.jenis_temuan(id),
  tingkat text not null check (tingkat in ('Ringan', 'Sedang', 'Berat')),
  tipe_lokasi text not null default 'Titik' check (tipe_lokasi in ('Titik', 'Rentang')),
  sta_awal_m integer not null check (sta_awal_m >= 0),
  sta_akhir_m integer check (sta_akhir_m >= 0),
  arah text not null check (arah in ('Arah Tangerang', 'Arah Jakarta')),
  lajur text not null check (lajur in ('Lajur 1', 'Lajur 2', 'Lajur 3', 'Bahu Dalam', 'Bahu Luar')),
  panjang_m numeric(8,2) check (panjang_m >= 0),
  lebar_m numeric(8,2) check (lebar_m >= 0),
  luas_m2 numeric(12,2) generated always as (panjang_m * lebar_m) stored,
  catatan text,
  status text not null default 'Baru'
    check (status in ('Baru', 'Direncanakan', 'Dikerjakan', 'Menunggu Verifikasi', 'Selesai')),
  dibuat_pada timestamptz not null default now(),
  constraint rentang_butuh_sta_akhir check (tipe_lokasi = 'Titik' or sta_akhir_m is not null),
  constraint urutan_sta_temuan check (sta_akhir_m is null or sta_akhir_m >= sta_awal_m)
);

-- =========================================================
-- 3. Indeks, supaya pencarian tetap cepat saat data menumpuk
-- =========================================================
create index inspeksi_user_tanggal_idx on public.inspeksi (user_id, tanggal desc);
create index temuan_inspeksi_idx on public.temuan (inspeksi_id);
create index temuan_sta_idx on public.temuan (sta_awal_m);

-- =========================================================
-- 4. Izin masuk jalur, hanya untuk yang sudah login
-- =========================================================
grant select, insert, update, delete on public.inspeksi to authenticated;
grant select, insert, update, delete on public.temuan to authenticated;

-- =========================================================
-- 5. Nyalakan satpam
-- =========================================================
alter table public.inspeksi enable row level security;
alter table public.temuan enable row level security;

-- =========================================================
-- 6. Aturan satpam: hanya pemilik baris
-- =========================================================
create policy "pemilik baca inspeksi" on public.inspeksi
  for select to authenticated using (auth.uid() = user_id);
create policy "pemilik tambah inspeksi" on public.inspeksi
  for insert to authenticated with check (auth.uid() = user_id);
create policy "pemilik ubah inspeksi" on public.inspeksi
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik hapus inspeksi" on public.inspeksi
  for delete to authenticated using (auth.uid() = user_id);

create policy "pemilik baca temuan" on public.temuan
  for select to authenticated using (auth.uid() = user_id);
create policy "pemilik tambah temuan" on public.temuan
  for insert to authenticated with check (auth.uid() = user_id);
create policy "pemilik ubah temuan" on public.temuan
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pemilik hapus temuan" on public.temuan
  for delete to authenticated using (auth.uid() = user_id);
