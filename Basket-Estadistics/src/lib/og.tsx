import { ImageResponse } from "next/og"
import { SITE } from "@/lib/site"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

type Props = {
  title: string
  subtitle?: string
  chips?: string[]
  pill?: string
  accent?: "brand" | "magenta" | "cyan"
}

// Satori (the engine behind `next/og`) only supports a small subset of CSS
// for background images, so we stick to solid colors. Layered gradients
// like `radial-gradient(...), #0a0a0a` are rejected with
// "Invalid background image".
const ACCENT_BG: Record<NonNullable<Props["accent"]>, string> = {
  brand: "#0a0a0a",
  magenta: "#0a0a0a",
  cyan: "#0a0a0a",
}

export function ogCard({
  title,
  subtitle,
  chips = [],
  pill,
  accent = "brand",
}: Props) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: ACCENT_BG[accent],
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
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: "linear-gradient(135deg, #f58634 0%, #c83a16 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 34,
            color: "#0a0a0a",
          }}
        >
          G
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
          {SITE.name}
        </div>
        {pill ? (
          <div
            style={{
              marginLeft: 8,
              fontSize: 18,
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "#e5e5e5",
              display: "flex",
            }}
          >
            {pill}
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 24,
        }}
      >
        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -2.5,
            display: "flex",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 22,
              fontSize: 28,
              color: "#e5e5e5",
              maxWidth: 950,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 12,
            fontSize: 22,
            color: "#e5e5e5",
          }}
        >
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      ) : null}
    </div>,
    { ...size },
  )
}
