-- 001_gerbang.sql
-- Titik referensi ruas Tomang sampai Bitung (KM 0 sampai 26).
-- Data referensi umum, boleh dibaca siapa pun, tidak boleh diubah dari luar.
-- Posisi masih perkiraan dari sumber publik, wajib divalidasi dengan patok di lapangan.

create table public.gerbang (
  id bigint primary key generated always as identity,
  nama text not null,
  jenis text not null check (jenis in ('Simpang Susun', 'Gerbang Tol', 'Jembatan')),
  sta_m integer not null check (sta_m >= 0),
  catatan text not null default 'Posisi perkiraan dari data publik, belum dikalibrasi'
);

insert into public.gerbang (nama, jenis, sta_m) values
  ('SS Tomang', 'Simpang Susun', 0),
  ('GT Kebon Jeruk', 'Gerbang Tol', 3000),
  ('GT Meruya', 'Gerbang Tol', 6000),
  ('SS Meruya (JORR)', 'Simpang Susun', 7000),
  ('GT Kembangan Selatan', 'Gerbang Tol', 8000),
  ('GT Karang Tengah Barat', 'Gerbang Tol', 11000),
  ('SS Kunciran (JORR 2)', 'Simpang Susun', 15000),
  ('GT Tangerang', 'Gerbang Tol', 18000),
  ('Jembatan Cisadane', 'Jembatan', 19600),
  ('GT Karawaci', 'Gerbang Tol', 21000),
  ('SS Bitung', 'Simpang Susun', 26000);

grant select on public.gerbang to anon, authenticated;

alter table public.gerbang enable row level security;

create policy "publik boleh baca gerbang"
  on public.gerbang
  for select
  to anon, authenticated
  using (true);
