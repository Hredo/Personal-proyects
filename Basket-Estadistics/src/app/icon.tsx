import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"
export const dynamic = "force-static"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "linear-gradient(135deg, #f58634 0%, #c83a16 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0a0a0a",
          fontWeight: 800,
          fontFamily: "system-ui",
          borderRadius: 6,
        }}
      >
        B
      </div>
    ),
    { ...size },
  )
}
