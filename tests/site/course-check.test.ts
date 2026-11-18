// GET /api/course-check on our site, as agreed with the course's checkers in docs/COURSE-CHECK-CONTRACT.md.
// Our site books rooms instead of the starter's clinic, so it has no clinics collection and no warm-up
// booking: the contract's answer for such a site is "no clinic, no list, no booking". The team section
// (?include=team) answers from our own model and from src/course-check.config.ts.
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import * as route from '../../src/app/api/course-check/route'
import type { TeamSection } from '../../src/lib/courseCheck'
import { courseCheckResponse } from '../../src/lib/courseCheckResponse'
import { getTestPayload, resetCollections } from '../setup/payload'
import { roomData, slotData } from '../setup/rooms'

// A different made-up address for every request, so the limit of 30 a minute never counts here.
let address = 0
const freshAddress = () => {
  address++
  return `198.18.${Math.floor(address / 250)}.${(address % 250) + 1}`
}

function request(query = '', ip = freshAddress(), method = 'GET'): Request {
  return new Request(`http://localhost/api/course-check${query}`, { method, headers: { 'x-forwarded-for': ip } })
}

/** The status, the two agreed headers and the body as text: everything a checker sees. */
async function seen(response: Response) {
  return {
    status: response.status,
    type: response.headers.get('content-type'),
    cache: response.headers.get('cache-control'),
    body: await response.text(),
  }
}

const INVALID = '{"error":"invalid_code"}'
const NOTHING = { status: 200, type: 'application/json', cache: 'no-store', body: '{"clinic":false,"whatToBring":null,"booking":false}' }

describe('the course check on our site (no clinics)', () => {
  let p: Payload
  const answer = (incoming: Request) => courseCheckResponse(incoming, { payload: p })

  beforeEach(async () => {
    p = await getTestPayload()
    await resetCollections(['throttle'])
  })
  afterEach(() => vi.restoreAllMocks())

  it('answers "no clinic, no list, no booking" with a code in each accepted form (the team code too), and without one', async () => {
    for (const query of ['?code=BW-7F3K', '?code=k7q2', '?code=T29-7G6N', '?code=%20t29-7g6n%20', '', '?code=', '?code=%20%20']) {
      expect(await seen(await answer(request(query))), query).toEqual(NOTHING)
    }
  })
})

// The team section (?include=team, docs/COURSE-CHECK-CONTRACT.md "The team section"), on our own model:
// rooms, equipment (features), time slots and bookings, the many-to-many rooms <-> equipment, and our
// transactional task's bookings, found by the team code in the group's name (src/course-check.config.ts).
describe('the team section on our site', () => {
  let p: Payload
  const clean = ['bookings', 'timeSlots', 'rooms', 'features', 'throttle']
  const answer = (incoming: Request) => courseCheckResponse(incoming, { payload: p })

  async function teamOf(response: Response): Promise<TeamSection> {
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(Object.keys(body)).toEqual(['clinic', 'whatToBring', 'booking', 'team'])
    return body.team as TeamSection
  }

  async function booking(groupName: string, slot: number) {
    return p.create({
      collection: 'bookings',
      data: { timeSlot: slot, groupName, groupSize: 8, name: 'Private Person', email: 'private@riversidevoices.example', note: 'Private note' },
      overrideAccess: true,
    })
  }

  beforeEach(async () => {
    p = await getTestPayload()
    await resetCollections(clean)
  })
  afterEach(() => vi.restoreAllMocks())
  afterAll(() => resetCollections(clean))

  it('adds the team section only for include=team; the three agreed keys stay as they were', async () => {
    for (const query of ['?include=teams', '?include=', '?include=all&code=T29-7G6N', '?team=1']) {
      expect(Object.keys(await (await answer(request(query))).json()), query).toEqual(['clinic', 'whatToBring', 'booking'])
    }
    const response = await answer(request('?include=TEAM&code=T29-7G6N'))
    const body = (await response.clone().json()) as Record<string, unknown>
    expect({ clinic: body.clinic, whatToBring: body.whatToBring, booking: body.booking }).toEqual({ clinic: false, whatToBring: null, booking: false })
    expect((await teamOf(response)).version).toBe(1)
    expect(await seen(await answer(request('?include=team&code=T2-7G6N')))).toEqual({ status: 400, type: 'application/json', cache: 'no-store', body: INVALID })
  })

  it('lists our four collections with their counts, and the rooms <-> equipment many-to-many with its join', async () => {
    const feature = await p.create({ collection: 'features', data: { name: 'Upright piano', slug: 'upright-piano' } })
    const room = await p.create({ collection: 'rooms', data: { ...roomData, features: [feature.id] } })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id) })
    await booking('Test choir', slot.id)
    const team = await teamOf(await answer(request('?include=team')))
    // Not users, media, pages, throttle or members: accounts, files and the free pages are no content model.
    expect(team.collections).toEqual([
      { slug: 'features', count: 1, fromTemplate: false },
      { slug: 'rooms', count: 1, fromTemplate: false },
      { slug: 'timeSlots', count: 1, fromTemplate: true },
      { slug: 'bookings', count: 1, fromTemplate: true },
    ])
    expect(team.manyToMany).toEqual([{ from: 'rooms', field: 'features', to: 'features', join: 'rooms' }])
  })

  it('finds the newest booking whose group name holds the team code T29-7G6N as a whole token, and only its id and time', async () => {
    const room = await p.create({ collection: 'rooms', data: roomData })
    const slot = await p.create({ collection: 'timeSlots', data: slotData(room.id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 10) })
    const mine = await booking('Team T29-7G6N choir', slot.id)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await booking('Team T29-7G6NX', slot.id)
    await booking('Team T29-7G6N-2', slot.id)
    await booking('Another group', slot.id)
    const response = await answer(request('?include=team&code=t29-7g6n'))
    const text = await response.clone().text()
    expect((await teamOf(response)).transactional).toEqual({
      collection: 'bookings',
      status: 'ok',
      codeField: 'groupName',
      newest: { id: String(mine.id), createdAt: new Date(mine.createdAt).toISOString() },
    })
    // Nothing of a booking but its id and creation time: no group, name, e-mail address or note.
    expect(text).not.toMatch(/Team T29|Another group|Private|private@/)
    // Without a code: the newest booking of all, which is not the one with the code.
    const all = await teamOf(await answer(request('?include=team')))
    expect(all.transactional.codeField).toBeNull()
    expect(all.transactional.newest?.id).not.toBe(String(mine.id))
    // A team code no booking holds: none.
    expect((await teamOf(await answer(request('?include=team&code=T30-AAAA')))).transactional).toEqual({ collection: 'bookings', status: 'ok', codeField: 'groupName', newest: null })
  })

  it('the route itself answers the team section from our config (bookings, groupName)', async () => {
    const team = await teamOf(await route.GET(request('?include=team&code=T29-7G6N')))
    expect(team.transactional).toEqual({ collection: 'bookings', status: 'ok', codeField: 'groupName', newest: null })
  })
})
