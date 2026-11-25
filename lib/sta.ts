// Semua jarak sepanjang ruas disimpan di database dalam satuan meter.
// Berkas ini mengubahnya menjadi format yang dibaca orang, dan sebaliknya.

// 19600 menjadi "19+600"
export function formatSta(meter: number) {
  const km = Math.floor(meter / 1000);
  const sisa = meter % 1000;
  return `${km}+${String(sisa).padStart(3, "0")}`;
}

// 19600 menjadi "KM 19"
export function formatKm(meter: number) {
  return `KM ${Math.floor(meter / 1000)}`;
}

// KM 19 dan 600 meter menjadi 19600
export function keMeter(km: number, meter: number) {
  return Math.round(km * 1000 + meter);
}
