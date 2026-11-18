// What this is: a room's equipment as a row of links under a visible "Equipment" label, each to the
// equipment's own page (/equipment/<slug>), where every room that has it is listed: the many-to-many
// between rooms and equipment, read from the other side.
import type { Feature } from '@/payload-types'
import { cn } from '@/lib/utils'
import { ButtonLink } from './ButtonLink'

// A piece of equipment as Payload returns it: the whole record, or only its id when the query did not go
// deep enough to fetch it. Only whole records can be shown (they have a name and a slug).
type FeatureLike = number | Pick<Feature, 'id' | 'name' | 'slug'>

export const featureHref = (slug: string) => `/equipment/${slug}`

export function FeatureList({ features, className }: { features?: FeatureLike[] | null; className?: string }) {
  const shown = (features ?? []).filter((feature): feature is Pick<Feature, 'id' | 'name' | 'slug'> => typeof feature === 'object')
  if (shown.length === 0) return null
  // The label on its own line, the links side by side below it, wrapping onto a new row when there is
  // no room.
  return (
    <div className={cn('grid gap-2', className)}>
      <span className="text-ink-soft">Equipment</span>
      <ul className="flex flex-wrap gap-2">
        {shown.map((feature) => (
          <li key={feature.id}>
            {/* min-h-11: 44 px high, a target a finger can hit easily. */}
            <ButtonLink href={featureHref(feature.slug)} variant="secondary" size="sm" className="min-h-11 rounded-full">
              {feature.name}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
