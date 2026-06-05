import { ImageResponse } from "next/og"

export const size = { width: 192, height: 192 }
export const contentType = "image/png"
export const dynamic = "force-static"

export default function Icon192() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 130,
        background: "linear-gradient(135deg, #f58634 0%, #c83a16 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0a0a0a",
        fontWeight: 800,
        fontFamily: "system-ui",
        borderRadius: 36,
      }}
    >
      B
    </div>,
    { ...size },
  )
}
