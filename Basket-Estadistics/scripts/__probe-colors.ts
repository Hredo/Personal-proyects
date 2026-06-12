/* Temporary probe — safe to delete */
import { PNG } from "pngjs"

const UA = "globalhoopstats-backfill/1.0 (local dev tool)"

async function probeLogo(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) })
    console.log(`${url}\n  status=${res.status} type=${res.headers.get("content-type")}`)
    if (!res.ok) return
    const buf = Buffer.from(await res.arrayBuffer())
    console.log(`  bytes=${buf.length} magic=${buf.subarray(0, 4).toString("hex")}`)
    try {
      const png = PNG.sync.read(buf)
      console.log(`  decoded ${png.width}x${png.height}`)
    } catch (e) {
      console.log(`  PNG decode failed: ${(e as Error).message}`)
    }
  } catch (e) {
    console.log(`  fetch failed: ${(e as Error).message}`)
  }
}

async function probeWiki(name: string) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1" +
    `&srsearch=${encodeURIComponent(`${name} basketball club`)}`
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) })
  console.log(`wiki "${name}": status=${res.status}`)
  if (res.ok) {
    const json = (await res.json()) as { query?: { search?: { title: string }[] } }
    console.log(`  -> ${json.query?.search?.[0]?.title ?? "(no result)"}`)
  } else {
    console.log(`  body: ${(await res.text()).slice(0, 200)}`)
  }
}

async function main() {
  await probeLogo("https://media-cdn.incrowdsports.com/e3dff28a-9ec6-4faf-9d96-ecbc68f75780.png")
  await probeLogo("https://cdn.ssref.net/req/202605260/tlogo/bbr/panathinaikos.png")
  await probeWiki("Real Madrid")
  await probeWiki("Olympiacos")
}

main()
