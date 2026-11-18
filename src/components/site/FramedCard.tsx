// What this is: a card for one thing the user can open, such as a room: a thin ink frame with a thick
// coloured band along its top (like the edge of a music folder), an optional picture under it, a title
// that is the link, and whatever details you put inside. The picture stays on top at every width, so the
// cards in a list line up.
//
// What to change for your own site: the band's colour per card with `accent`; the sizes and colours come
// from the tokens in globals.css.
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FramedCardProps = {
  title: string
  href?: string
  image?: { src: string; alt: string } | null
  accent?: 'river' | 'plum' | 'brass' | 'straw'
  // The title's heading level: h2 when the cards are the page's main list, h3 under another heading.
  headingLevel?: 'h2' | 'h3'
  children?: ReactNode
  className?: string
}

const BANDS = { river: 'border-t-river', plum: 'border-t-plum', brass: 'border-t-brass', straw: 'border-t-straw' }

export function FramedCard({ title, href, image, accent = 'plum', headingLevel = 'h3', children, className }: FramedCardProps) {
  const Heading = headingLevel
  return (
    <article className={cn('grid content-start overflow-hidden rounded-frame border-[1.5px] border-t-8 border-ink bg-canvas', BANDS[accent], className)}>
      {image && (
        <div className="relative aspect-[3/2] border-b-[1.5px] border-ink">
          {/* A fixed shape (aspect ratio) holds the picture's place, so nothing jumps while it loads. */}
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 28rem, 100vw" className="object-cover" />
        </div>
      )}
      <div className="grid content-start gap-3 p-5 sm:p-6">
        <Heading className="text-xl">
          {href ? (
            <Link href={href} className="text-ink underline decoration-ink/40 decoration-2 underline-offset-4 hover:decoration-link">
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        {children}
      </div>
    </article>
  )
}
