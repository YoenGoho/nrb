-- 009_waktu_ditemukan.sql
-- Memisahkan dua waktu pada setiap temuan:
--   dibuat_pada    : waktu data diinput ke aplikasi. Otomatis, tidak pernah diubah.
--   ditemukan_pada : waktu kerusakan ditemukan di lapangan. Bisa disesuaikan
--                    kalau temuan diinput belakangan, dan setiap perubahannya tercatat di riwayat.

-- =========================================================
-- 1. Kolom waktu ditemukan
-- =========================================================
alter table public.temuan add column ditemukan_pada timestamptz;

-- Temuan lama: waktu ditemukan disamakan dengan waktu inputnya
update public.temuan set ditemukan_pada = dibuat_pada where ditemukan_pada is null;

alter table public.temuan alter column ditemukan_pada set default now();
alter table public.temuan alter column ditemukan_pada set not null;

-- Untuk kalender: mencari temuan per hari atau per bulan dengan cepat
create index temuan_user_ditemukan_idx on public.temuan (user_id, ditemukan_pada desc);

-- =========================================================
-- 2. Melengkapi buku riwayat untuk temuan lama
-- =========================================================
-- Mulai sekarang setiap temuan baru tercatat "Temuan ditambahkan" di riwayat_aksi.
-- Temuan yang dibuat sebelum aturan ini diberi catatan yang sama, memakai waktu input aslinya,
-- dan keterangannya menyebut bahwa catatan ini dilengkapi belakangan.
insert into public.riwayat_aksi (user_id, tabel, baris_id, aksi, keterangan, dibuat_pada)
select t.user_id, 'temuan', t.id, 'Temuan ditambahkan',
       'Dilengkapi 26 Nov 2026 dari waktu input temuan lama', t.dibuat_pada
from public.temuan t
where not exists (
  select 1 from public.riwayat_aksi r
  where r.tabel = 'temuan' and r.baris_id = t.id and r.aksi = 'Temuan ditambahkan'
);
