import Link from "next/link"

type PaginationProps = {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  basePath: string
  searchParams: Record<string, string | undefined>
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) {
    if (v != null && v !== "" && k !== "page") params.set(k, v)
  }
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function pageNumbers(
  current: number,
  total: number,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const out: (number | "ellipsis-start" | "ellipsis-end")[] = []
  out.push(1)
  if (current > 4) out.push("ellipsis-start")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) out.push(i)
  if (current < total - 3) out.push("ellipsis-end")
  out.push(total)
  return out
}

function formatRange(currentPage: number, pageSize: number, total: number) {
  if (total === 0) return "0 of 0"
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)
  return `${start.toLocaleString("en-US")}–${end.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`
}

export function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    if (total > 0) {
      return (
        <p className="text-center text-[11px] uppercase tracking-widest text-ink-400 sm:text-xs">
          {formatRange(currentPage, pageSize, total)}{" "}
          {total === 1 ? "result" : "results"}
        </p>
      )
    }
    return null
  }

  const prevPage = Math.max(1, currentPage - 1)
  const nextPage = Math.min(totalPages, currentPage + 1)
  const prevHref = buildHref(basePath, searchParams, prevPage)
  const nextHref = buildHref(basePath, searchParams, nextPage)
  const items = pageNumbers(currentPage, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p className="order-2 text-[11px] uppercase tracking-widest text-ink-400 sm:order-1 sm:text-xs">
        {formatRange(currentPage, pageSize, total)}{" "}
        <span className="text-ink-500">
          · page {currentPage} / {totalPages}
        </span>
      </p>

      <ul className="order-1 flex flex-wrap items-center justify-center gap-1 sm:order-2">
        <li>
          <PageLink
            href={prevHref}
            disabled={currentPage === 1}
            aria-label="Previous page"
            rel="prev"
          >
            <ChevronLeft />
            <span className="hidden sm:inline">Prev</span>
          </PageLink>
        </li>

        {items.map((it, idx) => {
          if (it === "ellipsis-start" || it === "ellipsis-end") {
            return (
              <li
                key={`${it}-${idx}`}
                aria-hidden
                className="select-none px-1 font-mono text-xs text-ink-500"
              >
                …
              </li>
            )
          }
          const href = buildHref(basePath, searchParams, it)
          const active = it === currentPage
          return (
            <li key={it}>
              <PageLink
                href={href}
                active={active}
                aria-current={active ? "page" : undefined}
              >
                {it}
              </PageLink>
            </li>
          )
        })}

        <li>
          <PageLink
            href={nextHref}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            rel="next"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight />
          </PageLink>
        </li>
      </ul>
    </nav>
  )
}

function PageLink({
  href,
  active = false,
  disabled = false,
  children,
  ...rest
}: {
  href: string
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const base =
    "inline-flex h-8 min-w-[2rem] items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition"
  if (disabled) {
    return (
      <span
        aria-disabled
        className={`${base} cursor-not-allowed border border-white/5 bg-white/[0.02] text-ink-600`}
      >
        {children}
      </span>
    )
  }
  if (active) {
    return (
      <span
        aria-current="page"
        className={`${base} border border-brand-500/40 bg-brand-500/15 text-brand-200 shadow-[var(--shadow-brand-glow)]`}
      >
        {children}
      </span>
    )
  }
  return (
    <Link
      href={href}
      scroll={false}
      className={`${base} border border-white/10 bg-white/[0.03] text-ink-200 hover:border-brand-500/40 hover:text-ink-50`}
      {...rest}
    >
      {children}
    </Link>
  )
}

function ChevronLeft() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  )
}
