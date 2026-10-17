// What this is: a room's equipment as a row of short labels under a visible "Equipment" label.
import type { Feature } from '@/payload-types'
import { cn } from '@/lib/utils'

// A piece of equipment as Payload returns it: the whole record, or only its id when the query did not go
// deep enough to fetch it. Only whole records can be shown (they have a name and a slug).
type FeatureLike = number | Pick<Feature, 'id' | 'name' | 'slug'>

export function FeatureList({ features, className }: { features?: FeatureLike[] | null; className?: string }) {
  const shown = (features ?? []).filter((feature): feature is Pick<Feature, 'id' | 'name' | 'slug'> => typeof feature === 'object')
  if (shown.length === 0) return null
  // The label on its own line, the labels side by side below it, wrapping onto a new row when there is
  // no room.
  return (
    <div className={cn('grid gap-2', className)}>
      <span className="text-ink-soft">Equipment</span>
      <ul className="flex flex-wrap gap-2">
        {shown.map((feature) => (
          <li key={feature.id} className="rounded-full border-[1.5px] border-ink px-3 py-1 text-sm font-semibold">
            {feature.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
