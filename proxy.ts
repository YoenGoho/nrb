import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Di Next.js 16 berkas ini bernama proxy.ts. Di versi 15 ke bawah namanya middleware.ts.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
