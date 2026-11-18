// The time slots a room offers in the coming weeks, worked out from the weekly pattern in
// src/content/riverside-voices.ts (RIVERSIDE_VOICES.slots). The seed and the live-content migration use
// it, so a new database and the live site get the same kind of slots, always starting from the day they
// run: a booking needs a time slot that has not started yet.
//
// The pattern is in Brussels time (19:00 is 19:00 in Riverside, winter and summer), but the database
// keeps every time in UTC. brusselsToUtc turns one into the other, also across the change to and from
// summer time.
import { SITE_TIME_ZONE } from '@/lib/format'

export type SlotTime = { weekday: number; start: string; notIn?: readonly string[] }
export type SlotPattern = { weeksAhead: number; hours: number; places: number; times: readonly SlotTime[] }
export type ComingSlot = { roomSlug: string; startsAt: string; endsAt: string; places: number }

// The calendar date and wall-clock time in Brussels at a moment, as numbers.
function brusselsParts(moment: number) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(moment))
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute') }
}

/** The UTC moment of a Brussels date and time, for example 2026-10-20 19:00 -> 17:00 UTC (summer time). */
export function brusselsToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const wanted = Date.UTC(year, month - 1, day, hour, minute)
  let guess = wanted
  // Twice: the first guess may fall on the other side of a change to or from summer time.
  for (let round = 0; round < 2; round++) {
    const seen = brusselsParts(guess)
    const shown = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute)
    guess += wanted - shown
  }
  return new Date(guess)
}

/**
 * Every slot of every room from tomorrow (in Brussels) for `pattern.weeksAhead` weeks, earliest first.
 * Pure: the same `now` always gives the same slots, which the tests rely on.
 */
export function comingSlots(roomSlugs: readonly string[], pattern: SlotPattern, now: Date): ComingSlot[] {
  const today = brusselsParts(now.getTime())
  const slots: ComingSlot[] = []
  for (let offset = 1; offset <= pattern.weeksAhead * 7; offset++) {
    // A calendar day, counted in UTC only to step from date to date (no time zone is involved).
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset))
    const weekday = date.getUTCDay()
    for (const time of pattern.times.filter((candidate) => candidate.weekday === weekday)) {
      const [hour, minute] = time.start.split(':').map(Number)
      const start = brusselsToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute)
      const end = new Date(start.getTime() + pattern.hours * 60 * 60 * 1000)
      for (const roomSlug of roomSlugs) {
        if (time.notIn?.includes(roomSlug)) continue
        slots.push({ roomSlug, startsAt: start.toISOString(), endsAt: end.toISOString(), places: pattern.places })
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.roomSlug.localeCompare(b.roomSlug))
}
