import { createClient } from "@supabase/supabase-js";

// Ambil alamat dan kunci dari file .env.local (di laptop) atau Environment Variables (di Vercel)
const alamat = process.env.NEXT_PUBLIC_SUPABASE_URL;
const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Kalau salah satu kosong, langsung berhenti dengan pesan yang jelas
if (!alamat || !kunci) {
  throw new Error(
    "Alamat atau kunci Supabase belum diisi. Cek file .env.local di folder nrb, atau Environment Variables di Vercel.",
  );
}

// Penyambung ke database yang dipakai di seluruh aplikasi
export const supabase = createClient(alamat, kunci);
