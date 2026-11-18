// The rooms list, /rooms: every practice room with its size, price and equipment, each linking to its
// own page, where it can be booked.
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { Notice } from '@/components/site/Notice'
import { PageTitle } from '@/components/site/PageTitle'
import { RoomCard } from '@/components/site/RoomCard'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rooms',
  description: 'The Riverside Voices practice rooms: how many people each holds, what it costs and its equipment.',
}

export default async function RoomsPage() {
  const payload = await getPayload({ config })
  // Smallest first: a group reads down until a room is big enough.
  const rooms = (
    await payload.find({
      collection: 'rooms',
      sort: 'capacity',
      // depth 1 fetches each room's picture and equipment with it; of the equipment, only its name and slug.
      depth: 1,
      populate: { features: { name: true, slug: true } },
      joins: false,
      limit: 100,
    })
  ).docs
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0 })

  return (
    <div className="pb-6">
      <PageTitle title="Rooms" intro="Four practice rooms, from a small room for a band to the hall for a full choir. Open a room to see its free time slots and book it." />
      <section aria-labelledby="all-rooms" className="grid gap-block">
        <h2 id="all-rooms" className="text-2xl">
          {rooms.length === 0 ? 'No rooms yet' : `All rooms — ${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'}`}
        </h2>
        {rooms.length > 0 && (
          <ul className="grid gap-block lg:grid-cols-2">
            {rooms.map((room) => (
              <li key={room.id} className="grid">
                <RoomCard room={room} />
              </li>
            ))}
          </ul>
        )}
        {facts.pricingRule && (
          <Notice>
            <p>{facts.pricingRule}</p>
          </Notice>
        )}
      </section>
    </div>
  )
}
