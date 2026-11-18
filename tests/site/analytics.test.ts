// Our analytics: Vercel Web Analytics' page views (src/components/site/SiteAnalytics.tsx, added by the
// site layout) and what a page view sends (withoutBookingRef in src/lib/analytics.ts). The layout is
// read without rendering it, so the test sees which components it uses and nothing leaves this computer.
import { afterEach, describe, expect, it, vi } from 'vitest'

// The layout's other parts replaced by nothing (they need a database and Next.js's font loader).
vi.mock('@/components/site/SiteAnalytics', () => ({ SiteAnalytics: function SiteAnalytics() { return null } }))
vi.mock('next/font/google', () => ({ Fraunces: () => ({ variable: 'font-heading' }), Source_Sans_3: () => ({ variable: 'font-body' }) }))
vi.mock('@/components/site/Header', () => ({ Header: () => null }))
vi.mock('@/components/site/Footer', () => ({ Footer: () => null }))

import { SiteAnalytics } from '@/components/site/SiteAnalytics'
import SiteLayout from '../../src/app/(site)/layout'
import { withoutBookingRef } from '../../src/lib/analytics'

describe('the site layout', () => {
  afterEach(() => vi.unstubAllEnvs())

  // The layout's elements, without rendering them, so the test sees which components it uses.
  const usesAnalytics = () => JSON.stringify(SiteLayout({ children: null }), (_key, value) => (value === SiteAnalytics ? 'ANALYTICS' : value)).includes('ANALYTICS')

  it("adds Vercel's page views only when NEXT_PUBLIC_ANALYTICS is vercel", () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', undefined)
    expect(usesAnalytics()).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', 'plausible')
    expect(usesAnalytics()).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', 'vercel')
    expect(usesAnalytics()).toBe(true)
  })
})

describe('withoutBookingRef: the page view sent to Vercel Web Analytics', () => {
  it('leaves out a confirmation link\'s booking reference, and keeps everything else', () => {
    expect(withoutBookingRef({ type: 'pageview', url: 'https://choir-rooms-site.vercel.app/rooms/the-loft/booked?ref=42.0123456789abcdef0123456789abcdef' })).toEqual({
      type: 'pageview',
      url: 'https://choir-rooms-site.vercel.app/rooms/the-loft/booked',
    })
    const filtered = { type: 'pageview' as const, url: 'https://choir-rooms-site.vercel.app/rooms?people=12&feature=upright-piano' }
    expect(withoutBookingRef(filtered)).toBe(filtered)
  })

  it('sends nothing for an address it cannot read', () => {
    expect(withoutBookingRef({ type: 'pageview', url: 'not an address' })).toBeNull()
  })
})
