-- 006_sesi_bersamaan.sql
-- Perubahan aturan sesi inspeksi:
-- 1. Beberapa sesi boleh berjalan bersamaan (aturan satu sesi berjalan dari 004 dicabut)
-- 2. Sesi punya jenis: Harian (satu hari, satu laporan) atau Berkala (beberapa hari)
-- 3. Sesi Berkala wajib punya tanggal rencana selesai, sesi Harian tidak boleh punya

-- =========================================================
-- 1. Cabut aturan satu sesi berjalan per pengguna
-- =========================================================
drop index if exists public.satu_inspeksi_berjalan_per_pengguna;

-- Indeks biasa (bukan unik), supaya pencarian sesi yang berjalan tetap cepat
create index if not exists inspeksi_berjalan_idx
  on public.inspeksi (user_id)
  where status = 'Berjalan';

-- =========================================================
-- 2. Jenis sesi. Sesi lama otomatis menjadi Harian.
-- =========================================================
alter table public.inspeksi
  add column jenis_sesi text not null default 'Harian'
  check (jenis_sesi in ('Harian', 'Berkala'));

-- =========================================================
-- 3. Tanggal rencana selesai untuk sesi Berkala
-- =========================================================
alter table public.inspeksi add column rencana_selesai date;

alter table public.inspeksi add constraint jenis_sesi_dan_rencana check (
  (jenis_sesi = 'Harian' and rencana_selesai is null)
  or
  (jenis_sesi = 'Berkala' and rencana_selesai is not null and rencana_selesai >= tanggal)
);
