// The frame around every public page: the fonts, the colours (globals.css), the header with the menu,
// the page itself in <main>, and the footer. The admin (/admin) has its own frame in (payload).
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Fraunces, Source_Sans_3 } from 'next/font/google'
import type { ReactNode } from 'react'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { SITE_TITLE } from '@/content/riverside-voices'
import { cn } from '@/lib/utils'
import './globals.css'

// Our two fonts, free to share (SIL Open Font Licence): Fraunces for headings, Source Sans 3 for text.
// next/font downloads them once, while the site is built, and serves them from this site itself: no
// request to Google from the user's browser.
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
})
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-sans',
})

export const metadata: Metadata = {
  // The site's name on the home page's tab; every other page gives its own part, and the name is added
  // after it (src/content/riverside-voices.ts, SITE_TITLE).
  title: SITE_TITLE,
  description:
    'Riverside Voices: practice rooms for choirs, bands and theatre groups, to book online. A fictional choir, made for the course Building better websites.',
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(fraunces.variable, sourceSans.variable)}>
      <body className="flex min-h-screen flex-col">
        <Header />
        {/* tabIndex -1: the skip link can move the keyboard's focus here in every browser. It is not a
            stop for Tab, and it is not a control, so it shows no focus ring (not for a mouse click either). */}
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-page flex-1 px-gutter focus:outline-none">
          {children}
        </main>
        <Footer />
        {/* Page views for Vercel Web Analytics, only when NEXT_PUBLIC_ANALYTICS is "vercel" (see
            src/lib/analytics.ts). Without it, the site loads no analytics script at all. */}
        {process.env.NEXT_PUBLIC_ANALYTICS === 'vercel' && <Analytics />}
      </body>
    </html>
  )
}
