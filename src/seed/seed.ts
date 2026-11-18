// The seed: puts the Riverside Voices example content into a new site's database, so the site has real
// rooms, equipment, time slots, pages and pictures to show from its very first day.
//
// It adds the example content ONCE PER DATABASE. After a run that finished without an error, it notes
// that in the database (one row in a small table of its own: src/seed/exampleFlag.ts). Every later run
// reads that note first and adds nothing (src/seed/run.ts):
// - each production build (scripts/build.mjs) then prints "SEED: skipped (the example content was
//   added before; your editors' changes are kept)";
// - `npm run seed` on your own computer does the same.
// So whatever editors change or delete in /admin stays that way: nothing comes back after a deploy.
// A preview database is a copy of production, note included, so it is never seeded again either.
//
// `npm run seed -- --again` adds back only the example records that are missing (it looks for each
// one: pages, equipment and rooms by slug, images by file name; time slots only for a room that has no
// coming slot at all). It never overwrites a record that exists, because an editor may have changed it,
// and the note stays.
//
// Our live site was seeded with the starter's example long before this content existed, so the seed
// never runs there again. The migration src/migrations/20261017_224621_choir_content.ts calls this same
// function once, with replaceStarterPages, to swap the example for ours (docs/decisions/live-content.md).
//
// The first editor account (from FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD) is a separate step that
// runs first, on every run: it is created only when no editor exists yet (src/seed/run.ts).
//
// To change the example content:
// - the facts (rooms, equipment, prices, the weekly time slots) are in src/content/riverside-voices.ts;
//   the words (each room's summary and description, the page texts) are below;
// - each room needs a line in SUMMARIES, its text in DESCRIPTIONS and a picture <slug>.jpg listed in
//   IMAGES (the picture itself goes in src/seed/images, with its source in SOURCES.md there);
// - after the first deploy, edit the records in /admin instead: the seed does not run again.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import type { CollectionSlug, Payload, PayloadRequest, Where } from 'payload'
import { MADE_UP_DATA_NOTICE, RIVERSIDE_VOICES, type ExampleRoom } from '../content/riverside-voices'
import { PlainError } from '../lib/plainError'
import { comingSlots } from '../tasks/book-slot/comingSlots'
import { richText } from './richText'

// true: a new site starts with the Riverside Voices example. Set it to false before your first deploy
// to start from an empty site (only the first editor is created) and add your own content in /admin.
export const ADD_EXAMPLE_CONTENT = true

// The pictures live next to this file, in src/seed/images (where they come from: SOURCES.md there).
const IMAGES_FOLDER = fileURLToPath(new URL('./images/', import.meta.url))

// Each room's picture is named after its slug. The alt text describes the picture for people who cannot
// see it (a screen reader reads it out), so it says what is in the picture, not just "a picture".
const IMAGES = [
  { filename: 'the-hall.jpg', alt: 'Drawing of a grand piano in a yellow circle, with a group of people and music staff lines' },
  { filename: 'the-studio.jpg', alt: 'Drawing of two theatre masks in a pink circle, with a music note and music staff lines' },
  { filename: 'the-loft.jpg', alt: 'Drawing of a music keyboard in a green circle, with a sun and music staff lines' },
  { filename: 'the-band-room.jpg', alt: 'Drawing of a drum in a yellow circle, with a guitar and music staff lines' },
  // The home page's picture.
  { filename: 'rehearsal-house.jpg', alt: 'Drawing of a house in a yellow circle, with a music note and music staff lines' },
  // The rooms page's picture.
  { filename: 'practice-rooms.jpg', alt: 'Drawing of a calendar with a clock in a pink circle, with a music keyboard and staff lines' },
] as const

// The pictures are drawings our team made from Lucide icons. The Lucide licence (ISC) asks that its
// notice goes with the icons; the about page ends with this line (the same facts as
// src/seed/images/SOURCES.md).
const PICTURE_CREDITS = {
  icons: { text: 'Lucide icons', url: 'https://lucide.dev' },
  licence: { text: 'ISC licence', url: 'https://lucide.dev/license' },
}

// Who each room suits, in one sentence: shown in lists and at the top of the room's page. Not its size,
// price, place or equipment: those are fields, and the pages show them from there.
const SUMMARIES: Record<ExampleRoom['slug'], string> = {
  'the-hall': 'Our big rehearsal hall, for full choirs and orchestras, and for a run-through before a concert.',
  'the-studio': 'A bright room for chamber choirs, ensembles and theatre groups who rehearse movement.',
  'the-loft': 'A quiet room under the roof for small ensembles, sectionals and singing lessons.',
  'the-band-room': 'A soundproofed room in the basement for bands who play loud.',
}

// What the room is like, in a few sentences: the room's description. Prose only: no size, price, place
// or list of equipment, and not the pricing rule. Those are fields of the room, its equipment or the
// Site facts global, and the room's page shows them from there. Typed here as well, a copy would stay
// behind, out of date, when an editor changed the field in /admin.
const DESCRIPTIONS: Record<ExampleRoom['slug'], string[]> = {
  'the-hall': [
    'The Hall is where Riverside Voices rehearses and gives its house concerts. It has a high ceiling and a warm sound that carries a full choir without a microphone.',
    'Chairs and music stands are stacked along the side wall; put them back the way you found them.',
  ],
  'the-studio': [
    'The Studio looks out on the garden and has a sprung wooden floor, so you can move, dance and run a scene without disturbing the room below.',
  ],
  'the-loft': [
    'The Loft is the smallest and quietest room in the house, under the sloping roof. It suits a small group that wants to work on details.',
  ],
  'the-band-room': [
    'The Band Room is built for loud music: you can rehearse at full volume while a choir sings upstairs. Bring your own instruments, sticks and cables.',
  ],
}

function roomDescription(room: ExampleRoom) {
  return richText(DESCRIPTIONS[room.slug].map((paragraph) => ({ paragraph })))
}

export const PAGES = [
  {
    title: 'Riverside Voices',
    slug: 'home',
    intro:
      'Riverside Voices is a city choir with its own rehearsal house on Quay Street. Four of its rooms are free most of the week: book one for your choir, band or theatre group.',
    // No body: everything else on the home page comes from its own record: the rooms, the equipment and
    // the pricing rule from the Site facts global.
  },
  {
    title: 'About Riverside Voices',
    slug: 'about',
    intro: 'Who we are, why we share our rehearsal house and how booking works.',
    body: richText([
      {
        paragraph:
          'Riverside Voices is a fictional city choir of about forty-five singers. We rehearse on Thursday evenings in our own house on Quay Street.',
      },
      { heading: 'Why we share our rooms' },
      {
        paragraph:
          'The house has more rooms than one choir needs. The rest of the week, other choirs, bands and theatre groups rehearse there, and their rent keeps the heating on for everyone.',
      },
      { heading: 'How booking works' },
      // No numbers here: each room's page shows its price and size from its record.
      {
        paragraph:
          "Each room is booked in time slots of two hours, one group at a time. Choose a room, a free time slot and fill in your group's details. You pay nothing online: the choir's treasurer sends an invoice after your rehearsal.",
      },
      { heading: 'Where to find us' },
      // A link, not the address: the Contact page shows the place from the Site facts global.
      { paragraph: ['See the ', { text: 'Contact page', url: '/contact' }, '.'] },
      { heading: 'Picture credits' },
      {
        paragraph: [
          'The pictures on this site are drawings our team made from ',
          PICTURE_CREDITS.icons,
          ', shared under the ',
          PICTURE_CREDITS.licence,
          '.',
        ],
      },
    ]),
  },
  {
    title: 'Contact',
    slug: 'contact',
    intro: 'Questions about a room or a booking? Send us an e-mail.',
    // Prose only: the Contact page shows the e-mail address and the place from the Site facts global.
    body: richText([
      { paragraph: 'There is no contact form on this site: send an e-mail instead. To change or cancel a booking, write to us with your group and the time you booked.' },
      {
        paragraph:
          'This site is a practice project, so the e-mail address above is not a real one: it ends in .example, a name set aside for examples, and nothing sent to it arrives anywhere.',
      },
    ]),
  },
  // When you add a field to the booking form or change the analytics, change this page in /admin too:
  // the seed never changes a page that exists. (The migration 20261018_*_privacy_analytics brought the
  // two parts about analytics and the calendar file to the live site.)
  {
    title: 'Privacy',
    slug: 'privacy',
    intro: 'What this site keeps about you, why, who can see it and for how long.',
    body: richText([
      { heading: 'What the booking form saves' },
      {
        paragraph:
          "When you book a room, the site saves your group's name and size, your name, your e-mail address, the time slot you chose and your note, if you wrote one. It saves them to hold the room for your group and to send the invoice.",
      },
      { heading: 'Who can see it' },
      {
        paragraph:
          "Only the site's editors, who log in to /admin. If you have an account on this site, you can also see your own bookings after you log in.",
      },
      { heading: 'How long it is kept' },
      { paragraph: 'Until an editor deletes it.' },
      { heading: 'Stopping spam' },
      {
        paragraph:
          'When you send a form, the site keeps a scrambled code made from your internet (IP) address, for one hour, to stop anyone who sends forms too often. The address itself is not stored.',
      },
      { heading: 'Counting visits' },
      {
        paragraph:
          'We count page views with Vercel Web Analytics, to see which rooms groups look at. It sets no cookies and keeps no name, e-mail address or internet address; it tells visits apart for at most 24 hours with a scrambled code. A booking confirmation is counted without its booking reference.',
      },
      { heading: 'The calendar file' },
      {
        paragraph:
          'The "Add to my calendar" file is made by this site itself, not by another service. It holds only the room, the time and the address of your booking.',
      },
            { heading: 'Cookies' },
      {
        paragraph:
          'This site sets cookies only for people who log in, such as an editor in /admin: one to keep them logged in, and one that remembers the look they chose for /admin.',
      },
      { heading: 'A practice project' },
      { paragraph: MADE_UP_DATA_NOTICE },
    ]),
  },
]

// On Vercel, uploaded images must go to a Vercel Blob store: the build machine's own disk is thrown away
// after the build. Without the store's token there is nowhere to keep them.
export const NO_BLOB_STORE_MESSAGE =
  'Images cannot be stored: this Vercel project has no Blob store connected. In Vercel: Storage → Create Storage → Blob (Public), connect it to Production only, with its read-write token (Settings → Environment Variables then lists BLOB_READ_WRITE_TOKEN), then Redeploy.'

export type SeedResult = { created: number; skipped: number }

export type SeedOptions = {
  /** Where it looks for VERCEL and BLOB_READ_WRITE_TOKEN (normally process.env; a test can pass its own). */
  env?: Record<string, string | undefined>
  /** The migration's request: every write then belongs to the migration's database transaction. */
  req?: Partial<PayloadRequest>
  /** "Now", for the coming time slots (a test can pretend another day). */
  now?: Date
  /**
   * false: add no pictures (the rooms are saved without one). The live-content migration passes false
   * on a preview, which has no Blob store.
   */
  images?: boolean
  /**
   * true: overwrite the four pages and the Site facts with ours, even when they exist. Only for the
   * migration that replaces the starter's example on the live site; never for an ordinary seed run.
   */
  replaceStarterPages?: boolean
}

// The id of a record the seed found or created a moment ago. A missing one is a mistake in the facts
// (for example an equipment slug with a typo), so stop with a clear message instead of saving a broken link.
function idOf(ids: Map<string, number>, key: string): number {
  const id = ids.get(key)
  if (id === undefined) throw new PlainError(`The seed has no record called "${key}": check src/content/riverside-voices.ts.`)
  return id
}

// Is `stored` the file `wanted`, perhaps under a number Payload added? When a file with the same name
// is already in the upload folder, Payload saves the new one as the-hall-1.jpg (then -2, …), and that is
// still the Hall's picture.
function sameImage(stored: string | null | undefined, wanted: string): boolean {
  if (!stored) return false
  const { name, ext } = path.parse(wanted)
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escape(name)}(-\\d+)?${escape(ext)}$`, 'i').test(stored)
}

/**
 * Adds the Riverside Voices example content that is missing, and leaves everything that exists alone.
 * Returns how many records it created and how many it found already there (the time slots count one by
 * one when they are added, and as one when a room already has coming slots).
 */
export async function seed(payload: Payload, options: SeedOptions = {}): Promise<SeedResult> {
  const { env = process.env, req, now = new Date(), images = true, replaceStarterPages = false } = options
  const result: SeedResult = { created: 0, skipped: 0 }

  // overrideAccess: true - the seed is the site's own code, run by the build or by you, not a request
  // from a user. The access rules (only editors may create content) are for requests; here there is no
  // logged-in editor to check, so the seed is allowed to create content directly.
  async function findOne(collection: CollectionSlug, where: Where) {
    const found = await payload.find({ collection, where, limit: 1, depth: 0, overrideAccess: true, req })
    return found.docs[0] as { id: number | string } | undefined
  }

  // Creates a record only when `existing` is missing. Returns its id either way, so the next records
  // can link to it (a room to its equipment and its picture).
  async function keepOrCreate(existing: { id: number | string } | undefined, create: () => Promise<{ id: number }>) {
    if (existing) {
      result.skipped += 1
      return Number(existing.id)
    }
    const record = await create()
    result.created += 1
    return record.id
  }

  // 1. Which pictures are there already? Found by their base name (see sameImage).
  const imageIds = new Map<string, number>()
  if (images) {
    const existingImages = new Map<string, { id: number | string }>()
    for (const image of IMAGES) {
      const { name } = path.parse(image.filename)
      const candidates = await payload.find({
        collection: 'media',
        where: { filename: { contains: name } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
        req,
      })
      const found = candidates.docs.find((media) => sameImage(media.filename, image.filename))
      if (found) existingImages.set(image.filename, found)
    }

    // Before creating anything: on Vercel, an image can only be stored in a Blob store. Stop now, with
    // nothing created, so the next deploy (with the store connected) starts cleanly.
    if (existingImages.size < IMAGES.length && env.VERCEL && !env.BLOB_READ_WRITE_TOKEN) throw new PlainError(NO_BLOB_STORE_MESSAGE)

    // 2. The pictures first: the rooms link to them.
    for (const image of IMAGES) {
      const id = await keepOrCreate(existingImages.get(image.filename), () =>
        payload.create({
          collection: 'media',
          data: { alt: image.alt },
          filePath: path.join(IMAGES_FOLDER, image.filename),
          overrideAccess: true,
          req,
        }),
      )
      imageIds.set(image.filename, id)
    }
  }

  // 3. The equipment: the rooms link to it.
  const featureIds = new Map<string, number>()
  for (const feature of RIVERSIDE_VOICES.features) {
    const id = await keepOrCreate(await findOne('features', { slug: { equals: feature.slug } }), () =>
      payload.create({ collection: 'features', data: { ...feature }, overrideAccess: true, req }),
    )
    featureIds.set(feature.slug, id)
  }

  // 4. The rooms, each with its equipment (the many-to-many) and its picture.
  const roomIds = new Map<string, number>()
  for (const room of RIVERSIDE_VOICES.rooms) {
    const id = await keepOrCreate(await findOne('rooms', { slug: { equals: room.slug } }), () =>
      payload.create({
        collection: 'rooms',
        data: {
          name: room.name,
          slug: room.slug,
          capacity: room.capacity,
          price: room.price,
          location: room.location,
          summary: SUMMARIES[room.slug],
          description: roomDescription(room),
          // Without pictures (images: false) the room is saved without one; an editor can add it later.
          image: imageIds.get(`${room.slug}.jpg`),
          features: room.features.map((slug) => idOf(featureIds, slug)),
        },
        overrideAccess: true,
        req,
      }),
    )
    roomIds.set(room.slug, id)
  }

  // 5. The coming time slots, for every room that has none yet.
  const counted = await addComingSlots(payload, roomIds, { now, req })
  result.created += counted.created
  result.skipped += counted.skipped

  // 6. The pages. replaceStarterPages: the starter's example pages are overwritten with ours.
  for (const page of PAGES) {
    const existing = await findOne('pages', { slug: { equals: page.slug } })
    if (existing && replaceStarterPages) {
      await payload.update({
        collection: 'pages',
        id: existing.id,
        // body: null removes the starter's home page text, which ours does not have.
        data: { title: page.title, intro: page.intro, body: 'body' in page ? page.body : null },
        overrideAccess: true,
        req,
      })
      result.created += 1
      continue
    }
    await keepOrCreate(existing, () => payload.create({ collection: 'pages', data: page, overrideAccess: true, req }))
  }

  // 7. The Site facts: the facts several pages show, kept in one place. A global always "exists" (it
  // reads as empty until it is first saved), so an empty pricing rule means it was never filled in.
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0, overrideAccess: true, req })
  if (facts.pricingRule && !replaceStarterPages) {
    result.skipped += 1
  } else {
    await payload.updateGlobal({
      slug: 'site-facts',
      data: { pricingRule: RIVERSIDE_VOICES.pricingRule, place: RIVERSIDE_VOICES.place, email: RIVERSIDE_VOICES.email },
      overrideAccess: true,
      req,
    })
    result.created += 1
  }

  return result
}

/**
 * Adds the coming time slots (RIVERSIDE_VOICES.slots, from tomorrow) for each room in `roomIds` that has
 * no time slot after `now` yet. A room that already has one is left alone (an editor may have planned
 * its slots by hand). Returns how many slots it added, and how many rooms it left alone.
 *
 * All slots go in with ONE database statement: one by one, through Payload, a few hundred slots took
 * minutes on the live database, longer than the build allows the migration step.
 */
export async function addComingSlots(
  payload: Payload,
  roomIds: Map<string, number>,
  { now = new Date(), req }: { now?: Date; req?: Partial<PayloadRequest> } = {},
): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 }
  const needSlots: string[] = []
  for (const [slug, id] of roomIds) {
    const coming = await payload.count({
      collection: 'timeSlots',
      where: { room: { equals: id }, startsAt: { greater_than: now.toISOString() } },
      overrideAccess: true,
      req,
    })
    if (coming.totalDocs > 0) result.skipped += 1
    else needSlots.push(slug)
  }
  const slots = comingSlots(needSlots, RIVERSIDE_VOICES.slots, now)
  if (slots.length === 0) return result

  // Inside the migration, the statement must run in its transaction: Payload keeps the transaction's
  // database session under the request's transactionID.
  // (The same look-up as Payload's own getTransaction in @payloadcms/drizzle.)
  const adapter = payload.db as unknown as PostgresAdapter
  const transactionID = req?.transactionID ? await req.transactionID : undefined
  const database = (transactionID !== undefined && adapter.sessions?.[transactionID]?.db) || adapter.drizzle
  const rows = slots.map(
    (slot) => sql`(${idOf(roomIds, slot.roomSlug)}, ${slot.startsAt}, ${slot.endsAt}, ${slot.places}, now(), now())`,
  )
  await database.execute(
    sql`INSERT INTO "time_slots" ("room_id", "starts_at", "ends_at", "places", "updated_at", "created_at") VALUES ${sql.join(rows, sql`, `)}`,
  )
  result.created += slots.length
  return result
}
