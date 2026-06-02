export const EUROLEAGUE_BR_TO_CODE: Record<string, string> = {
  "alba-berlin": "BER",
  "anadolu-efes": "IST",
  "monaco": "MCO",
  "as-monaco": "MCO",
  "vitoria": "BAS",
  "baskonia-vitoria-gasteiz": "BAS",
  "red-star": "RED",
  "crvena-zvezda": "RED",
  "milano": "MIL",
  "olimpia-milano": "MIL",
  "barcelona": "BAR",
  "fc-barcelona": "BAR",
  "bayern-muenchen": "MUN",
  "fc-bayern-munich": "MUN",
  "ulker-fenerbahce": "ULK",
  "fenerbahce": "ULK",
  "villeurbanne": "ASV",
  "asvel-lyon-villeurbanne": "ASV",
  "ldlc-asvel-villeurbanne": "ASV",
  "maccabi-tel-aviv": "TEL",
  "olympiakos": "OLY",
  "olympiacos": "OLY",
  "panathinaikos": "PAN",
  "paris": "PRS",
  "partizan": "PAR",
  "real-madrid": "MAD",
  "virtus-bologna": "VIR",
  "virtus-segafredo-bologna": "VIR",
  "zalgiris": "ZAL",
  "zalgiris-kaunas": "ZAL",
  "valencia": "VAL",
  "valencia-basket": "VAL",
}

export function brSlugToEuroleagueCode(slug: string | undefined): string | undefined {
  if (!slug) return undefined
  return EUROLEAGUE_BR_TO_CODE[slug.toLowerCase()]
}
