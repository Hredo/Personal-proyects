import { NextResponse } from "next/server"
import { listTeams, type ListTeamsInput } from "@/lib/data/teams"
import {
  clientIp,
  jsonTooManyRequests,
  readRateLimit,
} from "@/lib/security/ai-advisor"

export const dynamic = "force-dynamic"

const SORTS = new Set(["name", "players"])
const ORDERS = new Set(["asc", "desc"])
const LEAGUES = new Set([
  "nba",
  "euroleague",
  "acb",
  "feb",
  "leb-oro",
  "leb-plata",
  "eba",
])
const MAX_PAGE_SIZE = 50
const MAX_Q_LEN = 100

export async function GET(req: Request) {
  const ip = clientIp(req)
  const limit = readRateLimit(ip, "teams-list")
  if (!limit.ok) return jsonTooManyRequests(limit.retryAfterSec)

  const url = new URL(req.url)
  const sp = url.searchParams

  const sortRaw = sp.get("sort") ?? "name"
  const orderRaw = sp.get("order") ?? "asc"
  const leagueRaw = sp.get("league") ?? ""
  const query = (sp.get("q") ?? "").slice(0, MAX_Q_LEN).trim()

  const pageRaw = Number(sp.get("page") ?? 1)
  const pageSizeRaw = Number(sp.get("pageSize") ?? 18)

  const input: ListTeamsInput = {
    sort: SORTS.has(sortRaw) ? (sortRaw as ListTeamsInput["sort"]) : "name",
    order: ORDERS.has(orderRaw) ? (orderRaw as ListTeamsInput["order"]) : "asc",
    league: LEAGUES.has(leagueRaw) ? leagueRaw : undefined,
    query: query || undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    pageSize:
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(MAX_PAGE_SIZE, Math.floor(pageSizeRaw))
        : 18,
  }

  try {
    const result = await listTeams(input)
    return NextResponse.json(result)
  } catch (err) {
    console.error("teams list error", err)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 },
    )
  }
}
