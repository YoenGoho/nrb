import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Dijalankan sebelum setiap halaman dibuka. Dua tugasnya:
// 1. Memperbarui tiket login supaya tidak kedaluwarsa di tengah jalan
// 2. Menjaga halaman tertentu supaya hanya bisa dibuka setelah login
const halamanTerkunci = ["/catat"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Jangan sisipkan kode apa pun di antara createServerClient dan getClaims().
  // Kesalahan kecil di sini bikin pengguna keluar sendiri tanpa sebab jelas.
  const { data } = await supabase.auth.getClaims();
  const pengguna = data?.claims;

  const perluLogin = halamanTerkunci.some((awalan) =>
    request.nextUrl.pathname.startsWith(awalan),
  );

  if (!pengguna && perluLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("perlu", "masuk");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
