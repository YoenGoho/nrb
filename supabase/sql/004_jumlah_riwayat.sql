-- 004_jumlah_riwayat.sql
-- Tambahan minggu 2 langkah D:
-- 1. Kolom jumlah pada temuan, opsional, untuk titik biasanya 1
-- 2. Penanda temuan yang ditambahkan setelah sesi inspeksi ditutup
-- 3. Aturan hanya boleh ada satu inspeksi berjalan per pengguna
-- 4. Tabel riwayat_aksi, catatan permanen setiap tindakan penting

-- =========================================================
-- 1 dan 2. Kolom baru pada tabel temuan
-- =========================================================
alter table public.temuan
  add column jumlah integer check (jumlah is null or jumlah >= 1);

alter table public.temuan
  add column ditambahkan_setelah_tutup boolean not null default false;

-- =========================================================
-- 3. Satu pengguna hanya boleh punya satu inspeksi berstatus Berjalan.
--    Indeks unik bersyarat: aturannya hanya berlaku untuk baris
--    yang statusnya Berjalan, baris Selesai tidak dihitung.
-- =========================================================
create unique index satu_inspeksi_berjalan_per_pengguna
  on public.inspeksi (user_id)
  where status = 'Berjalan';

-- =========================================================
-- 4. Tabel riwayat_aksi
--    Sengaja hanya diberi izin baca dan tambah.
--    Tidak ada izin ubah dan hapus, jadi catatan yang sudah masuk
--    tidak bisa dihapus atau dipalsukan dari aplikasi.
-- =========================================================
create table public.riwayat_aksi (
  id bigint primary key generated always as identity,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tabel text not null check (tabel in ('inspeksi', 'temuan')),
  baris_id bigint not null,
  aksi text not null,
  keterangan text,
  dibuat_pada timestamptz not null default now()
);

create index riwayat_aksi_baris_idx on public.riwayat_aksi (tabel, baris_id, dibuat_pada desc);

grant select, insert on public.riwayat_aksi to authenticated;

alter table public.riwayat_aksi enable row level security;

create policy "pemilik baca riwayat" on public.riwayat_aksi
  for select to authenticated using (auth.uid() = user_id);
create policy "pemilik tambah riwayat" on public.riwayat_aksi
  for insert to authenticated with check (auth.uid() = user_id);
