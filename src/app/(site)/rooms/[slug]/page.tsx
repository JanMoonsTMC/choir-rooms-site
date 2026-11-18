// One room's page, /rooms/<slug>: our primary task, "book a practice room for a time slot". It shows
// the room (its size, price, place and equipment, each from where it is kept once) and the booking form
// with the room's coming time slots and whether each is still free. The checks and the save are in
// src/tasks/book-slot/ (see its README.md).
//
// Bookings are private: this page reads only HOW MANY bookings each slot has, never a name or an
// e-mail address.
import { randomUUID } from 'node:crypto'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'
import { BookingForm } from '@/components/site/BookingForm'
import { ButtonLink } from '@/components/site/ButtonLink'
import { FeatureList } from '@/components/site/FeatureList'
import { Notice } from '@/components/site/Notice'
import { PageTitle } from '@/components/site/PageTitle'
import { ParentLink } from '@/components/site/ParentLink'
import { capacityLabel, formatPrice, formatSlotTime, imageFrom } from '@/lib/format'
import { membersAreaOn, signedInMember } from '@/lib/membersArea'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// How far ahead the form offers time slots: the next two weeks, so the list stays short enough to read
// on a phone. Later slots appear as the days pass.
const SHOWN_DAYS = 14

type Props = { params: Promise<{ slug: string }> }

// cache(): the page and its browser-tab title ask for the same record once per visit.
const findRoom = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const found = await payload.find({
    collection: 'rooms',
    where: { slug: { equals: slug } },
    // depth 1 fetches the picture and the equipment with it; of the equipment, only its name and slug.
    depth: 1,
    populate: { features: { name: true, slug: true } },
    joins: false,
    limit: 1,
  })
  return found.docs[0]
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await findRoom((await params).slug)
  if (!room) return {}
  return { title: room.name, description: room.summary }
}

export default async function RoomPage({ params }: Props) {
  const room = await findRoom((await params).slug)
  // No room with this slug: the "not found" page, which explains and offers a way on.
  if (!room) notFound()
  const payload = await getPayload({ config })

  // The room's time slots that have not started yet, in the next SHOWN_DAYS days, earliest first.
  const now = new Date()
  const until = new Date(now.getTime() + SHOWN_DAYS * 24 * 60 * 60 * 1000)
  const upcoming = await payload.find({
    collection: 'timeSlots',
    where: { room: { equals: room.id }, startsAt: { greater_than: now.toISOString(), less_than: until.toISOString() } },
    sort: 'startsAt',
    depth: 0,
    limit: 100,
    joins: false,
  })
  // The bookings of those slots, in one question to the database. Bookings are private, so this
  // server code reads them with overrideAccess: true, and `select` fetches only which slot each one is
  // for: never a name or an e-mail address. (No slots: nothing to ask.)
  const booked = upcoming.docs.length === 0 ? { docs: [] } : await payload.find({
    collection: 'bookings',
    where: { timeSlot: { in: upcoming.docs.map((slot) => slot.id) } },
    select: { timeSlot: true },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  // How many bookings each slot has: slot id -> number of bookings.
  const taken = new Map<number, number>()
  for (const booking of booked.docs) {
    const slotId = booking.timeSlot as number
    taken.set(slotId, (taken.get(slotId) ?? 0) + 1)
  }
  // For each slot: its time in words and how many places are left.
  const slots = upcoming.docs.map((slot) => ({
    id: slot.id,
    label: formatSlotTime(slot.startsAt, slot.endsAt),
    placesLeft: Math.max(0, slot.places - (taken.get(slot.id) ?? 0)),
    places: slot.places,
  }))
  const allBooked = slots.length > 0 && slots.every((slot) => slot.placesLeft === 0)

  // The place and the pricing rule, from the Site facts global (src/globals/SiteFacts.ts).
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0 })

  // The optional members' area (src/lib/membersArea.ts): who is logged in, so the form can say that
  // this booking will be saved to their account and fill in their name and e-mail address. While the
  // area is off this asks for nothing at all - not the request's headers, and not the members
  // collection - and the form below is exactly the one everyone else sees.
  const member = membersAreaOn() ? await signedInMember(payload, await headers()) : null

  return (
    <article className="pb-6">
      <ParentLink href="/rooms" label="Rooms" current={room.name} />
      <PageTitle title={room.name} intro={room.summary} image={imageFrom(room.image)} imageAccent="purple" className="mt-3 sm:mt-4" />

      <div className="grid gap-block lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* First in the page (a phone shows it first), on the right on wide screens. */}
        <section aria-labelledby="facts" className="framed grid gap-4 p-6 offset-purple lg:col-start-2 lg:row-start-1">
          <h2 id="facts" className="text-xl">At a glance</h2>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
            <dt className="text-ink-soft">Size</dt>
            <dd className="font-semibold">{capacityLabel(room.capacity)}</dd>
            <dt className="text-ink-soft">Price</dt>
            <dd className="font-semibold">{`${formatPrice(room.price)} per time slot`}</dd>
            <dt className="text-ink-soft">In the house</dt>
            <dd className="min-w-0 font-semibold [overflow-wrap:anywhere]">{room.location}</dd>
            {facts.place && (
              <>
                <dt className="text-ink-soft">Address</dt>
                <dd className="min-w-0 font-semibold [overflow-wrap:anywhere]">{facts.place}</dd>
              </>
            )}
          </dl>
          <FeatureList features={room.features} />
          {facts.pricingRule && (
            <Notice>
              <p>{facts.pricingRule}</p>
            </Notice>
          )}
        </section>

        <div className="grid content-start gap-block lg:col-start-1 lg:row-start-1">
          {room.description && (
            <section aria-labelledby="about" className="grid gap-3">
              <h2 id="about" className="text-2xl">About this room</h2>
              <div className="rich-text">
                <RichText data={room.description} disableContainer />
              </div>
            </section>
          )}

          <section aria-labelledby="book" className="framed grid gap-5 p-5 offset-coral sm:p-8">
            <h2 id="book" className="text-2xl">Book a time slot</h2>
            {slots.length === 0 ? (
              <Notice tone="warning" label="No times yet">
                <p>This room has no free time slots in the next two weeks. Check back soon, or look at the other rooms.</p>
                <ButtonLink href="/rooms" variant="secondary" className="mt-2 w-fit">All rooms</ButtonLink>
              </Notice>
            ) : allBooked ? (
              <Notice tone="warning" label="Fully booked">
                <p className="font-semibold">Every time slot in the next two weeks is booked.</p>
                <p>Check this page again later, or look at the other rooms.</p>
                <ButtonLink href="/rooms" variant="secondary" className="mt-2 w-fit">All rooms</ButtonLink>
              </Notice>
            ) : (
              // The time slots are shown inside the form, by SlotPicker (src/components/site/SlotPicker.tsx).
              // requestId: a new random code for each form, so the same form sent twice saves one booking.
              <BookingForm room={room.slug} slots={slots} requestId={randomUUID()} member={member && { name: member.name ?? '', email: member.email }} />
            )}
          </section>
        </div>
      </div>
    </article>
  )
}
