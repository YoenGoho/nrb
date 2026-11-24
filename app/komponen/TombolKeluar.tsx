"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TombolKeluar() {
  const router = useRouter();
  const [sedangProses, setSedangProses] = useState(false);

  async function keluar() {
    setSedangProses(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={keluar}
      disabled={sedangProses}
      className="rounded-xl border border-[#4A5568] px-3 py-2 text-xs font-semibold text-[#E3E8F0] disabled:opacity-60"
    >
      {sedangProses ? "Keluar..." : "Keluar"}
    </button>
  );
}
