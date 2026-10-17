import { readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Payload } from 'payload'
import { BOOKING_CONFIRMATION, MADE_UP_DATA_NOTICE, RIVERSIDE_VOICES } from '../../src/content/riverside-voices'
import { exampleWasAdded } from '../../src/seed/exampleFlag'
import { runSeed } from '../../src/seed/run'
import { NO_BLOB_STORE_MESSAGE, seed } from '../../src/seed/seed'
import { forgetExampleAdded, getTestPayload, resetCollections, resetSiteFacts } from '../setup/payload'
import { refuseUnlessThrowAwayTestDatabase } from '../setup/safety'

// These tests delete every user and every example record: never on a real database.
refuseUnlessThrowAwayTestDatabase()

// Children before parents: the database refuses to delete a parent that still has linked records.
const clean = ['bookings', 'timeSlots', 'rooms', 'features', 'pages', 'media', 'users']
// Eight weeks of slots: every week has 5 weekday evenings in 4 rooms (but no Thursday slot in the Hall)
// and 2 Saturday slots in 4 rooms: 19 + 8 = 27 a week.
const SLOTS = 8 * 27
// 6 pictures + 8 pieces of equipment + 4 rooms + the slots + 4 pages + the Site facts global.
const ALL_RECORDS = 6 + 8 + 4 + SLOTS + 4 + 1
// A second run keeps them all, and counts each room's slots as one (the room already has coming slots).
const KEPT = 6 + 8 + 4 + 4 + 4 + 1

// The test config stores uploads in a temporary folder (tests/setup/config.ts). Empty it together with
// the media records, so every test uploads the pictures afresh under their own file names.
const uploadFolder = (p: Payload) => String(p.collections.media.config.upload.staticDir)

function emptyUploadFolder(p: Payload) {
  const folder = uploadFolder(p)
  for (const name of readdirSync(folder)) rmSync(path.join(folder, name), { recursive: true, force: true })
}

async function resetAll() {
  await resetCollections(clean)
  await forgetExampleAdded()
  await resetSiteFacts()
  emptyUploadFolder(await getTestPayload())
}

// The facts, copied by hand from our documents (docs/brief.md, docs/requirements.md and the decision
// records), and on purpose NOT imported from src/content/riverside-voices.ts: if that file drifts from
// what we agreed, the seeded site drifts with it, and only an independent copy notices.
const FACT_SHEET = {
  rooms: [
    { name: 'The Hall', capacity: 60, price: 60, features: ['Choir risers', 'Grand piano', 'Sound system', 'Step-free access'] },
    { name: 'The Studio', capacity: 25, price: 35, features: ['Sound system', 'Step-free access', 'Upright piano', 'Wall mirrors'] },
    { name: 'The Loft', capacity: 12, price: 20, features: ['Upright piano'] },
    { name: 'The Band Room', capacity: 8, price: 25, features: ['Drum kit and amplifiers', 'Sound system', 'Soundproofing'] },
  ],
  // The many-to-many from the other side: which rooms have each piece of equipment.
  features: {
    'upright-piano': ['The Loft', 'The Studio'],
    'sound-system': ['The Band Room', 'The Hall', 'The Studio'],
    'step-free-access': ['The Hall', 'The Studio'],
    'drum-kit-and-amplifiers': ['The Band Room'],
  },
  place: 'Riverside Voices house, Quay Street 12, Riverside',
  email: 'rooms@riversidevoices.example',
}

const count = async (p: Payload, collection: 'rooms' | 'features' | 'timeSlots' | 'pages' | 'media' | 'users') =>
  (await p.count({ collection, overrideAccess: true })).totalDocs

async function countAll(p: Payload) {
  const counts: Record<string, number> = {}
  // One after the other: the in-memory test database serves one query at a time.
  for (const collection of ['rooms', 'features', 'timeSlots', 'pages', 'media', 'users'] as const) {
    counts[collection] = await count(p, collection)
  }
  return counts
}

const html = (value: unknown) => convertLexicalToHTML({ data: value as SerializedEditorState, disableContainer: true })

async function bySlug<T extends 'pages' | 'rooms' | 'features'>(p: Payload, collection: T, slug: string) {
  const found = await p.find({ collection, where: { slug: { equals: slug } }, depth: 1 })
  expect(found.docs, `${collection} ${slug}`).toHaveLength(1)
  return found.docs[0]
}

describe('the Riverside Voices seed', () => {
  beforeEach(resetAll)
  afterAll(resetAll)

  it('creates every example record once; a second run creates nothing and adds no booking', async () => {
    const p = await getTestPayload()
    expect(await seed(p)).toEqual({ created: ALL_RECORDS, skipped: 0 })
    expect(await seed(p)).toEqual({ created: 0, skipped: KEPT })
    expect(await countAll(p)).toEqual({ rooms: 4, features: 8, timeSlots: SLOTS, pages: 4, media: 6, users: 0 })
    expect(await p.count({ collection: 'bookings', overrideAccess: true })).toEqual({ totalDocs: 0 })
    // The upload folder holds each picture once: the second run uploaded nothing.
    expect(readdirSync(uploadFolder(p)).sort()).toEqual([
      'practice-rooms.jpg',
      'rehearsal-house.jpg',
      'the-band-room.jpg',
      'the-hall.jpg',
      'the-loft.jpg',
      'the-studio.jpg',
    ])
  })

  it('stores the rooms exactly as in RIVERSIDE_VOICES, each with a summary, a description in words and its own picture', async () => {
    const p = await getTestPayload()
    await seed(p)
    for (const fact of RIVERSIDE_VOICES.rooms) {
      const room = await bySlug(p, 'rooms', fact.slug)
      expect(room).toMatchObject({ name: fact.name, capacity: fact.capacity, price: fact.price, location: fact.location })
      expect(room.summary.length).toBeGreaterThan(30)
      expect(html(room.description).length).toBeGreaterThan(80)
      expect(room.image).toMatchObject({ filename: `${fact.slug}.jpg` })
      expect(typeof room.image === 'object' && room.image?.alt.length).toBeGreaterThan(20)
    }
  })

  it('links rooms and equipment in both directions, as our facts assign them', async () => {
    const p = await getTestPayload()
    await seed(p)
    for (const [slug, rooms] of Object.entries(FACT_SHEET.features)) {
      const feature = await bySlug(p, 'features', slug)
      // The reverse side (the join on features) shows the rooms whose "features" name it.
      const names = (feature.rooms?.docs ?? []).map((room) => (typeof room === 'object' ? room.name : room))
      expect([...names].sort(), slug).toEqual(rooms)
    }
    for (const fact of FACT_SHEET.rooms) {
      const room = (await p.find({ collection: 'rooms', where: { name: { equals: fact.name } }, depth: 1 })).docs[0]
      expect({ name: room.name, capacity: room.capacity, price: room.price }).toEqual({ name: fact.name, capacity: fact.capacity, price: fact.price })
      const names = (room.features ?? []).map((feature) => (typeof feature === 'object' ? feature.name : feature))
      expect([...names].sort(), fact.name).toEqual(fact.features)
    }
  })

  it('adds two-hour time slots from tomorrow for eight weeks, one group each, and none on Thursday evening in the Hall', async () => {
    const p = await getTestPayload()
    // A fixed day, so the test is the same every day: Monday 26 October 2026, the day after summer time ends.
    const now = new Date('2026-10-26T09:00:00Z')
    await seed(p, { now })
    const slots = (await p.find({ collection: 'timeSlots', depth: 1, pagination: false, sort: 'startsAt' })).docs
    expect(slots).toHaveLength(SLOTS)
    // The first: Tuesday 27 October, 19:00 in Brussels (winter time: 18:00 UTC), two hours, one place.
    expect(slots[0]).toMatchObject({ startsAt: '2026-10-27T18:00:00.000Z', endsAt: '2026-10-27T20:00:00.000Z', places: 1 })
    // The last: 56 days after the first day, Monday 21 December, 19:00 in Brussels.
    expect(slots.at(-1)?.startsAt).toBe('2026-12-21T18:00:00.000Z')
    const hallOnThursday = slots.filter(
      (slot) => typeof slot.room === 'object' && slot.room.slug === 'the-hall' && new Date(slot.startsAt).getUTCDay() === 4,
    )
    expect(hallOnThursday).toEqual([])
    // No slot on a Sunday.
    expect(slots.filter((slot) => new Date(slot.startsAt).getUTCDay() === 0)).toEqual([])
  })

  it('writes the four pages: the privacy page has the made-up-data notice, the about page the picture credits', async () => {
    const p = await getTestPayload()
    await seed(p)
    const home = await bySlug(p, 'pages', 'home')
    expect(home.title).toBe('Riverside Voices')
    expect(home.intro).toBeTruthy()
    const privacy = html((await bySlug(p, 'pages', 'privacy')).body)
    expect(privacy).toContain(MADE_UP_DATA_NOTICE)
    expect(privacy).toContain('<h2>A practice project</h2>')
    expect(privacy).toContain("your group&#39;s name and size, your name, your e-mail address")
    expect(MADE_UP_DATA_NOTICE).toBe('This is a practice project: use made-up details; no one will contact you.')
    const about = html((await bySlug(p, 'pages', 'about')).body)
    expect(about).toContain('<h2>Picture credits</h2>')
    expect(about).toContain('<a href="https://lucide.dev">Lucide icons</a>')
    expect(about).toContain('<a href="https://lucide.dev/license">ISC licence</a>')
    expect(about).toContain('<a href="/contact">Contact page</a>')
    // The home page has no text of its own below the intro: everything else on it comes from records.
    expect(home.body ?? null).toBeNull()
    expect(BOOKING_CONFIRMATION).toBe(`Your booking is saved. ${MADE_UP_DATA_NOTICE}`)
    // Nothing left of the example the starter came with, in any page.
    for (const page of (await p.find({ collection: 'pages', limit: 10 })).docs) {
      expect(JSON.stringify(page), page.slug).not.toMatch(/bicycle|campus|workshop/i)
    }
  })

  it('one source per fact: no room description or page text repeats a price, a size, the place, the e-mail or the pricing rule', async () => {
    const p = await getTestPayload()
    await seed(p)
    const repeatedFacts = [/EUR\s*\d/i, /\d+\s*EUR\b/i, /€\s*\d/, /\d+\s*euros?\b/i, /\b\d+ people\b/i, /Quay Street 12/, /riversidevoices\.example/i, /rooms@/i, /invoice after your rehearsal\.$/]
    const texts: [string, string][] = []
    for (const room of (await p.find({ collection: 'rooms', limit: 10 })).docs) {
      texts.push([`room ${room.slug}`, html(room.description)])
      texts.push([`room summary ${room.slug}`, room.summary])
    }
    for (const page of (await p.find({ collection: 'pages', limit: 10 })).docs) {
      if (page.body) texts.push([`page ${page.slug}`, html(page.body)])
    }
    for (const [name, text] of texts) {
      for (const fact of repeatedFacts) expect(text, `${name} repeats ${fact}`).not.toMatch(fact)
    }
    expect(await p.findGlobal({ slug: 'site-facts' })).toMatchObject({ place: FACT_SHEET.place, email: FACT_SHEET.email, pricingRule: RIVERSIDE_VOICES.pricingRule })
  })

  it('never overwrites a record an editor has changed, and leaves a room with planned slots alone', async () => {
    const p = await getTestPayload()
    await seed(p)
    const room = await bySlug(p, 'rooms', 'the-loft')
    const page = await bySlug(p, 'pages', 'about')
    await p.update({ collection: 'rooms', id: room.id, data: { name: 'The Loft (changed by an editor)' } })
    await p.update({ collection: 'pages', id: page.id, data: { intro: 'An intro an editor wrote.' } })
    await p.updateGlobal({ slug: 'site-facts', data: { place: 'Room 12 (changed by an editor)' }, overrideAccess: true })
    expect(await seed(p)).toEqual({ created: 0, skipped: KEPT })
    expect((await bySlug(p, 'rooms', 'the-loft')).name).toBe('The Loft (changed by an editor)')
    expect((await bySlug(p, 'pages', 'about')).intro).toBe('An intro an editor wrote.')
    expect((await p.findGlobal({ slug: 'site-facts' })).place).toBe('Room 12 (changed by an editor)')
  })

  it('images: false saves the rooms without a picture and needs no Blob store', async () => {
    const p = await getTestPayload()
    const result = await seed(p, { images: false, env: { VERCEL: '1' } })
    expect(result.created).toBe(ALL_RECORDS - 6)
    expect(await count(p, 'media')).toBe(0)
    expect((await bySlug(p, 'rooms', 'the-hall')).image ?? null).toBeNull()
  })
})

describe('Blob storage on Vercel', () => {
  beforeEach(resetAll)
  afterAll(resetAll)

  it('on Vercel without a Blob store, stops with a plain message BEFORE creating any record', async () => {
    const p = await getTestPayload()
    await expect(seed(p, { env: { VERCEL: '1' } })).rejects.toThrow(NO_BLOB_STORE_MESSAGE)
    expect(await countAll(p)).toEqual({ rooms: 0, features: 0, timeSlots: 0, pages: 0, media: 0, users: 0 })
  })

  it('needs no Blob store when there is no image to upload', async () => {
    const p = await getTestPayload()
    await seed(p)
    await expect(seed(p, { env: { VERCEL: '1' } })).resolves.toEqual({ created: 0, skipped: KEPT })
  })
})

describe('the images are found by their base name', () => {
  beforeEach(resetAll)
  afterAll(resetAll)

  it('media records deleted but files kept: re-added once as name-1.jpg, then found again, never doubled', async () => {
    const p = await getTestPayload()
    await seed(p)
    // The rooms link to the pictures, so they go first; then the records go and the files stay on disk.
    await resetCollections(['bookings', 'timeSlots', 'rooms', 'media'])
    expect((await seed(p)).created).toBe(6 + 4 + SLOTS)
    const renamed = (await p.find({ collection: 'media', limit: 10 })).docs.map((media) => media.filename)
    expect(renamed).toContain('the-hall-1.jpg')
    expect(await seed(p)).toEqual({ created: 0, skipped: KEPT })
    expect(await count(p, 'media')).toBe(6)
  })
})

describe('runSeed: the example content is added once per database', () => {
  const originalEmail = process.env.FIRST_ADMIN_EMAIL
  const originalPassword = process.env.FIRST_ADMIN_PASSWORD
  let log: MockInstance<typeof console.log>
  beforeEach(async () => {
    await resetAll()
    process.env.FIRST_ADMIN_EMAIL = 'seed-test@riversidevoices.example'
    process.env.FIRST_ADMIN_PASSWORD = 'test-password-0123456789'
    log = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    log.mockRestore()
    if (originalEmail === undefined) delete process.env.FIRST_ADMIN_EMAIL
    else process.env.FIRST_ADMIN_EMAIL = originalEmail
    if (originalPassword === undefined) delete process.env.FIRST_ADMIN_PASSWORD
    else process.env.FIRST_ADMIN_PASSWORD = originalPassword
  })
  afterAll(resetAll)

  const logged = () => log.mock.calls.map((call) => String(call[0]))

  it('after the first run, a later run creates nothing, even when an example record was deleted or renamed', async () => {
    const p = await getTestPayload()
    expect(await runSeed(p, { env: {} })).toMatchObject({ example: 'added', created: ALL_RECORDS })
    expect(await exampleWasAdded(p)).toBe(true)
    const about = await bySlug(p, 'pages', 'about')
    await p.update({ collection: 'pages', id: about.id, data: { slug: 'about-us' }, overrideAccess: true })

    log.mockClear()
    expect(await runSeed(p, { env: { VERCEL: '1' } })).toMatchObject({ example: 'skipped', created: 0 })
    expect(logged()).toEqual(["SEED: skipped (the example content was added before; your editors' changes are kept)"])
    expect((await p.find({ collection: 'pages', where: { slug: { equals: 'about' } } })).docs).toHaveLength(0)
  })

  it('on your own computer, the skipped line also says how to add back deleted example records', async () => {
    const p = await getTestPayload()
    await runSeed(p, { env: {} })
    log.mockClear()
    await runSeed(p, { env: {} })
    expect(logged()[0]).toBe("SEED: skipped (the example content was added before; your editors' changes are kept)")
    expect(logged()[1]).toContain('npm run seed -- --again')
  })

  it('--again adds back a deleted example page, overwrites nothing and leaves the flag set', async () => {
    const p = await getTestPayload()
    await runSeed(p, { env: {} })
    const contact = await bySlug(p, 'pages', 'contact')
    await p.delete({ collection: 'pages', id: contact.id, overrideAccess: true })
    const loft = await bySlug(p, 'rooms', 'the-loft')
    await p.update({ collection: 'rooms', id: loft.id, data: { name: 'Loft (changed by an editor)' }, overrideAccess: true })

    expect(await runSeed(p, { again: true, env: {} })).toMatchObject({ example: 'added', created: 1, skipped: KEPT - 1 })
    expect(await count(p, 'pages')).toBe(4)
    expect((await bySlug(p, 'rooms', 'the-loft')).name).toBe('Loft (changed by an editor)')
    expect(await exampleWasAdded(p)).toBe(true)
    expect(logged().at(-1)).toMatch(new RegExp(`^SEED: created 1, kept ${KEPT - 1} \\(--again`))
  })

  it('ADD_EXAMPLE_CONTENT false: no content at all, but the first editor is still created', async () => {
    const p = await getTestPayload()
    expect(await runSeed(p, { addExampleContent: false, env: {} })).toMatchObject({ example: 'off', created: 0 })
    expect(await countAll(p)).toEqual({ rooms: 0, features: 0, timeSlots: 0, pages: 0, media: 0, users: 1 })
    expect(logged()[0]).toContain('ADD_EXAMPLE_CONTENT')
  })

  it('a failing seed still leaves the first editor created: it is the first step', async () => {
    const p = await getTestPayload()
    await expect(runSeed(p, { env: { VERCEL: '1' } })).rejects.toThrow(NO_BLOB_STORE_MESSAGE)
    expect(await countAll(p)).toEqual({ rooms: 0, features: 0, timeSlots: 0, pages: 0, media: 0, users: 1 })
    expect(await exampleWasAdded(p)).toBe(false)
  })

  it('a first run that never finished: the next run creates only what is missing, then sets the flag', async () => {
    const p = await getTestPayload()
    await seed(p)
    expect(await exampleWasAdded(p)).toBe(false)
    const contact = await bySlug(p, 'pages', 'contact')
    await p.delete({ collection: 'pages', id: contact.id, overrideAccess: true })
    expect(await runSeed(p, { env: {} })).toMatchObject({ example: 'added', created: 1, skipped: KEPT - 1 })
    expect(await count(p, 'pages')).toBe(4)
    expect(await exampleWasAdded(p)).toBe(true)
  })
})
