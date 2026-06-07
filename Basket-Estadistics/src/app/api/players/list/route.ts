import { NextResponse } from "next/server"
import { listPlayers, type ListPlayersInput } from "@/lib/data/players"
import {
  clientIp,
  jsonTooManyRequests,
  readRateLimit,
} from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"

const SORTS = new Set(["points", "rebounds", "assists", "name"])
const ORDERS = new Set(["asc", "desc"])
const LEAGUES = new Set(["nba", "euroleague", "acb"])
const MAX_PAGE_SIZE = 50
const MAX_Q_LEN = 100
const MAX_SLUG_LEN = 100

export async function GET(req: Request) {
  const ip = clientIp(req)
  const limit = readRateLimit(ip, "players-list")
  if (!limit.ok) return jsonTooManyRequests(limit.retryAfterSec)

  const url = new URL(req.url)
  const sp = url.searchParams

  const sortRaw = sp.get("sort") ?? "points"
  const orderRaw = sp.get("order") ?? "desc"
  const leagueRaw = sp.get("league") ?? ""
  const query = (sp.get("q") ?? "").slice(0, MAX_Q_LEN).trim()
  const team = (sp.get("team") ?? "").slice(0, MAX_SLUG_LEN).trim()

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
        ? Math.min(MAX_PAGE_SIZE, Math.floor(pageSizeRaw))
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
