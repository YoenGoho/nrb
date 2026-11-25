# Naskah SQL NRB

Berkas di folder ini adalah catatan resmi bentuk database NRB di Supabase.
Dijalankan berurutan lewat SQL Editor di dashboard Supabase, satu berkas satu kali jalan.

| Berkas | Isi | Dijalankan |
|---|---|---|
| 001_gerbang.sql | Titik referensi ruas Tomang sampai Bitung | 24 November 2026 |
| 002_jenis_temuan.sql | Katalog 72 jenis temuan | 25 November 2026 |
| 003_inspeksi_temuan.sql | Tabel inspeksi dan temuan beserta aturan Row Level Security | 25 November 2026 |
| 004_jumlah_riwayat.sql | Kolom jumlah, penanda temuan susulan, satu sesi berjalan, tabel riwayat_aksi | 25 November 2026 |

Aturan yang dipakai di seluruh naskah:

- Jarak sepanjang ruas selalu disimpan dalam meter sebagai bilangan bulat, contoh 19600 untuk STA 19+600.
  Format tampilan KM+meter dibuat di sisi aplikasi.
- Tabel referensi umum (gerbang, jenis_temuan) boleh dibaca siapa pun, tidak boleh diubah dari luar.
- Tabel data kerja (inspeksi, temuan) hanya bisa dibaca dan diubah oleh pemilik barisnya,
  dijaga oleh dua lapis, yaitu grant dan policy.
- Tabel riwayat_aksi hanya bisa ditambah dan dibaca, tidak bisa diubah atau dihapus dari aplikasi.
