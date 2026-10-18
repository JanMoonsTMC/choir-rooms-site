// The rooms list, /rooms: the second task, "find the room that fits your group", by group size and
// equipment. The two filters are in the address (/rooms?people=25&feature=upright-piano), so a filtered
// list can be shared, bookmarked and reached again with Back, and the page works without JavaScript.
// Reading the address: src/tasks/find-room/filters.ts. The database question: queries.ts there.
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import { cache } from 'react'
import { ButtonLink } from '@/components/site/ButtonLink'
import { Notice } from '@/components/site/Notice'
import { PageTitle } from '@/components/site/PageTitle'
import { RoomCard } from '@/components/site/RoomCard'
import { RoomFilters } from '@/components/site/RoomFilters'
import { TrackStep } from '@/components/site/TrackStep'
import config from '@/payload.config'
import { filterQuery, filterSummary, parseFilters, type GroupSize, type SearchParams } from '@/tasks/find-room/filters'
import { roomWhere } from '@/tasks/find-room/queries'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<SearchParams> }

// cache(): the page and its browser-tab title (generateMetadata) both need the same list. With cache()
// the database is asked once per visit and both get that answer.
const findRooms = cache(async (people: GroupSize | null, featureSlug: string | null) => {
  const payload = await getPayload({ config })
  const features = (await payload.find({ collection: 'features', sort: 'name', depth: 0, limit: 100, joins: false })).docs
  // The equipment named in the address, if any has that slug. An old link may name one that is gone.
  const feature = featureSlug ? features.find((candidate) => candidate.slug === featureSlug) : undefined
  const rooms = (
    await payload.find({
      collection: 'rooms',
      where: roomWhere({ people, feature: featureSlug }, feature?.id ?? null),
      // Smallest first: a group reads down until a room is big enough.
      sort: 'capacity',
      // depth 1 fetches each room's picture and equipment with it; of the equipment, only its name and slug.
      depth: 1,
      populate: { features: { name: true, slug: true } },
      joins: false,
      limit: 100,
    })
  ).docs
  return { features, feature, rooms }
})

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { people, feature } = parseFilters(await searchParams)
  const found = await findRooms(people, feature)
  // The tab title names the filters and the count: a screen reader reads it out when the page opens.
  let title = 'Rooms'
  if (found.rooms.length === 0) title = 'No rooms match these filters'
  else if (people || feature) title = filterSummary(people, found.feature?.name ?? null, found.rooms.length)
  return { title, description: 'Find the Riverside Voices practice room that fits your group, by size and equipment.' }
}

export default async function RoomsPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams)
  const { features, feature, rooms } = await findRooms(filters.people, filters.feature)
  // Carried to each room's page, so its Back link returns to this same filtered list.
  const query = filterQuery(filters)
  const payload = await getPayload({ config })
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0 })

  return (
    <div className="pb-6">
      {/* The analytics step "filter_used" (src/lib/analytics.ts), when the user applied filters. Only the
          chosen group size and equipment this site has are sent. once={query}: each choice of filters
          counts once per browser tab, also after a reload or Back. key: a new choice starts a fresh
          TrackStep. */}
      {(filters.people || filters.feature) && (
        <TrackStep key={query} event="filter_used" once={query} props={{ people: filters.people ? String(filters.people) : '', feature: feature?.slug ?? '' }} />
      )}
      <PageTitle
        title="Rooms"
        intro="Four practice rooms, from a soundproofed room for a band to the hall for a full choir. Choose your group's size and what you need, then open a room to book it."
      />
      <div className="grid gap-block">
        <RoomFilters features={features} filters={filters} />
        {/* id="results": the form's "#results" scrolls here after Show rooms. scroll-mt-6 keeps a little
            space above the line. */}
        <section id="results" aria-labelledby="results-summary" className="grid scroll-mt-6 gap-block">
          {/* Show rooms loads a new page, and a screen reader then reads the browser tab's title, which
              names the filters and the count (generateMetadata, above). role="status" is there for a
              later version that updates the list without a new page. */}
          <div role="status" className="grid gap-2">
            <h2 id="results-summary" className="text-2xl">
              {rooms.length > 0 ? filterSummary(filters.people, feature?.name ?? null, rooms.length) : 'No rooms match these filters'}
            </h2>
            {rooms.length === 0 && (
              <p className="max-w-(--container-reading)">
                {filters.feature && !feature
                  ? `This site has no equipment called "${filters.feature}". The link may be out of date. `
                  : 'None of our rooms has everything you chose. '}
                Choose a smaller group size or other equipment, or see all rooms.
              </p>
            )}
          </div>
          {rooms.length > 0 ? (
            <ul className="grid gap-block sm:grid-cols-2">
              {rooms.map((room) => (
                <li key={room.id} className="grid">
                  <RoomCard room={room} query={query} />
                </li>
              ))}
            </ul>
          ) : (
            <ButtonLink href="/rooms" variant="secondary" className="w-fit">Clear filters</ButtonLink>
          )}
          {facts.pricingRule && (
            <Notice>
              <p>{facts.pricingRule}</p>
            </Notice>
          )}
        </section>
      </div>
    </div>
  )
}
