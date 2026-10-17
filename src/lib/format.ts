// Small helpers that turn stored values into the words users read. Every page uses these, so a price
// or a time looks the same everywhere on the site (and you change the format here, once).
import type { Media } from '@/payload-types'

// The time zone every time on the site is shown in: the house's own. The database keeps UTC.
export const SITE_TIME_ZONE = 'Europe/Brussels'

/** 35 -> "EUR 35". */
export function formatPrice(euros: number): string {
  return `EUR ${euros}`
}

/** A room's size in words: "Up to 12 people". The room filter's choices use the same words. */
export function capacityLabel(capacity: number): string {
  return `Up to ${capacity} people`
}

// The day and the clock time in Brussels, the two parts every time slot is written with.
function brusselsDay(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: SITE_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}
function brusselsClock(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: SITE_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date)
}

/**
 * When a time slot is, as people in Brussels read it: "Tuesday 20 October, 19:00–21:00", or
 * "Tuesday 20 October, 19:00" without an end. The database keeps every time in UTC (world time), which
 * is 1 hour behind Brussels in winter and 2 in summer, so the stored value is always turned into Brussels
 * time first. The list, the form and the confirmation all use this, so a slot reads the same everywhere.
 */
export function formatSlotTime(startsAt: string | Date, endsAt?: string | Date | null): string {
  const start = new Date(startsAt)
  const from = `${brusselsDay(start)}, ${brusselsClock(start)}`
  return endsAt ? `${from}–${brusselsClock(new Date(endsAt))}` : from
}

/**
 * Whether a time slot can still be booked, in words. A room takes one group per slot, so its slot is
 * "Free" or "Booked". A slot an editor gave more places says how many are left: "2 places left".
 */
export function placesLabel(placesLeft: number, places = 1): string {
  if (placesLeft <= 0) return 'Booked'
  if (places <= 1) return 'Free'
  return placesLeft === 1 ? '1 place left' : `${placesLeft} places left`
}

/**
 * An image record from the media library, ready for next/image: its address, its description (alt)
 * and its size. Returns null when there is no image, or it was only stored as a number (depth 0).
 */
export function imageFrom(media: number | Media | null | undefined) {
  if (!media || typeof media !== 'object' || !media.url) return null
  return { src: media.url, alt: media.alt, width: media.width ?? 1200, height: media.height ?? 800 }
}
