// The room filters, without a database: reading them from the address (filters.ts) and turning them
// into a database question (queries.ts).
import { describe, expect, it } from 'vitest'
import { filterQuery, filterSummary, parseFilters } from '../../src/tasks/find-room/filters'
import { roomWhere } from '../../src/tasks/find-room/queries'

describe('parseFilters', () => {
  it('reads a group size we offer and an equipment slug', () => {
    expect(parseFilters({ people: '25', feature: 'upright-piano' })).toEqual({ people: 25, feature: 'upright-piano', unknown: [] })
  })

  it('an empty value is no filter: what the form sends for "Any size" and "Any equipment"', () => {
    expect(parseFilters({ people: '', feature: '' })).toEqual({ people: null, feature: null, unknown: [] })
  })

  it('leaves out a size we do not offer, a value that cannot be a slug, and parts that are not filters', () => {
    expect(parseFilters({ people: '500', feature: '<script>', utm_source: 'mail' })).toEqual({ people: null, feature: null, unknown: ['people', 'feature', 'utm_source'] })
    expect(parseFilters({ people: '12.0' }).people).toBeNull()
    expect(parseFilters({ people: '-8' }).people).toBeNull()
  })

  it('takes the first value when a part repeats, without spaces and in lower case', () => {
    expect(parseFilters({ people: [' 12 ', '60'], feature: ['Grand-Piano', 'x'] })).toEqual({ people: 12, feature: 'grand-piano', unknown: [] })
  })
})

describe('filterQuery and filterSummary', () => {
  it('puts the filters back into an address, or nothing without filters', () => {
    expect(filterQuery({ people: 25, feature: 'upright-piano' })).toBe('?people=25&feature=upright-piano')
    expect(filterQuery({ people: null, feature: 'drum-kit-and-amplifiers' })).toBe('?feature=drum-kit-and-amplifiers')
    expect(filterQuery({ people: null, feature: null })).toBe('')
  })

  it('says the filters and the count in words', () => {
    expect(filterSummary(null, null, 4)).toBe('All rooms — 4 rooms')
    expect(filterSummary(25, null, 2)).toBe('Rooms for up to 25 people — 2 rooms')
    expect(filterSummary(null, 'Drum kit and amplifiers', 1)).toBe('Rooms with Drum kit and amplifiers — 1 room')
    expect(filterSummary(12, 'Upright piano', 2)).toBe('Rooms for up to 12 people with Upright piano — 2 rooms')
  })
})

describe('roomWhere', () => {
  it('no filters: every room', () => {
    expect(roomWhere({ people: null, feature: null }, null)).toEqual({})
  })

  it('a group size: rooms that hold at least that many', () => {
    expect(roomWhere({ people: 25, feature: null }, null)).toEqual({ and: [{ capacity: { greater_than_equal: 25 } }] })
  })

  it('equipment: rooms that have it; unknown equipment matches no room', () => {
    expect(roomWhere({ people: null, feature: 'upright-piano' }, 7)).toEqual({ and: [{ features: { in: [7] } }] })
    expect(roomWhere({ people: null, feature: 'harp' }, null)).toEqual({ and: [{ id: { exists: false } }] })
  })

  it('both at once', () => {
    expect(roomWhere({ people: 12, feature: 'upright-piano' }, 7)).toEqual({ and: [{ capacity: { greater_than_equal: 12 } }, { features: { in: [7] } }] })
  })
})
