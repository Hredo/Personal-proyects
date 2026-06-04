import { NextResponse } from "next/server"
import { listCoaches, type ListCoachesInput } from "@/lib/data/staff"

export const dynamic = "force-dynamic"

const ROLES = new Set(["head_coach", "assistant_coach", "staff"])
const LEAGUES = new Set(["nba", "euroleague", "acb"])

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams

  const leagueRaw = sp.get("league") ?? ""
  const roleRaw = sp.get("role") ?? ""
  const query = sp.get("q")?.trim() ?? ""
  const team = sp.get("team")?.trim() ?? ""

  const pageRaw = Number(sp.get("page") ?? 1)
  const pageSizeRaw = Number(sp.get("pageSize") ?? 36)

  const input: ListCoachesInput = {
    league: LEAGUES.has(leagueRaw) ? leagueRaw : undefined,
    role: ROLES.has(roleRaw) ? (roleRaw as ListCoachesInput["role"]) : undefined,
    query: query || undefined,
    team: team || undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    pageSize:
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(96, Math.floor(pageSizeRaw))
        : 36,
  }

  try {
    const result = await listCoaches(input)
    return NextResponse.json(result)
  } catch (err) {
    console.error("coaches list error", err)
    return NextResponse.json(
      { error: "Failed to fetch coaches" },
      { status: 500 },
    )
  }
}
