import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Alamat yang dituju Supabase setelah login Google berhasil.
// Tugasnya menukar kode sementara menjadi tiket login, lalu mengembalikan
// pengguna ke halaman yang dia tinggalkan.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const kode = searchParams.get("code");
  const tujuan = searchParams.get("next") ?? "/";

  if (kode) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(kode);

    if (!error) {
      const hostAsli = request.headers.get("x-forwarded-host");
      const diLaptop = process.env.NODE_ENV === "development";

      if (diLaptop) {
        return NextResponse.redirect(`${origin}${tujuan}`);
      }
      if (hostAsli) {
        return NextResponse.redirect(`https://${hostAsli}${tujuan}`);
      }
      return NextResponse.redirect(`${origin}${tujuan}`);
    }
  }

  return NextResponse.redirect(`${origin}/?galat=login`);
}
