import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { closeDb } from "@/lib/db/client"
import { SOURCE_IDS, type SourceId } from "@/lib/sources"
import { startGlobalSync } from "@/lib/sync/orchestrator"

function loadEnv() {
  const paths = [".env.local", ".env"].map((f) => resolve(__dirname, "..", f))
  for (const p of paths) {
    try {
      const content = readFileSync(p, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eqIdx = trimmed.indexOf("=")
        if (eqIdx === -1) continue
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2")
        if (!process.env[key]) process.env[key] = value
      }
    } catch {
      // file not found, skip
    }
  }
}
loadEnv()

function parseTargets(argv: string[]): SourceId[] {
  const args = argv.slice(2).filter((a) => !a.startsWith("--"))
  if (args.length === 0) return SOURCE_IDS
  return args
    .map((a) => a.toLowerCase())
    .filter((a): a is SourceId => (SOURCE_IDS as string[]).includes(a))
}

async function main() {
  const report = await startGlobalSync(parseTargets(process.argv))
  closeDb()
  const failed = report.results.filter((r) => r.status === "failed")
  if (failed.length > 0 && failed.length === report.results.length) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
