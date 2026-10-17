// Our second task, "find the room that fits your group", rendered the way the server renders it, on the
// test database filled by the real seed. Each page is an async server component: the test awaits it with
// the address's parts (params, searchParams) and turns the result into HTML.
import { readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Payload } from 'payload'
import { seed } from '../../src/seed/seed'
import { forgetExampleAdded, getTestPayload, resetCollections, resetSiteFacts } from '../setup/payload'
import { refuseUnlessThrowAwayTestDatabase } from '../setup/safety'
import { trackSteps } from '../setup/elements'
import RoomsPage, { generateMetadata as listMetadata } from '../../src/app/(site)/rooms/page'
import RoomPage from '../../src/app/(site)/rooms/[slug]/page'
import EquipmentPage from '../../src/app/(site)/equipment/page'
import FeaturePage, { generateMetadata as featureMetadata } from '../../src/app/(site)/equipment/[slug]/page'
import { tabTitle } from '../setup/title'

// These tests delete every example record: never on a real database.
refuseUnlessThrowAwayTestDatabase()

const clean = ['bookings', 'timeSlots', 'rooms', 'features', 'pages', 'media', 'users']

async function resetAll(p: Payload) {
  await resetCollections(clean)
  await forgetExampleAdded()
  await resetSiteFacts()
  const folder = String(p.collections.media.config.upload.staticDir)
  for (const name of readdirSync(folder)) rmSync(path.join(folder, name), { recursive: true, force: true })
}

type Query = Record<string, string | string[] | undefined>
const list = async (query: Query = {}) => {
  const props = { searchParams: Promise.resolve(query) }
  return { html: renderToString(await RoomsPage(props)), title: await tabTitle(listMetadata(props)) }
}
const room = async (slug: string, query: Query = {}) =>
  renderToString(await RoomPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve(query) }))
const feature = async (slug: string) => renderToString(await FeaturePage({ params: Promise.resolve({ slug }) }))

// The rooms a page links to, by slug: one link per card (the card's title), in alphabetical order.
const listed = (html: string) => [...new Set([...html.matchAll(/<h[23][^>]*><a[^>]*href="\/rooms\/([a-z0-9-]+)/g)].map(([, slug]) => slug))].sort()

// What Next.js's notFound() throws: an error whose "digest" says what to do.
async function digestOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    return String((error as { digest?: string }).digest)
  }
  return 'no error thrown'
}

describe('our second task: find the room that fits your group', () => {
  let p: Payload

  beforeAll(async () => {
    p = await getTestPayload()
    await resetAll(p)
    await seed(p, { env: {} })
  })
  afterAll(async () => resetAll(p))

  it('/rooms lists every room, smallest first, with a plain GET form whose fields have visible labels (R1)', async () => {
    const { html, title } = await list()
    expect(listed(html)).toEqual(['the-band-room', 'the-hall', 'the-loft', 'the-studio'])
    expect(html.indexOf('href="/rooms/the-band-room"')).toBeLessThan(html.indexOf('href="/rooms/the-hall"'))
    expect(html).toContain('All rooms — 4 rooms')
    expect(title).toBe('Rooms · Riverside Voices')
    for (const fact of ['Up to 8 people', 'Up to 60 people', 'EUR 35 per time slot', 'Grand piano']) expect(html).toContain(fact)
    expect(html).toMatch(/<form[^>]*action="\/rooms#results"[^>]*method="get"/)
    expect(html).toMatch(/<label[^>]*for="filter-people"[^>]*>Group size<\/label>/)
    expect(html).toMatch(/<label[^>]*for="filter-feature"[^>]*>Equipment<\/label>/)
    expect(html).toMatch(/<select[^>]*id="filter-people"[^>]*name="people"/)
    expect(html).toMatch(/<select[^>]*id="filter-feature"[^>]*name="feature"/)
    expect(html).toContain('Any size')
    expect(html).toContain('Any equipment')
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Show rooms<\/button>/)
    expect(html).not.toContain('Clear filters')
    expect(html).toMatch(/role="status"[^>]*><h2[^>]*>All rooms/)
  })

  it('?people=25 lists the two rooms that hold 25 people, and says so in words and in the tab title (R2)', async () => {
    const { html, title } = await list({ people: '25' })
    expect(listed(html)).toEqual(['the-hall', 'the-studio'])
    expect(html).toContain('Rooms for up to 25 people — 2 rooms')
    expect(title).toBe('Rooms for up to 25 people — 2 rooms · Riverside Voices')
    expect(html).toMatch(/<option[^>]*value="25" selected="">Up to 25 people<\/option>/)
    expect(html).toMatch(/href="\/rooms"[^>]*>Clear filters</)
    // The card's link carries the filters forward, for the room page's Back link.
    expect(html).toContain('href="/rooms/the-studio?people=25"')
  })

  it('?feature=drum-kit-and-amplifiers lists only the Band Room (R3); both filters together narrow further', async () => {
    expect(listed((await list({ feature: 'drum-kit-and-amplifiers' })).html)).toEqual(['the-band-room'])
    const both = await list({ people: '12', feature: 'upright-piano' })
    expect(listed(both.html)).toEqual(['the-loft', 'the-studio'])
    expect(both.html).toContain('Rooms for up to 12 people with Upright piano — 2 rooms')
    expect(listed((await list({ people: '60', feature: 'upright-piano' })).html)).toEqual([])
  })

  it('counts the analytics step "filter_used" only when filters were applied, with values this site has', async () => {
    const steps = async (query: Query) => trackSteps(await RoomsPage({ searchParams: Promise.resolve(query) }))
    expect(await steps({})).toEqual([])
    expect(await steps({ people: '' })).toEqual([])
    expect(await steps({ people: '25', feature: 'upright-piano' })).toEqual([
      { event: 'filter_used', props: { people: '25', feature: 'upright-piano' }, once: '?people=25&feature=upright-piano' },
    ])
    // Whatever someone typed into the address is never sent: unknown equipment goes as ''.
    expect(await steps({ feature: 'my-own-words' })).toEqual([{ event: 'filter_used', props: { people: '', feature: '' }, once: '?feature=my-own-words' }])
  })

  it('unknown equipment: "No rooms match these filters" and a Clear filters link, not a crash or a 404', async () => {
    const { html, title } = await list({ feature: 'harp', people: '500' })
    expect(listed(html)).toEqual([])
    expect(html).toContain('No rooms match these filters')
    expect(html).toContain('This site has no equipment called &quot;harp&quot;. The link may be out of date.')
    expect(html).toMatch(/href="\/rooms"[^>]*>Clear filters</)
    expect(title).toBe('No rooms match these filters · Riverside Voices')
    // A size we do not offer is simply left out; a script is never shown.
    expect(listed((await list({ people: '500' })).html)).toHaveLength(4)
    expect((await list({ feature: '<script>alert(1)</script>' })).html).not.toContain('<script>alert(1)')
  })

  it("a room's page links each piece of equipment to its own page, and its Back link keeps the filters (R4)", async () => {
    const plain = await room('the-studio')
    expect(plain).toMatch(/href="\/equipment\/upright-piano"[^>]*>Upright piano</)
    expect(plain).toMatch(/href="\/rooms"[^>]*>Back to all rooms</)
    const filtered = await room('the-studio', { people: '25' })
    expect(filtered).toMatch(/href="\/rooms\?people=25"[^>]*>Back to the filtered rooms</)
    expect(filtered).toMatch(/aria-label="Breadcrumb"[^>]*>.*href="\/rooms\?people=25"[^>]*>Rooms</)
    // A filter the site does not know is not carried back.
    expect(await room('the-studio', { people: '500' })).toMatch(/href="\/rooms"[^>]*>Back to all rooms</)
  })

  it('/equipment/upright-piano lists the Loft and the Studio: the many-to-many from the other side (R5)', async () => {
    const html = await feature('upright-piano')
    expect(listed(html)).toEqual(['the-loft', 'the-studio'])
    expect(html).toContain('Rooms with Upright piano — 2 rooms')
    expect(html).toContain('href="/rooms?feature=upright-piano"')
    expect(await tabTitle(featureMetadata({ params: Promise.resolve({ slug: 'upright-piano' }) }))).toBe('Upright piano · Equipment · Riverside Voices')
    expect(listed(await feature('sound-system'))).toEqual(['the-band-room', 'the-hall', 'the-studio'])
  })

  it('/equipment lists every piece of equipment with how many rooms have it', async () => {
    const html = renderToString(await EquipmentPage())
    expect([...html.matchAll(/href="\/equipment\/([a-z0-9-]+)"/g)]).toHaveLength(8)
    expect(html).toMatch(/Sound system<\/a><\/h2><p[^>]*>In 3 rooms/)
    expect(html).toMatch(/Grand piano<\/a><\/h2><p[^>]*>In 1 room</)
  })

  it('an unknown room or equipment address gives the 404 page', async () => {
    expect(await digestOf(room('no-such-room'))).toBe('NEXT_HTTP_ERROR_FALLBACK;404')
    expect(await digestOf(feature('no-such-equipment'))).toBe('NEXT_HTTP_ERROR_FALLBACK;404')
  })

  it('one edit in /admin shows in the list, on the room page and on the equipment page', async () => {
    await p.update({ collection: 'rooms', where: { slug: { equals: 'the-loft' } }, data: { price: 22 }, overrideAccess: true })
    try {
      expect((await list()).html).toContain('EUR 22 per time slot')
      expect(await room('the-loft')).toContain('EUR 22 per time slot')
      expect(await feature('upright-piano')).toContain('EUR 22 per time slot')
    } finally {
      await p.update({ collection: 'rooms', where: { slug: { equals: 'the-loft' } }, data: { price: 20 }, overrideAccess: true })
    }
  })
})
