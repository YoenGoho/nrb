import { lewatWaktu, type BarisSesi } from "@/lib/inspeksi";

// Penanda kecil di pojok kartu sesi: status, jenis, dan peringatan lewat waktu
export function PenandaSesi({ s }: { s: Pick<BarisSesi, "status" | "jenis_sesi" | "tanggal" | "rencana_selesai"> }) {
  const berjalan = s.status === "Berjalan";

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span
        className={
          berjalan
            ? "rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#14532D]"
            : "rounded-full bg-[#EEF1F5] px-3 py-1 text-xs font-semibold text-[#2D3B52]"
        }
      >
        {s.status}
      </span>
      <span className="rounded-full border border-[#DCE2EA] px-2 py-0.5 text-xs text-[#4A5568]">
        {s.jenis_sesi}
      </span>
      {lewatWaktu(s) ? (
        <span className="rounded-full bg-[#FDECEC] px-2 py-0.5 text-xs font-semibold text-[#7A1C1C]">
          {s.jenis_sesi === "Berkala" ? "Lewat rencana selesai" : "Lewat hari, belum ditutup"}
        </span>
      ) : null}
    </div>
  );
}
