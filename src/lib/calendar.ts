// The calendar file for one booking: an iCalendar (.ics) file, the format every calendar app opens
// (RFC 5545). A feature of the booking task: it needs no account, no key and no other service, because
// the site makes the file itself (docs/decisions/calendar-file.md).
//
// It holds only public facts: the room, the start and end, and the address. Never the group, a name, an
// e-mail address or the note: the file may be forwarded, and it is made from the confirmation link alone.

export type CalendarEvent = {
  // A unique, stable id for this booking's event, so opening the file twice updates one event.
  uid: string
  start: Date
  end: Date
  summary: string
  location?: string | null
  description?: string | null
  // When the file was made (DTSTAMP).
  now: Date
}

/** A moment in UTC, the way iCalendar writes it: 20261020T170000Z. */
function utc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Text as iCalendar needs it: a backslash before \ ; and , and line breaks as \n. */
function text(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/**
 * Long lines folded the iCalendar way: at most 75 characters, each next part on a new line that starts
 * with a space. (Our texts are short and plain; counting characters is enough for them.)
 */
function fold(line: string): string {
  if (line.length <= 75) return line
  // The first line holds 75 characters; each next one 74, after its leading space.
  const parts = [line.slice(0, 75)]
  for (let at = 75; at < line.length; at += 74) parts.push(line.slice(at, at + 74))
  return parts.join('\r\n ')
}

/** The whole .ics file, with the CRLF line endings the standard asks for. */
export function calendarFile(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Riverside Voices//Practice rooms//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utc(event.now)}`,
    `DTSTART:${utc(event.start)}`,
    `DTEND:${utc(event.end)}`,
    `SUMMARY:${text(event.summary)}`,
    ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${text(event.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(fold).join('\r\n')}\r\n`
}
