const tahapan = [
  { sesi: "Sesi 1", judul: "Alat dan folder siap", selesai: true },
  { sesi: "Sesi 2", judul: "Proyek jalan di laptop, lalu simpan ke GitHub", selesai: false },
  { sesi: "Sesi 3", judul: "Tayang online lewat Vercel", selesai: false },
  { sesi: "Sesi 4", judul: "Database Supabase dan daftar gerbang", selesai: false },
  { sesi: "Sesi 5", judul: "Login Google dan pasang di HP", selesai: false },
];

export default function Home() {
  return (
    <main className="min-h-full flex-1 bg-[#F4F6F9] text-[#14213D]">
      <section className="bg-[#14213D] px-6 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-[#C9D3E3]">Mulai dibangun 23 November 2026</p>
          <h1 className="mt-2 text-4xl font-semibold">NRB</h1>
          <p className="mt-1 text-lg text-[#E3E8F0]">Nugroho Road Bridge</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#E3E8F0]">
            Aplikasi pencatatan inspeksi dan pemeliharaan jalan tol, mulai dari
            ruas Tomang sampai Bitung.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-8">
        <h2 className="text-lg font-semibold">Progres pembangunan</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {tahapan.map((t) => (
            <li
              key={t.sesi}
              className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE2EA] bg-white px-4 py-3"
            >
              <span>
                <span className="block text-xs font-semibold text-[#4A5568]">{t.sesi}</span>
                <span className="block text-base">{t.judul}</span>
              </span>
              <span
                className={
                  t.selesai
                    ? "rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]"
                    : "rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]"
                }
              >
                {t.selesai ? "Selesai" : "Berikutnya"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
