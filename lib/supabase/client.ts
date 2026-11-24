import { createBrowserClient } from "@supabase/ssr";

// Penyambung Supabase untuk kode yang jalan di BROWSER (komponen "use client").
// Tiket login disimpan di cookie, jadi server juga bisa ikut membacanya.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
