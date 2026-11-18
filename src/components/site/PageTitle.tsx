// What this is: the title at the top of an ordinary page (About, Contact, the clinic list...), in a
// light coloured panel, with an optional sentence below it that says what the page is for and an
// optional picture on the right (below the text on phones). Every page has exactly one <h1>: this
// one (the home page uses Hero instead).
//
// What to change for your own site: the panel's colour with `tone`; the sizes and colours come from
// the tokens in globals.css.
import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = { river: 'bg-river-wash', blue: 'bg-mist', plum: 'bg-plum-wash', straw: 'bg-straw-wash' }

type PageTitleProps = {
  title: string
  intro?: string | null
  tone?: keyof typeof TONES
  image?: { src: string; alt: string } | null
  // The colour of the picture's offset: brass for the clinic, plum for the workshops.
  imageAccent?: 'brass' | 'plum'
  // Optional small things under the intro, for example badges.
  children?: ReactNode
  // For example a smaller top margin when a "Workshops ›" line (ParentLink) sits above the title.
  className?: string
}

export function PageTitle({ title, intro, tone = 'river', image, imageAccent = 'brass', children, className }: PageTitleProps) {
  return (
    <header
      className={cn(
        'mt-6 mb-block grid items-center gap-8 rounded-panel p-6 sm:mt-10 sm:p-10 lg:px-14',
        image && 'md:grid-cols-[1.4fr_1fr]',
        TONES[tone],
        className,
      )}
    >
      <div className="grid gap-4">
        <h1 className="max-w-[22ch] text-3xl">{title}</h1>
        {intro && <p className="max-w-(--container-reading) text-lg">{intro}</p>}
        {children}
      </div>
      {image && (
        <div
          className={cn(
            'framed relative aspect-[3/2] overflow-hidden [--offset-size:8px]',
            imageAccent === 'plum' ? 'offset-plum' : 'offset-brass',
          )}
        >
          {/* priority: the title's picture is the biggest thing a phone shows first, so it loads at once
              instead of lazily (Lighthouse's "largest contentful paint", found in our test round 1). */}
          <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 768px) 24rem, 100vw" className="object-cover" />
        </div>
      )}
    </header>
  )
}
