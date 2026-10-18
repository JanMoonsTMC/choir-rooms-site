// The calendar file (src/lib/calendar.ts), without a database.
import { describe, expect, it } from 'vitest'
import { calendarFile } from '../../src/lib/calendar'

const event = {
  uid: 'booking-42@riversidevoices.example',
  start: new Date('2026-10-20T17:00:00Z'),
  end: new Date('2026-10-20T19:00:00Z'),
  summary: 'Rehearsal in The Loft (Riverside Voices)',
  location: 'Riverside Voices house, Quay Street 12, Riverside',
  description: 'Second floor; no lift. To change or cancel, e-mail rooms@riversidevoices.example.',
  now: new Date('2026-10-18T08:30:00Z'),
}

describe('calendarFile', () => {
  it('is one VEVENT in a VCALENDAR, with times in UTC and CRLF line endings', () => {
    const file = calendarFile(event)
    expect(file.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(file.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
    expect(file).toContain('\r\nUID:booking-42@riversidevoices.example\r\n')
    expect(file).toContain('\r\nDTSTAMP:20261018T083000Z\r\n')
    expect(file).toContain('\r\nDTSTART:20261020T170000Z\r\n')
    expect(file).toContain('\r\nDTEND:20261020T190000Z\r\n')
    expect(file.replace(/\r\n/g, '').includes('\n')).toBe(false)
  })

  it('escapes commas and semicolons in text, and folds lines longer than 75 characters', () => {
    const file = calendarFile(event)
    expect(file).toContain('LOCATION:Riverside Voices house\\, Quay Street 12\\, Riverside')
    for (const line of file.split('\r\n')) expect(line.length, line).toBeLessThanOrEqual(75)
    // Unfolded (a line break followed by a space removed), the description is whole again.
    expect(file.replace(/\r\n /g, '')).toContain('DESCRIPTION:Second floor\\; no lift. To change or cancel\\, e-mail rooms@riversidevoices.example.')
  })

  it('leaves out an empty place or description', () => {
    const file = calendarFile({ ...event, location: null, description: '' })
    expect(file).not.toContain('LOCATION')
    expect(file).not.toContain('DESCRIPTION')
  })
})
