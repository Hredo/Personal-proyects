import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"
export const dynamic = "force-static"

export default function Icon512() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 350,
        background: "linear-gradient(135deg, #f58634 0%, #c83a16 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0a0a0a",
        fontWeight: 800,
        fontFamily: "system-ui",
        borderRadius: 96,
      }}
    >
      B
    </div>,
    { ...size },
  )
}
