// The migration that replaces the starter's example with ours on the live site
// (src/migrations/20261017_224621_choir_content.ts, docs/decisions/live-content.md). It runs here the
// way Payload's migrate runs every migration (@payloadcms/drizzle, runMigrationFile): inside ONE database
// transaction, with that transaction's `db` and `req`. On the real Postgres that CI and the live site use,
// a read on a second connection could wait for that transaction for ever, so this also proves every
// read and write of the migration goes through it.
import { commitTransaction, createLocalReq, initTransaction, type Payload } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { up } from '../../src/migrations/20261017_224621_choir_content'
import { recordExampleAdded } from '../../src/seed/exampleFlag'
import { richText } from '../../src/seed/richText'
import { forgetExampleAdded, getTestPayload, resetCollections, resetSiteFacts } from '../setup/payload'
import { refuseUnlessThrowAwayTestDatabase } from '../setup/safety'

refuseUnlessThrowAwayTestDatabase()

const clean = ['bookings', 'timeSlots', 'rooms', 'features', 'pages', 'media']

async function resetAll() {
  await resetCollections(clean)
  await forgetExampleAdded()
  await resetSiteFacts()
}

/** Runs the migration's up() as Payload's migrate does: in one transaction, then commits it. */
async function runMigration(p: Payload) {
  const req = await createLocalReq({}, p)
  await initTransaction(req)
  const adapter = p.db as unknown as PostgresAdapter
  const db = (req.transactionID !== undefined && adapter.sessions[await req.transactionID]?.db) || adapter.drizzle
  await up({ db: db as never, payload: p, req })
  await commitTransaction(req)
}

// A database the way the live site has it: the starter's example pages, its Site facts, and the note
// that the example was added.
async function starterExample(p: Payload) {
  for (const slug of ['home', 'about', 'contact', 'privacy']) {
    await p.create({
      collection: 'pages',
      data: { title: slug === 'home' ? 'Campus Cycle' : `${slug} (starter)`, slug, intro: 'Campus Cycle is the bicycle repair service.', body: richText([{ paragraph: 'Campus Cycle text.' }]) },
      overrideAccess: true,
    })
  }
  await p.updateGlobal({ slug: 'site-facts', data: { pricingRule: 'Tools included.', place: 'Workshop B, Student Centre', email: 'hello@campuscycle.example' }, overrideAccess: true })
  await recordExampleAdded(p)
}

describe('the live-content migration', () => {
  beforeEach(resetAll)
  afterAll(resetAll)

  it('on a database with the starter example: our rooms, equipment, coming slots, pages and facts, in one transaction', async () => {
    const p = await getTestPayload()
    await starterExample(p)
    const now = Date.now()
    await runMigration(p)

    const rooms = (await p.find({ collection: 'rooms', depth: 0, limit: 10, sort: 'capacity' })).docs
    expect(rooms.map((room) => room.name)).toEqual(['The Band Room', 'The Loft', 'The Studio', 'The Hall'])
    expect(await p.count({ collection: 'features' })).toEqual({ totalDocs: 8 })
    // Coming slots for eight weeks, all after today, for every room.
    const slots = await p.find({ collection: 'timeSlots', depth: 0, pagination: false, sort: 'startsAt' })
    expect(slots.docs.length).toBeGreaterThan(200)
    expect(new Date(slots.docs[0].startsAt).getTime()).toBeGreaterThan(now)
    expect(new Date(slots.docs.at(-1)!.startsAt).getTime()).toBeLessThan(now + 57 * 24 * 60 * 60 * 1000)
    for (const room of rooms) expect(slots.docs.some((slot) => slot.room === room.id), room.name).toBe(true)

    // The starter's pages are now ours; nothing of Campus Cycle is left in them or in the Site facts.
    const pages = (await p.find({ collection: 'pages', depth: 0, limit: 10 })).docs
    expect(pages).toHaveLength(4)
    expect(pages.find((page) => page.slug === 'home')?.title).toBe('Riverside Voices')
    expect(pages.find((page) => page.slug === 'home')?.body ?? null).toBeNull()
    expect(JSON.stringify(pages)).not.toMatch(/campus cycle|bicycle/i)
    const facts = await p.findGlobal({ slug: 'site-facts' })
    expect(facts).toMatchObject({ place: 'Riverside Voices house, Quay Street 12, Riverside', email: 'rooms@riversidevoices.example' })
  })

  it('a second run changes nothing twice: no second room, piece of equipment or time slot', async () => {
    const p = await getTestPayload()
    await starterExample(p)
    await runMigration(p)
    const before = (await p.count({ collection: 'timeSlots' })).totalDocs
    await runMigration(p)
    expect(await p.count({ collection: 'rooms' })).toEqual({ totalDocs: 4 })
    expect(await p.count({ collection: 'features' })).toEqual({ totalDocs: 8 })
    expect((await p.count({ collection: 'timeSlots' })).totalDocs).toBe(before)
  })

  it('on a new, empty database it does nothing: the seed adds our content there', async () => {
    const p = await getTestPayload()
    await runMigration(p)
    expect(await p.count({ collection: 'rooms' })).toEqual({ totalDocs: 0 })
    expect(await p.count({ collection: 'pages' })).toEqual({ totalDocs: 0 })
  })
})
