import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { getTestPayload, resetCollections } from '../setup/payload'
import { roomData, slotData } from '../setup/rooms'

const collections = ['bookings', 'timeSlots', 'rooms', 'features', 'pages']
const AT = '2026-10-10T17:00:00Z'

describe('the content model', () => {
  beforeEach(() => resetCollections(collections))
  afterAll(() => resetCollections(collections))

  it('stores the room-equipment many-to-many once and reads it from both sides', async () => {
    const p = await getTestPayload()
    const piano = await p.create({ collection: 'features', data: { name: 'Piano', slug: 'piano' } })
    const mirrors = await p.create({ collection: 'features', data: { name: 'Mirrors', slug: 'mirrors' } })
    const first = await p.create({ collection: 'rooms', data: { ...roomData, features: [piano.id, mirrors.id] } })
    await p.create({ collection: 'rooms', data: { ...roomData, slug: 'second', features: [mirrors.id] } })
    expect((await p.findByID({ collection: 'features', id: mirrors.id, depth: 1 })).rooms?.docs).toHaveLength(2)
    expect((await p.findByID({ collection: 'rooms', id: first.id, depth: 1 })).features).toHaveLength(2)
    await p.update({ collection: 'rooms', id: first.id, data: { features: [piano.id], name: 'Changed name' } })
    expect((await p.findByID({ collection: 'features', id: mirrors.id })).rooms?.docs).toHaveLength(1)
  })

  it('keeps the one-to-many links: a room has time slots, a time slot has bookings (only editors see them)', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    const { places: _places, ...withoutPlaces } = slotData(room.id, AT)
    // The generated type requires places even though Payload supplies its default at runtime.
    // @ts-expect-error Deliberately omit places to exercise the runtime default: one group per slot.
    const slot = await p.create({ collection: 'timeSlots', data: withoutPlaces })
    expect(slot.places).toBe(1)
    const booking = await p.create({ collection: 'bookings', data: { timeSlot: slot.id, groupName: 'Test choir', groupSize: 10, name: 'Test Person', email: 'test@riversidevoices.example' } })
    const editor = { collection: 'users' as const, id: 1, email: 'editor@riversidevoices.example' }
    const found = await p.findByID({ collection: 'timeSlots', id: slot.id, depth: 1, user: editor })
    expect(found.bookings?.docs?.map((b) => (typeof b === 'object' ? b.id : b))).toEqual([booking.id])
    expect((await p.findByID({ collection: 'rooms', id: room.id })).timeSlots?.docs).toHaveLength(1)
  })

  it('rejects invalid references, duplicate slugs and invalid numbers', async () => {
    const p = await getTestPayload()
    await p.create({ collection: 'rooms', data: roomData })
    await expect(p.create({ collection: 'rooms', data: roomData })).rejects.toThrow()
    await expect(p.create({ collection: 'rooms', data: { ...roomData, slug: 'bad-reference', features: [999999] } })).rejects.toThrow(/equipment no longer exists/)
    for (const data of [{ price: -1 }, { capacity: 1.5 }, { capacity: 0 }]) {
      await expect(p.create({ collection: 'rooms', data: { ...roomData, slug: 'bad-number', ...data } })).rejects.toThrow()
    }
    await expect(p.create({ collection: 'timeSlots', data: slotData(999999, AT) })).rejects.toThrow(/room no longer exists/)
    await expect(p.create({ collection: 'bookings', data: { timeSlot: 999999, name: 'Test', email: 'test@riversidevoices.example' } })).rejects.toThrow()
  })

  it('a time slot must end after it starts', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    await expect(p.create({ collection: 'timeSlots', data: { ...slotData(room.id, AT), endsAt: AT } })).rejects.toMatchObject({ data: { errors: [{ path: 'endsAt', message: 'The end must be after the start.' }] } })
  })

  it('requires explicit unlinking and does not delete equipment, a room or a slot with dependent records', async () => {
    const p = await getTestPayload()
    const feature = await p.create({ collection: 'features', data: { name: 'Test', slug: 'test' } })
    const room = await p.create({ collection: 'rooms', data: { ...roomData, features: [feature.id] } })
    await expect(p.delete({ collection: 'features', id: feature.id })).rejects.toThrow('This equipment is still listed for rooms (see its Rooms list). Remove it from each room, then delete it.')
    await p.update({ collection: 'rooms', id: room.id, data: { features: [] } })
    await p.delete({ collection: 'features', id: feature.id })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, AT) })
    const booking = await p.create({ collection: 'bookings', data: { timeSlot: slot.id, name: 'Test', email: 'test@riversidevoices.example' } })
    await expect(p.delete({ collection: 'rooms', id: room.id })).rejects.toThrow('This room still has time slots. Open Time Slots and delete them (move or delete their bookings first). Then delete the room.')
    await expect(p.delete({ collection: 'timeSlots', id: slot.id })).rejects.toThrow('This time slot still has bookings. Open Bookings and move each one to another time slot or delete it, then delete the time slot.')
    await p.delete({ collection: 'bookings', id: booking.id })
    await p.delete({ collection: 'timeSlots', id: slot.id })
    await p.delete({ collection: 'rooms', id: room.id })
  })

  it('rejects fractional places and capacity reductions below existing bookings', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    for (const places of [0, -1, 1.5]) {
      await expect(p.create({ collection: 'timeSlots', data: slotData(room.id, AT, places) })).rejects.toMatchObject({ data: { errors: [{ path: 'places', message: 'Enter a whole number of at least 1.' }] } })
    }
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, AT, 2) })
    // 17:00 UTC is 19:00 in Brussels on 10 October (summer time).
    expect(slot.label).toContain('19:00')
    for (const name of ['Test One', 'Test Two']) await p.create({ collection: 'bookings', data: { timeSlot: slot.id, name, email: 'test@riversidevoices.example' } })
    const editor = { collection: 'users', id: 1 }
    await expect(p.update({ collection: 'timeSlots', id: slot.id, data: { places: 1 }, overrideAccess: false, user: editor })).rejects.toThrow('This time slot already has 2 bookings, so it needs at least 2 places. Choose a higher number, or move or delete bookings first.')
    expect((await p.findByID({ collection: 'timeSlots', id: slot.id })).places).toBe(2)
    await expect(p.update({ collection: 'timeSlots', id: slot.id, data: { places: 2 }, overrideAccess: false, user: editor })).resolves.toHaveProperty('places', 2)
    await expect(p.update({ collection: 'timeSlots', id: slot.id, data: { room: 999999 } })).rejects.toThrow(/room no longer exists/)
  })

  it('rejects a slug that is not lowercase letters, digits and hyphens, and explains a duplicate', async () => {
    const p = await getTestPayload()
    for (const slug of ['The Hall', 'the_hall', 'The-Hall', '-hall', 'hall-', 'the--hall']) {
      await expect(p.create({ collection: 'features', data: { name: 'Test', slug } })).rejects.toMatchObject({ data: { errors: [{ path: 'slug', message: 'Use only lowercase letters, digits and hyphens, for example warm-up-your-voice.' }] } })
    }
    await p.create({ collection: 'features', data: { name: 'Test', slug: 'the-hall-2' } })
    await expect(p.create({ collection: 'features', data: { name: 'Test', slug: 'the-hall-2' } })).rejects.toThrow('Another record already uses this slug. Choose a different one.')
  })

  it('explains a room picture that no longer exists', async () => {
    const p = await getTestPayload()
    await expect(p.create({ collection: 'rooms', data: { ...roomData, image: 999999 } })).rejects.toThrow('This image no longer exists. Choose another image.')
  })
})

// The hooks above give the friendly messages. These tests go AROUND the hooks, with plain SQL through
// the test's own connection pool, to prove the database itself still refuses: that is what protects the
// data when two requests race each other, or when code forgets to go through Payload.
describe('database restrictions without the hooks', () => {
  beforeEach(() => resetCollections(collections))
  afterAll(() => resetCollections(collections))

  async function deleteWithSql(table: 'rooms' | 'time_slots' | 'features', id: number) {
    const p = await getTestPayload()
    const pool = (p.db as unknown as PostgresAdapter).pool
    // The table names are a fixed list in this file; the id stays a query parameter.
    return pool.query(`delete from ${table} where id = $1`, [id]).then(() => ({ code: 'deleted' }), (error: { code?: string; constraint?: string }) => error)
  }

  // Postgres 16 reports a refused ON DELETE RESTRICT as 23503 (foreign_key_violation); Postgres 17,
  // which PGlite runs, reports 23001 (restrict_violation). Both mean "a linked record still exists".
  function refusedBy(constraint: string) {
    return { code: expect.stringMatching(/^(23503|23001)$/), constraint }
  }

  it('refuses to delete a room that still has a time slot (SQLSTATE 23503 or 23001)', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    await p.create({ collection: 'timeSlots', data: slotData(room.id, AT) })
    expect(await deleteWithSql('rooms', room.id)).toMatchObject(refusedBy('time_slots_room_id_rooms_id_fk'))
    expect((await p.count({ collection: 'rooms' })).totalDocs).toBe(1)
  })

  it('refuses to delete a time slot that still has a booking (SQLSTATE 23503 or 23001)', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, AT) })
    await p.create({ collection: 'bookings', data: { timeSlot: slot.id, name: 'Test Person', email: 'test@riversidevoices.example' } })
    expect(await deleteWithSql('time_slots', slot.id)).toMatchObject(refusedBy('bookings_time_slot_id_time_slots_id_fk'))
    expect((await p.count({ collection: 'timeSlots' })).totalDocs).toBe(1)
  })

  it('refuses to delete equipment that a room still lists (SQLSTATE 23503 or 23001)', async () => {
    const p = await getTestPayload()
    const feature = await p.create({ collection: 'features', data: { name: 'Test', slug: 'test-feature' } })
    const room = await p.create({ collection: 'rooms', data: { ...roomData, features: [feature.id] } })
    expect(await deleteWithSql('features', feature.id)).toMatchObject(refusedBy('rooms_rels_features_fk'))
    expect((await p.findByID({ collection: 'rooms', id: room.id, depth: 0 })).features).toEqual([feature.id])
  })

  it('still deletes a parent with nothing linked to it (the restriction is not a blanket ban)', async () => {
    const p = await getTestPayload()
    const room = await p.create({ collection: 'rooms', data: roomData })
    expect(await deleteWithSql('rooms', room.id)).toEqual({ code: 'deleted' })
  })
})
