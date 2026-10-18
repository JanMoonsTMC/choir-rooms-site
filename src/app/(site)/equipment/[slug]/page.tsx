// One piece of equipment's page, /equipment/<slug>: its name, its description and the rooms that have
// it. The list comes from the equipment's "rooms" field, the reverse side of each room's "features"
// (src/collections/Features.ts): the same links, read from the other end of the many-to-many.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { cache } from 'react'
import { ButtonLink } from '@/components/site/ButtonLink'
import { PageTitle } from '@/components/site/PageTitle'
import { ParentLink } from '@/components/site/ParentLink'
import { RoomCard } from '@/components/site/RoomCard'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

// cache(): the page and its browser-tab title ask for the same records once per visit.
const findFeature = cache(async (slug: string) => {
  const payload = await getPayload({ config })
  const feature = (
    await payload.find({
      collection: 'features',
      where: { slug: { equals: slug } },
      depth: 0,
      joins: { rooms: { sort: 'capacity', limit: 100 } },
      limit: 1,
    })
  ).docs[0]
  if (!feature) return undefined
  // The join gives the links: which rooms have this equipment. It does not bring each room's picture and
  // other equipment with it, so a second question fetches those for the cards, the same way the rooms
  // list does.
  const ids = (feature.rooms?.docs ?? []).map((room) => (typeof room === 'object' ? room.id : room))
  const found = ids.length
    ? (
        await payload.find({
          collection: 'rooms',
          where: { id: { in: ids } },
          sort: 'capacity',
          depth: 1,
          populate: { features: { name: true, slug: true } },
          joins: false,
          limit: ids.length,
        })
      ).docs
    : []
  return { feature, rooms: found }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const feature = (await findFeature((await params).slug))?.feature
  if (!feature) return {}
  return { title: `${feature.name} · Equipment`, description: feature.description ?? undefined }
}

export default async function FeaturePage({ params }: Props) {
  const found = await findFeature((await params).slug)
  if (!found) notFound()
  const { feature, rooms } = found

  return (
    <div className="pb-6">
      <ParentLink href="/equipment" label="Equipment" current={feature.name} />
      <PageTitle title={feature.name} intro={feature.description} tone="plum" className="mt-3 sm:mt-4" />
      <section aria-labelledby="feature-rooms" className="grid gap-block">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="feature-rooms" className="text-2xl">
            {rooms.length === 0
              ? 'No room has this yet'
              : `Rooms with ${feature.name} — ${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'}`}
          </h2>
          <ButtonLink href={`/rooms?feature=${feature.slug}`} variant="link">
            Filter the rooms by this equipment
          </ButtonLink>
        </div>
        {rooms.length > 0 && (
          <ul className="grid gap-block sm:grid-cols-2">
            {rooms.map((room) => (
              <li key={room.id} className="grid">
                <RoomCard room={room} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
