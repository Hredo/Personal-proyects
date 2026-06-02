import { NextResponse } from "next/server"
import {
  rankByQuery,
  searchPlayersAutocomplete,
  type AutocompleteOptions,
  type AutocompleteSort,
} from "@/lib/data/players"

export const dynamic = "force-dynamic"

const SORTS: AutocompleteSort[] = ["points", "assists", "rebounds", "name"]

function parseSort(v: string | null): AutocompleteSort {
  return SORTS.includes(v as AutocompleteSort)
    ? (v as AutocompleteSort)
    : "points"
}

function parseLeague(v: string | null): string | undefined {
  if (!v) return undefined
  return ["nba", "euroleague", "acb"].includes(v) ? v : undefined
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q")?.trim() ?? ""
  const league = parseLeague(url.searchParams.get("league"))
  const sort = parseSort(url.searchParams.get("sort"))
  const rawLimit = Number(url.searchParams.get("limit") ?? 12)
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : 12, 1),
    30,
  )

  const options: AutocompleteOptions = { league, sort, limit }
  const results = q.length >= 1
    ? rankByQuery(await searchPlayersAutocomplete(q, options), q)
    : await searchPlayersAutocomplete(q, options)

  return NextResponse.json({ results, q, league: league ?? null, sort })
}
