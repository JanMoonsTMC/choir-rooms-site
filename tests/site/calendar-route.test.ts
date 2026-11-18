// The "Add to my calendar" file (src/app/(site)/rooms/[slug]/booked/calendar/route.ts): only for a
// signed confirmation link of this room, and with nothing from the booking itself (R11).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { GET } from '../../src/app/(site)/rooms/[slug]/booked/calendar/route'
import { bookingRef } from '../../src/tasks/book-slot/receipt'
import { getTestPayload, resetCollections, resetSiteFacts } from '../setup/payload'
import { roomData, slotData } from '../setup/rooms'

const clean = ['bookings', 'timeSlots', 'rooms']

describe('the calendar file of a booking', () => {
  let p: Payload
  let bookingId: number
  let otherId: number

  const get = (slug: string, ref?: string) =>
    GET(new Request(`http://localhost/rooms/${slug}/booked/calendar${ref === undefined ? '' : `?ref=${ref}`}`), { params: Promise.resolve({ slug }) })

  beforeAll(async () => {
    p = await getTestPayload()
  })
  beforeEach(async () => {
    await resetCollections(clean)
    await resetSiteFacts()
    await p.updateGlobal({ slug: 'site-facts', data: { pricingRule: 'Test rule.', place: 'Quay Street 12, Riverside', email: 'rooms@riversidevoices.example' }, overrideAccess: true })
    const room = await p.create({ collection: 'rooms', data: { ...roomData, location: 'Second floor' } })
    const other = await p.create({ collection: 'rooms', data: { ...roomData, slug: 'other-room' } })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, '2026-10-20T17:00:00Z') })
    const otherSlot = await p.create({ collection: 'timeSlots', data: slotData(other.id, '2026-10-21T17:00:00Z') })
    bookingId = (await p.create({ collection: 'bookings', data: { timeSlot: slot.id, groupName: 'Private Group', groupSize: 8, name: 'Private Person', email: 'private@riversidevoices.example', note: 'Private note' } })).id
    otherId = (await p.create({ collection: 'bookings', data: { timeSlot: otherSlot.id, name: 'Test', email: 'test@riversidevoices.example' } })).id
  })
  afterAll(() => resetCollections(clean))

  it('a signed link gives an .ics file with the room, the time and the address, and nothing about the booker', async () => {
    const response = await get('test-room', bookingRef(bookingId))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/calendar; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="riverside-voices-test-room.ics"')
    expect(response.headers.get('cache-control')).toBe('no-store')
    const file = (await response.text()).replace(/\r\n /g, '')
    expect(file).toContain('SUMMARY:Rehearsal in Test room (Riverside Voices)')
    expect(file).toContain('DTSTART:20261020T170000Z')
    expect(file).toContain('DTEND:20261020T190000Z')
    expect(file).toContain('LOCATION:Quay Street 12\\, Riverside')
    expect(file).toContain('Second floor')
    expect(file).not.toMatch(/Private|private@/)
  })

  it('no link, a changed link, or another room\'s booking: 404, and no file', async () => {
    const [, signature] = bookingRef(bookingId).split('.')
    for (const [slug, ref] of [
      ['test-room', undefined],
      ['test-room', String(bookingId)],
      ['test-room', `${bookingId}.${signature.replace(/^./, (c) => (c === '0' ? '1' : '0'))}`],
      ['test-room', bookingRef(otherId)],
      ['no-such-room', bookingRef(bookingId)],
    ] as const) {
      const response = await get(slug, ref)
      expect(response.status, `${slug} ${ref}`).toBe(404)
      expect(await response.text()).toBe('There is no booking for this link.')
    }
  })
})
