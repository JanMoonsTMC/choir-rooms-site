// GET /api/course-check, as agreed with the course's checkers in docs/COURSE-CHECK-CONTRACT.md. Our site
// books rooms instead of the starter's clinic, so it has no clinics collection and no warm-up booking:
// the contract's answer for such a site is "no clinic, no list, no booking" (interpretation 11). The
// route itself (its codes, methods, limit and errors) still answers exactly as agreed.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import * as route from '../../src/app/api/course-check/route'
import { courseCheckResponse } from '../../src/lib/courseCheckResponse'
import { allowRequest } from '../../src/tasks/book-slot/guards'
import { getTestPayload, resetCollections } from '../setup/payload'

// A different made-up address for every request unless a test means to share one, so the limit of
// 30 a minute counts only where a test is about it.
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
const LIMITED = '{"error":"rate_limited"}'
const UNAVAILABLE = '{"error":"unavailable"}'
const NOTHING = { status: 200, type: 'application/json', cache: 'no-store', body: '{"clinic":false,"whatToBring":null,"booking":false}' }

describe('the course check on our site (no clinics)', () => {
  let p: Payload
  const answer = (incoming: Request) => courseCheckResponse(incoming, { payload: p })

  beforeEach(async () => {
    p = await getTestPayload()
    await resetCollections(['throttle'])
  })
  afterEach(() => vi.restoreAllMocks())

  it('answers "no clinic, no list, no booking" with a code, with the other form of code, and without one', async () => {
    for (const query of ['?code=BW-7F3K', '?code=k7q2', '', '?code=', '?code=%20%20']) {
      expect(await seen(await answer(request(query))), query).toEqual(NOTHING)
    }
  })

  it('a code in any other form answers 400 with the agreed body, before reading the database', async () => {
    const reads = [vi.spyOn(p, 'find'), vi.spyOn(p, 'count'), vi.spyOn(p, 'create')]
    for (const bad of ['%3Cb%3EK7Q2%3C%2Fb%3E', 'K7', 'K7Q2K7Q2K', 'K7%20Q2', 'BW-7F3', 'BW_7F3K', 'T29-7G6N']) {
      expect(await seen(await answer(request(`?code=${bad}`))), bad).toEqual({ status: 400, type: 'application/json', cache: 'no-store', body: INVALID })
    }
    for (const read of reads) expect(read).not.toHaveBeenCalled()
  })

  it('HEAD answers the same status and headers as GET, without a body', async () => {
    for (const query of ['?code=BW-7F3K', '', '?code=K7']) {
      const get = await route.GET(request(query))
      const head = await route.HEAD(request(query, freshAddress(), 'HEAD'))
      if (get.status === 200) expect(Object.keys(await get.clone().json()), query).toEqual(['clinic', 'whatToBring', 'booking'])
      expect(head.status, query).toBe(get.status)
      expect([...head.headers], query).toEqual([...get.headers])
      expect(await head.text(), query).toBe('')
    }
  })

  it('every other method answers 405, OPTIONS too; the route reads the database on every request', async () => {
    const others = { POST: route.POST, PUT: route.PUT, PATCH: route.PATCH, DELETE: route.DELETE, OPTIONS: route.OPTIONS }
    for (const [method, handler] of Object.entries(others)) {
      const response = handler()
      expect(response.status, method).toBe(405)
      expect(response.headers.get('allow'), method).toBe('GET, HEAD')
      expect(await response.text(), method).toBe('')
    }
    expect(Object.keys(route).sort()).toEqual(['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'dynamic'])
    expect(route.dynamic).toBe('force-dynamic')
  })

  it('the 31st check in a minute from one address answers 429 with Retry-After; the next minute is fine', async () => {
    const ip = '203.0.113.50'
    for (let i = 1; i <= 30; i++) expect((await answer(request('?code=BW-7F3K', ip))).status, `check ${i}`).toBe(200)
    const limited = await answer(request('?code=BW-7F3K', ip))
    expect(limited.headers.get('retry-after')).toBe('60')
    expect(await seen(limited)).toEqual({ status: 429, type: 'application/json', cache: 'no-store', body: LIMITED })
    expect((await answer(request('?code=BW-7F3K'))).status).toBe(200)
    const later = new Date(Date.now() + 61 * 1000)
    expect((await courseCheckResponse(request('?code=BW-7F3K', ip), { payload: p, now: later })).status).toBe(200)
  })

  it("has its own budget: checks neither use up nor wipe out the booking form's limit", async () => {
    const ip = '203.0.113.60'
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    for (let i = 0; i < 5; i++) expect(await allowRequest(ip, 5, 60, { payload: p, now: tenMinutesAgo })).toBe(true)
    expect((await answer(request('?code=BW-7F3K', ip))).status).toBe(200)
    expect(await allowRequest(ip, 5, 60, { payload: p })).toBe(false)
  })

  it('a database that cannot be read answers 503 with the agreed body, and logs the problem on the server', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const problem = new Error('connect ECONNREFUSED 10.0.0.1:5432 (secret detail)')
    vi.spyOn(p, 'count').mockRejectedValueOnce(problem)
    expect(await seen(await answer(request('?code=BW-7F3K')))).toEqual({ status: 503, type: 'application/json', cache: 'no-store', body: UNAVAILABLE })
    expect(log).toHaveBeenCalledWith('The course check could not read the database:', problem)
    expect(await seen(await answer(request('?code=BW-7F3K')))).toEqual(NOTHING)
  })
})
