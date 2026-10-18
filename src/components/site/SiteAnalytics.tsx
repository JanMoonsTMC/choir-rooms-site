'use client'

// What this is: Vercel Web Analytics' page-view script, with one change: every page view passes through
// withoutBookingRef first (src/lib/analytics.ts), so a confirmation page's booking reference is never
// sent. 'use client' because the function that changes the page view runs in the browser.
// The site layout adds this only when NEXT_PUBLIC_ANALYTICS is "vercel" (see .env.production).
import { Analytics } from '@vercel/analytics/next'
import { withoutBookingRef } from '@/lib/analytics'

export function SiteAnalytics() {
  return <Analytics beforeSend={withoutBookingRef} />
}
