// What this is: the two filters above the rooms list, group size and equipment, in a plain form.
// method="get" puts the choices in the address (/rooms?people=…&feature=…), so it works without
// JavaScript, a filtered list can be shared, and Back returns to it. Nothing happens until "Show rooms":
// the page does not jump while someone is still choosing, and the keyboard focus stays where it is.
import type { Feature } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { capacityLabel } from '@/lib/format'
import { GROUP_SIZES, type Filters } from '@/tasks/find-room/filters'
import { ButtonLink } from './ButtonLink'

type RoomFiltersProps = {
  features: Pick<Feature, 'id' | 'name' | 'slug'>[]
  filters: Pick<Filters, 'people' | 'feature'>
}

export function RoomFilters({ features, filters }: RoomFiltersProps) {
  const filtered = Boolean(filters.people || filters.feature)
  return (
    <form
      method="get"
      // #results: after "Show rooms" the browser scrolls down to the results, so on a phone the user sees
      // them at once instead of the top of the page again.
      action="/rooms#results"
      aria-label="Find the room that fits your group"
      className="grid gap-5 rounded-panel bg-river-wash p-5 sm:p-6 md:grid-cols-[1fr_1fr_auto] md:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="filter-people">Group size</Label>
        <NativeSelect id="filter-people" name="people" defaultValue={filters.people ? String(filters.people) : ''}>
          <NativeSelectOption value="">Any size</NativeSelectOption>
          {GROUP_SIZES.map((size) => (
            <NativeSelectOption key={size} value={String(size)}>{capacityLabel(size)}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="filter-feature">Equipment</Label>
        <NativeSelect id="filter-feature" name="feature" defaultValue={filters.feature ?? ''}>
          <NativeSelectOption value="">Any equipment</NativeSelectOption>
          {features.map((feature) => (
            <NativeSelectOption key={feature.id} value={feature.slug}>{feature.name}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Show rooms</Button>
        {filtered && <ButtonLink href="/rooms" variant="secondary">Clear filters</ButtonLink>}
      </div>
    </form>
  )
}
