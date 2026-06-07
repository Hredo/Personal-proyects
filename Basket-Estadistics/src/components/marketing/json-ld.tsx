type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Serialise JSON-LD for safe embedding inside a <script> tag. JSON.stringify
 * alone does not escape `<`, so a value containing `</script>` (player/team
 * names come from scraped sources) could break out of the tag and inject
 * markup. Escape the HTML-significant characters as \uXXXX (still valid JSON).
 */
function serialize(data: JsonLdProps["data"]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  )
}
