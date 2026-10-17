// Turning the filters from the address into a question for the database: a Payload `where`.
//
// Why a separate file: the page then only asks for "the rooms that match these filters", and this small
// function can be tested without a database (tests/unit/filters.test.ts).
import type { Where } from 'payload'
import type { Filters } from './filters'

/**
 * Which rooms match the filters.
 *
 * featureId is the id of the equipment whose slug is in the address, or null when no equipment has that
 * slug. Unknown equipment matches no room at all (the list is then empty, with a way to clear the
 * filters). It is not a "page not found": the address may come from an old shared link, and the rooms
 * list itself still exists.
 */
export function roomWhere(filters: Pick<Filters, 'people' | 'feature'>, featureId: number | null): Where {
  const conditions: Where[] = []
  // A room fits a group when it holds at least that many people.
  if (filters.people) conditions.push({ capacity: { greater_than_equal: filters.people } })
  if (filters.feature) {
    // "features" holds several pieces of equipment per room (the many-to-many); `in` matches a room when
    // the equipment is one of them. Every room has an id, so "has no id" matches none of them.
    conditions.push(featureId === null ? { id: { exists: false } } : { features: { in: [featureId] } })
  }
  // No filters: an empty `where` matches every room.
  return conditions.length ? { and: conditions } : {}
}
