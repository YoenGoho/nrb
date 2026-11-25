import { formatWaktu } from "@/lib/param";

export type BarisRiwayat = {
  id: number;
  aksi: string;
  keterangan: string | null;
  dibuat_pada: string;
};

// Daftar catatan permanen dari tabel riwayat_aksi, terbaru di atas
export function DaftarRiwayatAksi({ baris }: { baris: BarisRiwayat[] }) {
  if (baris.length === 0) {
    return <p className="mt-2 text-sm text-[#4A5568]">Belum ada catatan riwayat.</p>;
  }

  return (
    <ol className="mt-3 flex flex-col gap-2 border-l-2 border-[#DCE2EA] pl-4">
      {baris.map((r) => (
        <li key={r.id}>
          <p className="text-xs text-[#4A5568]">{formatWaktu(r.dibuat_pada)}</p>
          <p className="text-sm font-semibold">{r.aksi}</p>
          {r.keterangan ? <p className="text-sm text-[#4A5568]">{r.keterangan}</p> : null}
        </li>
      ))}
    </ol>
  );
}
