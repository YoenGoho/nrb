// Kumpulan isian temuan yang dipakai bersama oleh form tambah dan form ubah.
// Semua pilihan memakai tombol radio yang didandani, tanpa JavaScript tambahan.

export type JenisKatalog = { id: number; kategori: string; nama: string; sering: boolean };

export type NilaiAwal = {
  jenis_temuan_id?: number | null;
  tingkat?: string | null;
  tipe_lokasi?: string | null;
  sta_awal_m?: number | null;
  sta_akhir_m?: number | null;
  arah?: string | null;
  lajur?: string | null;
  panjang_m?: number | null;
  lebar_m?: number | null;
  jumlah?: number | null;
  catatan?: string | null;
};

const kotak = "rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-base w-full";
const label = "block text-xs font-semibold text-[#4A5568] mb-1";
const pilihan =
  "block cursor-pointer rounded-xl border border-[#DCE2EA] bg-white px-3 py-2 text-center text-sm " +
  "peer-checked:border-[#14213D] peer-checked:bg-[#14213D] peer-checked:text-white";

function Radio({ nama, nilai, teks, wajib, terpilih }: {
  nama: string;
  nilai: string | number;
  teks: string;
  wajib?: boolean;
  terpilih?: boolean;
}) {
  return (
    <label>
      <input
        type="radio"
        name={nama}
        value={nilai}
        className="peer sr-only"
        required={wajib}
        defaultChecked={terpilih}
      />
      <span className={pilihan}>{teks}</span>
    </label>
  );
}

function pecahSta(meter: number | null | undefined) {
  if (meter === null || meter === undefined) return { km: undefined, m: undefined };
  return { km: Math.floor(meter / 1000), m: meter % 1000 };
}

export function IsianTemuan({ katalog, awal }: { katalog: JenisKatalog[]; awal: NilaiAwal }) {
  const sering = katalog.filter((j) => j.sering);
  const lainnya = katalog.filter((j) => !j.sering);
  const kategoriUrut = Array.from(new Set(lainnya.map((j) => j.kategori)));

  const jenisAwal = awal.jenis_temuan_id ?? null;
  // Kalau jenis yang terpilih ada di daftar lain, daftar itu dibuka supaya pilihannya kelihatan
  const bukaDaftarLain = jenisAwal !== null && lainnya.some((j) => j.id === jenisAwal);

  const tipeAwal = awal.tipe_lokasi ?? "Titik";
  const staAwal = pecahSta(awal.sta_awal_m);
  const staAkhir = pecahSta(awal.sta_akhir_m);

  return (
    <>
      <fieldset>
        <legend className={label}>Jenis temuan, sering dipakai</legend>
        <div className="grid grid-cols-2 gap-2">
          {sering.map((j) => (
            <Radio
              key={j.id}
              nama="jenis_temuan_id"
              nilai={j.id}
              teks={`${j.nama} (${j.kategori === "Perkerasan Kaku" ? "kaku" : "lentur"})`}
              wajib
              terpilih={j.id === jenisAwal}
            />
          ))}
        </div>

        <details className="mt-3 rounded-xl border border-[#DCE2EA] bg-white" open={bukaDaftarLain}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            Jenis lain, semua kategori
          </summary>
          <div className="border-t border-[#DCE2EA] px-4 py-3">
            {kategoriUrut.map((kat) => (
              <div key={kat} className="mb-4">
                <p className="mb-2 text-xs font-semibold text-[#4A5568]">{kat}</p>
                <div className="grid grid-cols-2 gap-2">
                  {lainnya
                    .filter((j) => j.kategori === kat)
                    .map((j) => (
                      <Radio
                        key={j.id}
                        nama="jenis_temuan_id"
                        nilai={j.id}
                        teks={j.nama}
                        terpilih={j.id === jenisAwal}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend className={label}>Tingkat kerusakan, acuan ASTM D6433</legend>
        <div className="grid grid-cols-3 gap-2">
          <Radio nama="tingkat" nilai="Ringan" teks="Ringan (L)" wajib terpilih={awal.tingkat === "Ringan"} />
          <Radio nama="tingkat" nilai="Sedang" teks="Sedang (M)" terpilih={awal.tingkat === "Sedang"} />
          <Radio nama="tingkat" nilai="Berat" teks="Berat (H)" terpilih={awal.tingkat === "Berat"} />
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>Bentuk lokasi</legend>
        <div className="grid grid-cols-2 gap-2">
          <Radio nama="tipe_lokasi" nilai="Titik" teks="Titik" wajib terpilih={tipeAwal === "Titik"} />
          <Radio nama="tipe_lokasi" nilai="Rentang" teks="Rentang" terpilih={tipeAwal === "Rentang"} />
        </div>
      </fieldset>

      <div>
        <p className={label}>STA awal</p>
        <div className="flex items-center gap-2">
          <input className={kotak} type="number" name="km_awal" min="0" max="26"
                 placeholder="KM" aria-label="KM awal" required defaultValue={staAwal.km} />
          <span className="text-lg font-semibold">+</span>
          <input className={kotak} type="number" name="m_awal" min="0" max="999"
                 placeholder="meter" aria-label="Meter awal" defaultValue={staAwal.m ?? 0} />
        </div>
      </div>

      <div>
        <p className={label}>STA akhir, isi hanya kalau memilih Rentang</p>
        <div className="flex items-center gap-2">
          <input className={kotak} type="number" name="km_akhir" min="0" max="26"
                 placeholder="KM" aria-label="KM akhir" defaultValue={staAkhir.km} />
          <span className="text-lg font-semibold">+</span>
          <input className={kotak} type="number" name="m_akhir" min="0" max="999"
                 placeholder="meter" aria-label="Meter akhir" defaultValue={staAkhir.m} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Arah</legend>
        <div className="grid grid-cols-2 gap-2">
          <Radio nama="arah" nilai="Arah Tangerang" teks="Tangerang" wajib terpilih={awal.arah === "Arah Tangerang"} />
          <Radio nama="arah" nilai="Arah Jakarta" teks="Jakarta" terpilih={awal.arah === "Arah Jakarta"} />
        </div>
      </fieldset>

      <fieldset>
        <legend className={label}>Lajur, urut dari median ke tepi</legend>
        <div className="grid grid-cols-3 gap-2">
          {["Lajur 1", "Lajur 2", "Lajur 3", "Bahu Dalam", "Bahu Luar"].map((l, i) => (
            <Radio key={l} nama="lajur" nilai={l} teks={l} wajib={i === 0} terpilih={awal.lajur === l} />
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={label} htmlFor="panjang_m">Panjang (m)</label>
          <input className={kotak} type="number" step="0.01" min="0" id="panjang_m" name="panjang_m"
                 defaultValue={awal.panjang_m ?? undefined} />
        </div>
        <div className="flex-1">
          <label className={label} htmlFor="lebar_m">Lebar (m)</label>
          <input className={kotak} type="number" step="0.01" min="0" id="lebar_m" name="lebar_m"
                 defaultValue={awal.lebar_m ?? undefined} />
        </div>
        <div className="w-24">
          <label className={label} htmlFor="jumlah">Jumlah</label>
          <input className={kotak} type="number" step="1" min="1" id="jumlah" name="jumlah"
                 defaultValue={awal.jumlah ?? undefined} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-[#4A5568]">
        Ukuran boleh dikosongkan dan diisi belakangan. Luas dihitung otomatis oleh database.
      </p>

      <div>
        <label className={label} htmlFor="catatan">Catatan (opsional)</label>
        <textarea className={kotak} id="catatan" name="catatan" rows={3} defaultValue={awal.catatan ?? ""} />
      </div>
    </>
  );
}
