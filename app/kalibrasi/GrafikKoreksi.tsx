import { JANGKAUAN_KALIBRASI_M, type TitikTeranalisis } from "@/lib/ruas";
import { formatSta } from "@/lib/sta";

// Grafik koreksi terhadap posisi patok, digambar sebagai SVG di server.
// Sumbu datar: patok KM 0 sampai 27. Sumbu tegak: koreksi dalam meter.

const LEBAR = 640;
const TINGGI = 300;
const KIRI = 52;
const KANAN = 16;
const ATAS = 16;
const BAWAH = 40;
const KM_MAKS = 27;

export function GrafikKoreksi({ titik }: { titik: TitikTeranalisis[] }) {
  if (titik.length === 0) {
    return <p className="mt-2 text-sm text-[#4A5568]">Grafik muncul setelah ada titik kalibrasi.</p>;
  }

  const semuaKoreksi = titik.map((t) => t.koreksiM);
  let yMin = Math.floor((Math.min(...semuaKoreksi) - 40) / 50) * 50;
  let yMaks = Math.ceil((Math.max(...semuaKoreksi) + 40) / 50) * 50;
  if (yMaks - yMin < 150) {
    const tengah = (yMaks + yMin) / 2;
    yMin = Math.floor((tengah - 75) / 50) * 50;
    yMaks = yMin + 150;
  }

  const x = (km: number) => KIRI + (km / KM_MAKS) * (LEBAR - KIRI - KANAN);
  const y = (k: number) => ATAS + ((yMaks - k) / (yMaks - yMin)) * (TINGGI - ATAS - BAWAH);

  const aktif = titik.filter((t) => t.aktif).sort((a, b) => a.sta_patok_m - b.sta_patok_m);

  // Garis koreksi yang benar-benar dipakai: lurus di antara titik aktif,
  // datar di luar titik paling ujung (digambar putus-putus)
  const garisDalam = aktif.map((t) => `${x(t.sta_patok_m / 1000)},${y(t.koreksiM)}`).join(" ");
  const pertama = aktif[0];
  const terakhir = aktif[aktif.length - 1];

  const langkahY = yMaks - yMin > 400 ? 100 : 50;
  const garisY: number[] = [];
  for (let v = yMin; v <= yMaks; v += langkahY) garisY.push(v);

  return (
    <div className="mt-3 rounded-xl border border-[#DCE2EA] bg-white p-2">
      <svg viewBox={`0 0 ${LEBAR} ${TINGGI}`} className="h-auto w-full" role="img"
           aria-label="Grafik koreksi STA terhadap posisi patok KM">
        {/* Pita hijau: bagian yang dianggap terkalibrasi, 2 km di kiri dan kanan tiap titik aktif */}
        {aktif.map((t) => {
          const kmTitik = t.sta_patok_m / 1000;
          const kiri = Math.max(0, kmTitik - JANGKAUAN_KALIBRASI_M / 1000);
          const kanan = Math.min(KM_MAKS, kmTitik + JANGKAUAN_KALIBRASI_M / 1000);
          return (
            <rect key={`pita-${t.id}`} x={x(kiri)} y={ATAS} width={x(kanan) - x(kiri)}
                  height={TINGGI - ATAS - BAWAH} fill="#DCFCE7" opacity="0.6" />
          );
        })}

        {/* Garis bantu mendatar dan angka sumbu tegak */}
        {garisY.map((v) => (
          <g key={`y-${v}`}>
            <line x1={KIRI} x2={LEBAR - KANAN} y1={y(v)} y2={y(v)} stroke="#EEF1F5" />
            <text x={KIRI - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="#4A5568">+{v}</text>
          </g>
        ))}

        {/* Angka sumbu datar */}
        {[0, 5, 10, 15, 20, 25].map((km) => (
          <g key={`x-${km}`}>
            <line x1={x(km)} x2={x(km)} y1={TINGGI - BAWAH} y2={TINGGI - BAWAH + 4} stroke="#4A5568" />
            <text x={x(km)} y={TINGGI - BAWAH + 16} fontSize="11" textAnchor="middle" fill="#4A5568">KM {km}</text>
          </g>
        ))}
        <line x1={KIRI} x2={LEBAR - KANAN} y1={TINGGI - BAWAH} y2={TINGGI - BAWAH} stroke="#4A5568" />
        <text x={LEBAR / 2} y={TINGGI - 4} fontSize="11" textAnchor="middle" fill="#4A5568">Patok KM</text>
        <text x={12} y={TINGGI / 2} fontSize="11" textAnchor="middle" fill="#4A5568"
              transform={`rotate(-90 12 ${TINGGI / 2})`}>Koreksi (m)</text>

        {/* Garis koreksi yang dipakai */}
        {aktif.length > 0 ? (
          <>
            <line x1={x(0)} x2={x(pertama.sta_patok_m / 1000)} y1={y(pertama.koreksiM)} y2={y(pertama.koreksiM)}
                  stroke="#14213D" strokeWidth="1.5" strokeDasharray="4 4" />
            <polyline points={garisDalam} fill="none" stroke="#14213D" strokeWidth="2" />
            <line x1={x(terakhir.sta_patok_m / 1000)} x2={x(KM_MAKS)} y1={y(terakhir.koreksiM)} y2={y(terakhir.koreksiM)}
                  stroke="#14213D" strokeWidth="1.5" strokeDasharray="4 4" />
          </>
        ) : null}

        {/* Titik */}
        {titik.map((t) => {
          const cx = x(Math.min(KM_MAKS, t.sta_patok_m / 1000));
          const cy = y(t.koreksiM);
          const warnaGaris = t.menyimpang ? "#C2410C" : t.aktif ? "#14213D" : "#9FB0C6";
          return (
            <g key={t.id}>
              <circle cx={cx} cy={cy} r="5" fill={t.aktif ? "#14213D" : "#FFFFFF"} stroke={warnaGaris} strokeWidth="2" />
              <text x={cx} y={cy - 9} fontSize="10" textAnchor="middle" fill="#2D3B52">{formatSta(t.sta_patok_m)}</text>
            </g>
          );
        })}
      </svg>
      <p className="px-2 pb-1 text-xs text-[#4A5568]">
        Titik penuh: aktif. Titik kosong: nonaktif. Garis oranye: menyimpang. Pita hijau: bagian yang dianggap
        terkalibrasi. Garis putus-putus: koreksi titik paling ujung dipakai apa adanya.
      </p>
    </div>
  );
}
