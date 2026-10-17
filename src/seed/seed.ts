// The seed: puts the Riverside Voices example content into a new site's database, so the site has real
// workshops, topics, prices, pages and images to show from its very first day.
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
// one: pages, topics and workshops by slug, repairs by name, images by file name). It never overwrites
// a record that exists, because an editor may have changed it, and the note stays.
//
// The first editor account (from FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD) is a separate step that
// runs first, on every run: it is created only when no editor exists yet (src/seed/run.ts).
//
// It creates no room booking, no time slots and no bookings: an editor adds the room booking in
// /admin, with its time slots.
//
// To replace the example with your own content:
// - before your first deploy: change the facts in src/content/riverside-voices.ts and the page texts
//   below; after it, edit the records in /admin instead (the seed does not run again);
// - each workshop needs a line in SUMMARIES, its text in DESCRIPTIONS and a photo <slug>.jpg listed
//   in IMAGES (the photo itself goes in src/seed/images, with its source in SOURCES.md there);
// - to start from an empty site, set ADD_EXAMPLE_CONTENT to false before your first deploy: the first
//   editor is still created. After it, delete the example records in /admin (they do not come back).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CollectionSlug, Payload, Where } from 'payload'
import { MADE_UP_DATA_NOTICE, RIVERSIDE_VOICES, type ExampleWorkshop } from '../content/riverside-voices'
import { PlainError } from '../lib/plainError'
import { richText } from './richText'

// true: a new site starts with the Riverside Voices example. Set it to false before your first deploy to
// start from an empty site (only the first editor is created) and add your own content in /admin. After
// your first deploy, changing it changes nothing: delete the example records in /admin instead (they
// do not come back).
export const ADD_EXAMPLE_CONTENT = true

// The pictures live next to this file, in src/seed/images (where they come from: SOURCES.md there).
const IMAGES_FOLDER = fileURLToPath(new URL('./images/', import.meta.url))

// Each workshop's picture is named after its slug. The alt text describes the picture for people who
// cannot see it (a screen reader reads it out), so it says what is in the picture, not just "a picture".
const IMAGES = [
  {
    filename: 'warm-up-your-voice.jpg',
    alt: 'Drawing of a singer’s microphone in a yellow circle, with a music note and staff lines',
  },
  {
    filename: 'read-music-from-scratch.jpg',
    alt: 'Drawing of an open book in a green circle, with two music notes and staff lines',
  },
  {
    filename: 'sight-sing-a-new-piece.jpg',
    alt: 'Drawing of two music notes in a pink circle, with an open book and staff lines',
  },
  {
    filename: 'breathe-for-long-phrases.jpg',
    alt: 'Drawing of three gusts of wind in a green circle, with a microphone and staff lines',
  },
  // The home page's picture.
  {
    filename: 'rehearsal-house.jpg',
    alt: 'Drawing of a house in a yellow circle, with a music note and staff lines',
  },
  // The room booking page's picture: the booking is not in the seed, but its picture is ready for it.
  {
    filename: 'practice-rooms.jpg',
    alt: 'Drawing of a calendar with a clock in a pink circle, with a music keyboard and staff lines',
  },
] as const

// The pictures are drawings our team made from Lucide icons. The Lucide licence (ISC) asks that its
// notice goes with the icons; the about page ends with this line (the same facts as
// src/seed/images/SOURCES.md).
const PICTURE_CREDITS = {
  icons: { text: 'Lucide icons', url: 'https://lucide.dev' },
  licence: { text: 'ISC licence', url: 'https://lucide.dev/license' },
}

// What each workshop teaches, in one sentence: shown in lists and at the top of the workshop's page.
// Not its level: the level is a field, and the lists show it next to this sentence from there.
const SUMMARIES: Record<ExampleWorkshop['slug'], string> = {
  'warm-up-your-voice': 'Learn a short warm-up you can do before every rehearsal.',
  'read-music-from-scratch': 'Learn to follow your own part in a choir score.',
  'sight-sing-a-new-piece': 'Learn to sing a new piece from the page, without hearing it first.',
  'breathe-for-long-phrases': 'Learn to breathe so that a long phrase stays steady to the end.',
}

// What you learn and do in each workshop, in a few sentences: the workshop's description. Prose only:
// no day, time, place, group size, price or level, and not the pricing rule. Those are fields of the
// workshop or of the Site facts global, and the workshop's page shows them from there. Typed here as
// well, a copy would stay behind, out of date, when an editor changed the field in /admin.
const DESCRIPTIONS: Record<ExampleWorkshop['slug'], string[]> = {
  'warm-up-your-voice': [
    'You learn a warm-up that wakes up your body, your breath and your voice, step by step.',
    'Then you sing a few short rounds together, so you hear how much easier the first song becomes.',
  ],
  'read-music-from-scratch': [
    'You learn to find your own line in a choir score, to count the beats and to see whether the notes go up or down, so you can follow along from the first rehearsal.',
  ],
  'sight-sing-a-new-piece': [
    'You learn to look through a new piece before you sing it: the key, the rhythm and the hard places. Then you sing it together from the page.',
  ],
  'breathe-for-long-phrases': [
    'A long phrase runs out of breath when you breathe high and fast. You learn to breathe low and slowly, and to spend your breath evenly to the end of the phrase.',
  ],
}

function workshopDescription(workshop: ExampleWorkshop) {
  return richText(DESCRIPTIONS[workshop.slug].map((paragraph) => ({ paragraph })))
}

const PAGES = [
  {
    title: 'Riverside Voices',
    slug: 'home',
    // No word about booking a room here: the room booking is not in the seed, and until an editor adds
    // it the home page says "Room booking opens soon".
    intro:
      'Riverside Voices is a city choir with its own rehearsal house on Quay Street. We share it: other choirs, bands and theatre groups rehearse in our rooms, and singers join our short workshops.',
    // No body: everything else on the home page comes from its own record: the workshops, the room
    // booking, and the pricing rule from the Site facts global.
  },
  {
    title: 'About Riverside Voices',
    slug: 'about',
    intro: 'Who we are, why we share our rehearsal house and where to find us.',
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
      { heading: 'The workshops' },
      // No numbers here: each workshop's own page shows its facts from its record.
      {
        paragraph:
          "Our singers also run short workshops in small groups, for anyone who sings. Each workshop's page gives its day, price and group size.",
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
    intro: 'Questions about a room, a booking or a workshop? Send us an e-mail.',
    // Prose only: the Contact page shows the e-mail address and the place from the Site facts global.
    body: richText([
      { paragraph: 'There is no contact form on this site: send an e-mail instead.' },
      {
        paragraph:
          'This site is a practice project, so the e-mail address above is not a real one: it ends in .example, a name set aside for examples, and nothing sent to it arrives anywhere.',
      },
    ]),
  },
  // When you add a field to the booking form or switch on analytics, change this page in /admin too:
  // the seed never changes a page that exists.
  {
    title: 'Privacy',
    slug: 'privacy',
    intro: 'What this site keeps about you, why, who can see it and for how long.',
    body: richText([
      { heading: 'What the booking form saves' },
      {
        paragraph:
          'When you book a time slot, the site saves your name, your e-mail address, the time slot you chose and your note, if you wrote one. It saves them to hold the room for your group.',
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

// The id of a record the seed found or created a moment ago. A missing one is a mistake in this file
// (for example a topic slug with a typo), so stop with a clear message instead of saving a broken link.
function idOf(ids: Map<string, number>, key: string): number {
  const id = ids.get(key)
  if (id === undefined)
    throw new PlainError(
      `The seed has no record called "${key}": check src/content/riverside-voices.ts.`,
    )
  return id
}

function imageOf(ids: Map<string, number>, workshop: ExampleWorkshop): number {
  const id = ids.get(`${workshop.slug}.jpg`)
  if (id === undefined) {
    throw new PlainError(
      `The workshop "${workshop.slug}" has no photo. Every workshop needs a photo named <slug>.jpg, listed in IMAGES in src/seed/seed.ts: add ${workshop.slug}.jpg to src/seed/images and to IMAGES.`,
    )
  }
  return id
}

// Is `stored` the file `wanted`, perhaps under a number Payload added? When a file with the same name
// is already in the upload folder, Payload saves the new one as warm-up-your-voice-1.jpg (then -2, …),
// and that is still the warm-up picture.
function sameImage(stored: string | null | undefined, wanted: string): boolean {
  if (!stored) return false
  const { name, ext } = path.parse(wanted)
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escape(name)}(-\\d+)?${escape(ext)}$`, 'i').test(stored)
}

/**
 * Adds the Riverside Voices example content that is missing, and leaves everything that exists alone.
 * Returns how many records it created and how many it found already there.
 *
 * `env` is where it looks for VERCEL and BLOB_READ_WRITE_TOKEN (normally process.env; a test can pass
 * its own).
 */
export async function seed(
  payload: Payload,
  { env = process.env }: { env?: Record<string, string | undefined> } = {},
): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 }

  // overrideAccess: true - the seed is the site's own code, run by the build or by you, not a request
  // from a user. The access rules (only editors may create content) are for requests; here there is no
  // logged-in editor to check, so the seed is allowed to create content directly.
  async function findOne(collection: CollectionSlug, where: Where) {
    const found = await payload.find({
      collection,
      where,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return found.docs[0] as { id: number | string } | undefined
  }

  // Creates a record only when `existing` is missing. Returns its id either way, so the next records
  // can link to it (a workshop to its topics and its image).
  async function keepOrCreate(
    existing: { id: number | string } | undefined,
    create: () => Promise<{ id: number }>,
  ) {
    if (existing) {
      result.skipped += 1
      return Number(existing.id)
    }
    const record = await create()
    result.created += 1
    return record.id
  }

  // 1. Which images are there already? Found by their base name (see sameImage).
  const existingImages = new Map<string, { id: number | string }>()
  for (const image of IMAGES) {
    const { name } = path.parse(image.filename)
    const candidates = await payload.find({
      collection: 'media',
      where: { filename: { contains: name } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    const found = candidates.docs.find((media) => sameImage(media.filename, image.filename))
    if (found) existingImages.set(image.filename, found)
  }

  // Before creating anything: on Vercel, an image can only be stored in a Blob store. Stop now, with
  // nothing created, so the next deploy (with the store connected) starts cleanly.
  const uploadsImages = existingImages.size < IMAGES.length
  if (uploadsImages && env.VERCEL && !env.BLOB_READ_WRITE_TOKEN)
    throw new PlainError(NO_BLOB_STORE_MESSAGE)

  // 2. The images first: the workshops link to them.
  const imageIds = new Map<string, number>()
  for (const image of IMAGES) {
    const id = await keepOrCreate(existingImages.get(image.filename), () =>
      payload.create({
        collection: 'media',
        data: { alt: image.alt },
        filePath: path.join(IMAGES_FOLDER, image.filename),
        overrideAccess: true,
      }),
    )
    imageIds.set(image.filename, id)
  }

  // 3. The topics: the workshops link to them too.
  const topicIds = new Map<string, number>()
  for (const topic of RIVERSIDE_VOICES.topics) {
    const id = await keepOrCreate(await findOne('topics', { slug: { equals: topic.slug } }), () =>
      payload.create({ collection: 'topics', data: { ...topic }, overrideAccess: true }),
    )
    topicIds.set(topic.slug, id)
  }

  // 4. The workshops, each with its topics (the many-to-many) and its image.
  for (const workshop of RIVERSIDE_VOICES.workshops) {
    await keepOrCreate(await findOne('workshops', { slug: { equals: workshop.slug } }), () =>
      payload.create({
        collection: 'workshops',
        data: {
          title: workshop.title,
          slug: workshop.slug,
          level: workshop.level,
          day: workshop.day,
          startTime: workshop.startTime,
          // Only when the facts give one: the other workshops have no end time.
          ...('endTime' in workshop ? { endTime: workshop.endTime } : {}),
          // Only the gear workshop has a latest end ("ends by 15:00"): a limit, not an end time.
          ...('latestEnd' in workshop ? { latestEnd: workshop.latestEnd } : {}),
          price: workshop.price,
          groupSize: RIVERSIDE_VOICES.groupSize,
          summary: SUMMARIES[workshop.slug],
          description: workshopDescription(workshop),
          image: imageOf(imageIds, workshop),
          topics: workshop.topics.map((slug) => idOf(topicIds, slug)),
        },
        overrideAccess: true,
      }),
    )
  }

  // 5. The room booking's price list.
  for (const repair of RIVERSIDE_VOICES.repairs) {
    await keepOrCreate(await findOne('repairs', { name: { equals: repair.name } }), () =>
      payload.create({ collection: 'repairs', data: { ...repair }, overrideAccess: true }),
    )
  }

  // 6. The pages.
  for (const page of PAGES) {
    await keepOrCreate(await findOne('pages', { slug: { equals: page.slug } }), () =>
      payload.create({ collection: 'pages', data: page, overrideAccess: true }),
    )
  }

  // 7. The Site facts: the facts several pages show, kept in one place. A global always "exists" (it
  // reads as empty until it is first saved), so an empty pricing rule means it was never filled in.
  const facts = await payload.findGlobal({ slug: 'site-facts', depth: 0, overrideAccess: true })
  if (facts.pricingRule) {
    result.skipped += 1
  } else {
    await payload.updateGlobal({
      slug: 'site-facts',
      data: { pricingRule: RIVERSIDE_VOICES.pricingRule, place: RIVERSIDE_VOICES.place, email: RIVERSIDE_VOICES.email },
      overrideAccess: true,
    })
    result.created += 1
  }

  return result
}
