import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  const user = await getCurrentUser(cookieHeader)
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({ user })
}
