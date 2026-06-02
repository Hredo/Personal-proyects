import { acbAdapter } from "@/lib/sources/acb"
import { euroleagueAdapter } from "@/lib/sources/euroleague"
import { nbaAdapter } from "@/lib/sources/nba"
import type { SourceAdapter, SourceId } from "@/lib/sources/types"

export const SOURCES: Record<SourceId, SourceAdapter> = {
  nba: nbaAdapter,
  euroleague: euroleagueAdapter,
  acb: acbAdapter,
}

export const SOURCE_IDS = Object.keys(SOURCES) as SourceId[]

export function getSource(id: SourceId): SourceAdapter {
  return SOURCES[id]
}

export { nbaAdapter, euroleagueAdapter, acbAdapter }
export type { SourceAdapter, SourceId } from "@/lib/sources/types"
