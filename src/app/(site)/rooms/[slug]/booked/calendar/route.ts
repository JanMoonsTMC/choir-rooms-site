// GET /rooms/<slug>/booked/calendar?ref=<booking id>.<signature>: the booking as a calendar file (.ics),
// for the "Add to my calendar" link on the confirmation page. A feature of the booking task
// (docs/decisions/calendar-file.md): any calendar app opens the file, and nothing is sent to another
// service.
//
// It answers only for a confirmation link whose signature is right (src/tasks/book-slot/receipt.ts) and
// whose booking is for THIS room, like the confirmation page. The file holds the room, the time and the
// address: never the group, a name, an e-mail address or the note.
import { getPayload } from 'payload'
import { SITE_NAME } from '@/content/riverside-voices'
import { calendarFile } from '@/lib/calendar'
import config from '@/payload.config'
import { bookingIdFromRef } from '@/tasks/book-slot/receipt'

// Read the database on every request: a booking moved or deleted in /admin shows at once.
export const dynamic = 'force-dynamic'

const NOT_FOUND = new Response('There is no booking for this link.', {
  status: 404,
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
})

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params
  const id = bookingIdFromRef(new URL(request.url).searchParams.get('ref'))
  if (id === null) return NOT_FOUND.clone()

  const payload = await getPayload({ config })
  const room = (await payload.find({ collection: 'rooms', where: { slug: { equals: slug } }, depth: 0, limit: 1, joins: false })).docs[0]
  // Bookings are private: only its time slot is read (select), never the name or e-mail address.
  const booking = await payload.findByID({ collection: 'bookings', id, depth: 0, select: { timeSlot: true }, overrideAccess: true, disableErrors: true })
  const slotId = typeof booking?.timeSlot === 'number' ? booking.timeSlot : null
  const slot = slotId === null ? null : await payload.findByID({ collection: 'timeSlots', id: slotId, depth: 0, joins: false, disableErrors: true })
  if (!room || !slot || slot.room !== room.id) return NOT_FOUND.clone()

  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0 })
  const file = calendarFile({
    uid: `booking-${id}@riversidevoices.example`,
    start: new Date(slot.startsAt),
    end: new Date(slot.endsAt),
    summary: `Rehearsal in ${room.name} (${SITE_NAME})`,
    location: facts.place,
    description: `${room.location}. To change or cancel, e-mail ${facts.email ?? 'us'} with your group and this time.`,
    now: new Date(),
  })
  return new Response(file, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="riverside-voices-${room.slug}.ics"`,
      'Cache-Control': 'no-store',
      // A booking's file is for one user: search engines should not list it.
      'X-Robots-Tag': 'noindex',
    },
  })
}
