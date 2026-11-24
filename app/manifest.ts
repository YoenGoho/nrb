import type { MetadataRoute } from "next";

// Kartu identitas aplikasi. Berkas ini yang bikin NRB bisa dipasang
// di layar utama HP, lengkap dengan ikon dan tanpa bilah alamat browser.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NRB, Nugroho Road Bridge",
    short_name: "NRB",
    description:
      "Aplikasi pencatatan inspeksi dan pemeliharaan jalan tol, ruas Tomang sampai Bitung.",
    lang: "id",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F6F9",
    theme_color: "#14213D",
    icons: [
      { src: "/ikon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/ikon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
