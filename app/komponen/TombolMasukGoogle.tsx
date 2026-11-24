"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TombolMasukGoogle() {
  const [sedangProses, setSedangProses] = useState(false);

  async function masuk() {
    setSedangProses(true);
    const supabase = createClient();

    // Kirim pengguna ke Google. Setelah selesai, Google mengembalikannya ke
    // Supabase, lalu Supabase mengembalikannya ke alamat di bawah ini.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setSedangProses(false);
      alert(`Gagal memulai login: ${error.message}`);
    }
  }

  return (
    <button
      type="button"
      onClick={masuk}
      disabled={sedangProses}
      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#14213D] disabled:opacity-60"
    >
      {sedangProses ? "Menghubungkan..." : "Masuk dengan Google"}
    </button>
  );
}
