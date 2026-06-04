import { NextResponse } from "next/server"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"

export const dynamic = "force-dynamic"

const SORTS = new Set(["points", "rebounds", "assists", "name"])
const ORDERS = new Set(["asc", "desc"])
const LEAGUES = new Set(["nba", "euroleague", "acb"])

export async function GET(req: Request) {
  const url = new URL(req.url)
  const sp = url.searchParams

  const sortRaw = sp.get("sort") ?? "points"
  const orderRaw = sp.get("order") ?? "desc"
  const leagueRaw = sp.get("league") ?? ""
  const query = sp.get("q")?.trim() ?? ""
  const team = sp.get("team")?.trim() ?? ""

  const pageRaw = Number(sp.get("page") ?? 1)
  const pageSizeRaw = Number(sp.get("pageSize") ?? 24)

  const input: ListPlayersInput = {
    sort: SORTS.has(sortRaw) ? (sortRaw as ListPlayersInput["sort"]) : "points",
    order: ORDERS.has(orderRaw)
      ? (orderRaw as ListPlayersInput["order"])
      : "desc",
    league: LEAGUES.has(leagueRaw) ? leagueRaw : undefined,
    query: query || undefined,
    team: team || undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    pageSize:
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(96, Math.floor(pageSizeRaw))
        : 24,
  }

  try {
    const result = await listPlayers(input)
    return NextResponse.json(result)
  } catch (err) {
    console.error("players list error", err)
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 },
    )
  }
}
