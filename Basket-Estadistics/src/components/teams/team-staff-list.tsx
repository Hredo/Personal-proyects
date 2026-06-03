import { CoachCard } from "@/components/staff/coach-card"

type StaffItem = {
  id: string
  fullName: string
  slug: string
  role: "head_coach" | "assistant_coach" | "staff"
  nationality: string | null
  age: number | null
  photoUrl: string | null
  licenseType: string | null
  team: { id: string; name: string; slug: string; logoUrl: string | null }
  league: { id: string; name: string; slug: string; country: string }
}

type Props = { staff: StaffItem[] }

const ROLE_LABEL: Record<StaffItem["role"], string> = {
  head_coach: "Head coach",
  assistant_coach: "Assistant coaches",
  staff: "Technical staff",
}

const ROLE_ORDER: StaffItem["role"][] = ["head_coach", "assistant_coach", "staff"]

export function TeamStaffList({ staff }: Props) {
  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-ink-300">
        Staff data not available for this team.
      </div>
    )
  }
  const grouped = new Map<StaffItem["role"], StaffItem[]>()
  for (const role of ROLE_ORDER) grouped.set(role, [])
  for (const c of staff) {
    grouped.get(c.role)?.push(c)
  }
  return (
    <div
      className="team-staff-list sticky top-24 space-y-5 rounded-2xl border p-5"
      style={{
        borderColor: "color-mix(in oklch, var(--team-500) 30%, rgba(255,255,255,0.06))",
        background:
          "color-mix(in oklch, var(--team-500) 5%, rgba(255,255,255,0.02))",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[var(--team-200)]">
          Coaching staff
        </h2>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-300">
          {staff.length}
        </span>
      </div>
      {ROLE_ORDER.map((role) => {
        const list = grouped.get(role) ?? []
        if (list.length === 0) return null
        return (
          <div key={role}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              {ROLE_LABEL[role]}
            </p>
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id}>
                  <CoachCard coach={c} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
