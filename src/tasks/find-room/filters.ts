// Reading the room filters from the web address, for example /rooms?people=25&feature=upright-piano.
//
// Why the filters live in the address: a filtered list can then be shared and bookmarked (one member
// chooses, another books), the browser's Back button returns to it, and the form works without
// JavaScript (a plain GET form only changes the address). The price of that: anyone can type anything
// into an address, and an old shared link may name equipment that no longer exists. So this file reads
// the address carefully and never throws: a value it cannot use is left out and reported in `unknown`,
// and the page shows what it can.
import { SLUG_FORMAT } from '../../collections/fields'

// The group sizes a user can choose: "Up to 8 people" and so on. A room fits when it holds at least that
// many. They follow our rooms' sizes (8, 12, 25 and 60 people), so each choice narrows the list.
export const GROUP_SIZES = [8, 12, 25, 60] as const
export type GroupSize = (typeof GROUP_SIZES)[number]

export type Filters = {
  people: GroupSize | null
  feature: string | null
  // The names of the address's parts that were left out: a filter with a value this site does not use
  // (people=500), or a part that is not a filter at all.
  unknown: string[]
}

// What Next.js gives a page as its searchParams: each part once (a string), repeated (an array), or
// missing.
export type SearchParams = Record<string, string | string[] | undefined>

// The first value when a part repeats (?feature=a&feature=b), without spaces around it.
function firstValue(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first.trim().toLowerCase() : ''
}

export function parseFilters(searchParams: SearchParams): Filters {
  const filters: Filters = { people: null, feature: null, unknown: [] }
  for (const [name, value] of Object.entries(searchParams ?? {})) {
    const text = firstValue(value)
    if (name === 'people') {
      // An empty value means "Any size": that is what the form sends when no size is chosen.
      const size = Number(text)
      if ((GROUP_SIZES as readonly number[]).includes(size) && /^\d+$/.test(text)) filters.people = size as GroupSize
      else if (text) filters.unknown.push(name)
    } else if (name === 'feature') {
      // SLUG_FORMAT is the rule for a slug in /admin: anything else, such as "<script>", cannot be one.
      if (SLUG_FORMAT.test(text) && text.length <= 100) filters.feature = text
      else if (text) filters.unknown.push(name)
    } else {
      filters.unknown.push(name)
    }
  }
  return filters
}

/**
 * The filters as the end of an address: "?people=25&feature=upright-piano", or "" when there are none.
 * Links from the list to a room carry it forward, so the room's "Back" link can return to the same
 * filtered list (no JavaScript needed).
 */
export function filterQuery({ people, feature }: Pick<Filters, 'people' | 'feature'>): string {
  const query = new URLSearchParams()
  if (people) query.set('people', String(people))
  if (feature) query.set('feature', feature)
  const text = query.toString()
  return text ? `?${text}` : ''
}

/**
 * The active filters and the number of results, in words: "Rooms for up to 25 people with an Upright
 * piano — 2 rooms". The list page shows it above the results and in the browser tab's title, so a screen
 * reader announces it when the page opens.
 */
export function filterSummary(people: GroupSize | null, featureName: string | null, count: number): string {
  const which = people ? `Rooms for up to ${people} people` : featureName ? 'Rooms' : 'All rooms'
  const withFeature = featureName ? ` with ${featureName}` : ''
  return `${which}${withFeature} — ${count} ${count === 1 ? 'room' : 'rooms'}`
}
