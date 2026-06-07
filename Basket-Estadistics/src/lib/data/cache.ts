import { unstable_cache } from "next/cache"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (...args: any[]) => Promise<unknown>

export function cached<T extends Callback>(
  fn: T,
  key: string,
  tags: string[],
  revalidate = 3600,
): T {
  return unstable_cache(fn, [key], {
    revalidate,
    tags,
  })
}
