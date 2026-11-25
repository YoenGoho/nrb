-- 002_jenis_temuan.sql
-- Katalog jenis temuan, sumber: lampiran 15.2 Spesifikasi Produk NRB v1.0.
-- Acuan jenis dan tingkat kerusakan perkerasan: ASTM D6433 (Ringan, Sedang, Berat).
-- Kolom sering menandai jenis yang muncul di daftar pendek pada form temuan.
-- Kolom aktif dipakai untuk menyembunyikan jenis tanpa menghapusnya.

create table public.jenis_temuan (
  id bigint primary key generated always as identity,
  kategori text not null,
  nama text not null,
  sering boolean not null default false,
  aktif boolean not null default true,
  urutan integer not null default 0,
  unique (kategori, nama)
);

insert into public.jenis_temuan (kategori, nama, sering) values
  ('Perkerasan Lentur','Retak kulit buaya',true),
  ('Perkerasan Lentur','Retak blok',false),
  ('Perkerasan Lentur','Retak memanjang',true),
  ('Perkerasan Lentur','Retak melintang',true),
  ('Perkerasan Lentur','Retak tepi',false),
  ('Perkerasan Lentur','Retak refleksi sambungan',false),
  ('Perkerasan Lentur','Retak selip',false),
  ('Perkerasan Lentur','Lubang',true),
  ('Perkerasan Lentur','Alur roda',true),
  ('Perkerasan Lentur','Amblas',false),
  ('Perkerasan Lentur','Sungkur',false),
  ('Perkerasan Lentur','Keriting',false),
  ('Perkerasan Lentur','Benjol dan turun',false),
  ('Perkerasan Lentur','Mengembang',false),
  ('Perkerasan Lentur','Kegemukan aspal',false),
  ('Perkerasan Lentur','Pelepasan butir',true),
  ('Perkerasan Lentur','Pelapukan permukaan',false),
  ('Perkerasan Lentur','Pengausan agregat',false),
  ('Perkerasan Lentur','Tambalan rusak',true),
  ('Perkerasan Lentur','Penurunan lajur atau bahu',false),
  ('Perkerasan Kaku','Retak sudut',false),
  ('Perkerasan Kaku','Retak memanjang',false),
  ('Perkerasan Kaku','Retak melintang',true),
  ('Perkerasan Kaku','Pelat terbagi',false),
  ('Perkerasan Kaku','Patahan antar pelat',true),
  ('Perkerasan Kaku','Gompal sambungan',true),
  ('Perkerasan Kaku','Gompal sudut',false),
  ('Perkerasan Kaku','Kerusakan penutup sambungan',true),
  ('Perkerasan Kaku','Pumping',false),
  ('Perkerasan Kaku','Blow up',false),
  ('Perkerasan Kaku','Punchout',false),
  ('Perkerasan Kaku','Scaling',false),
  ('Perkerasan Kaku','Popout',false),
  ('Perkerasan Kaku','Retak susut',false),
  ('Perkerasan Kaku','Tambalan rusak',false),
  ('Bahu dan Median','Lubang bahu',false),
  ('Bahu dan Median','Alur bahu',false),
  ('Bahu dan Median','Retak bahu',false),
  ('Bahu dan Median','Penurunan bahu',false),
  ('Bahu dan Median','Median rusak',false),
  ('Bahu dan Median','Rumput median terlalu tinggi',false),
  ('Drainase','Saluran tersumbat sedimen',false),
  ('Drainase','Saluran tersumbat sampah',false),
  ('Drainase','Saluran retak atau runtuh',false),
  ('Drainase','Inlet tersumbat',false),
  ('Drainase','Genangan di badan jalan',false),
  ('Drainase','Gorong-gorong tersumbat',false),
  ('Perlengkapan Jalan','Rambu rusak',false),
  ('Perlengkapan Jalan','Rambu hilang',false),
  ('Perlengkapan Jalan','Rambu tertutup tanaman',false),
  ('Perlengkapan Jalan','Marka pudar',false),
  ('Perlengkapan Jalan','Marka reflektor hilang',false),
  ('Perlengkapan Jalan','Patok KM atau HM rusak',false),
  ('Perlengkapan Jalan','Guardrail penyok',false),
  ('Perlengkapan Jalan','Guardrail hilang',false),
  ('Perlengkapan Jalan','PJU (Penerangan Jalan Umum) mati',false),
  ('Perlengkapan Jalan','Pagar rumija (Ruang Milik Jalan) rusak',false),
  ('Perlengkapan Jalan','Pagar pengaman rusak',false),
  ('Perlengkapan Jalan','Delineator hilang',false),
  ('Lingkungan','Pohon tumbang atau rawan tumbang',false),
  ('Lingkungan','Longsor lereng',false),
  ('Lingkungan','Tanaman menghalangi pandangan',false),
  ('Lingkungan','Sampah atau ceceran muatan',false),
  ('Lingkungan','Bangkai hewan',false),
  ('Jembatan','Expansion joint',false),
  ('Jembatan','Perletakan',false),
  ('Jembatan','Lantai dan plat',false),
  ('Jembatan','Drainase lantai',false),
  ('Jembatan','Sandaran dan trotoar',false),
  ('Jembatan','Kepala jembatan dan pilar',false),
  ('Jembatan','Gerusan di sekitar pilar',false),
  ('Jembatan','Rambu dan marka di jembatan',false);

grant select on public.jenis_temuan to anon, authenticated;

alter table public.jenis_temuan enable row level security;

create policy "publik boleh baca katalog"
  on public.jenis_temuan
  for select
  to anon, authenticated
  using (true);
