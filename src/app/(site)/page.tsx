// The home page. It leads to the two things a user comes to do: book a room (the primary task) and find
// the room that fits their group. Everything on it comes from the records editors keep in /admin (the
// home page's title and intro, the rooms, the equipment, and the pricing rule in the Site facts global),
// never from a copy typed here, so a price changed in /admin is right on every page at once.
import { getPayload } from 'payload'
import { ButtonLink } from '@/components/site/ButtonLink'
import { Hero } from '@/components/site/Hero'
import { Notice } from '@/components/site/Notice'
import { RoomCard } from '@/components/site/RoomCard'
import { SITE_NAME } from '@/content/riverside-voices'
import { imageFrom } from '@/lib/format'
import config from '@/payload.config'

// Read the database on every visit, never once while the site is built: editors' changes then show
// at once, and the build needs no database.
export const dynamic = 'force-dynamic'

// The home page's picture, from the media library. To use another one, upload it in /admin and put
// its file name here.
const HOME_IMAGE = 'rehearsal-house'

export default async function HomePage() {
  const payload = await getPayload({ config })
  // One after the other, not all at once: simple to read, and quick enough for a page this small.
  const home = (await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1 })).docs[0]
  const picture = (await payload.find({ collection: 'media', where: { filename: { contains: HOME_IMAGE } }, limit: 1 })).docs[0]
  const rooms = (
    await payload.find({
      collection: 'rooms',
      sort: 'capacity',
      depth: 1,
      populate: { features: { name: true, slug: true } },
      joins: false,
      limit: 50,
    })
  ).docs
  // The equipment, as quick links into the filtered rooms list.
  const features = (await payload.find({ collection: 'features', sort: 'name', depth: 0, joins: false, limit: 50 })).docs
  // The facts several pages share, such as the pricing rule (src/globals/SiteFacts.ts).
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0 })

  return (
    <div className="grid gap-section pt-6 sm:pt-10">
      <Hero
        title={home?.title ?? SITE_NAME}
        text={home?.intro}
        image={imageFrom(picture)}
        actions={
          <>
            <ButtonLink href="/rooms" variant="accent" size="lg">Find and book a room</ButtonLink>
            <ButtonLink href="/about" variant="secondary" size="lg">How booking works</ButtonLink>
          </>
        }
      />

      {features.length > 0 && (
        <section aria-labelledby="need" className="grid gap-4">
          <h2 id="need" className="text-2xl">What does your group need?</h2>
          <ul className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <li key={feature.id}>
                {/* min-h-11: 44 px high, a target a finger can hit easily. */}
                <ButtonLink href={`/rooms?feature=${feature.slug}#results`} variant="secondary" size="sm" className="min-h-11 rounded-full">
                  {feature.name}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="rooms" className="grid gap-block">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="rooms" className="text-2xl">Our rooms</h2>
          <ButtonLink href="/rooms" variant="link">All rooms</ButtonLink>
        </div>
        {rooms.length === 0 ? (
          <p>The rooms will be listed here soon.</p>
        ) : (
          <ul className="grid gap-block sm:grid-cols-2">
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
