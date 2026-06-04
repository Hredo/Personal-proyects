import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Basket·Estadistics",
    short_name: "B·E",
    description:
      "Global basketball scouting intelligence. Stats, comparisons and highlights from the NBA, ACB and EuroLeague in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  }
}
