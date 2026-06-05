import { ImageResponse } from "next/og"
import { SITE } from "@/lib/site"

export const alt = "globalhoopstats — Hoops, decoded."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0a0a0a",
        padding: 72,
        color: "#ffffff",
        fontFamily: "system-ui",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "linear-gradient(135deg, #f58634 0%, #c83a16 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 40,
            color: "#0a0a0a",
          }}
        >
          G
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: -1,
          }}
        >
          {SITE.name}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: -3,
            display: "flex",
          }}
        >
          Hoops, decoded.
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            color: "#f8c98a",
            maxWidth: 900,
            display: "flex",
          }}
        >
          {SITE.taglineShort}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          gap: 14,
          fontSize: 24,
          color: "#e5e5e5",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          2400+ players indexed
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          NBA · EuroLeague · ACB
        </div>
        <div style={{ marginLeft: "auto", fontSize: 22, color: "#a3a3a3" }}>
          {SITE.url.replace("https://", "")}
        </div>
      </div>
    </div>,
    { ...size },
  )
}
