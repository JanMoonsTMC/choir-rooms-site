// What this is: the big opening of the home page: a dark band with faint music staff lines, a short line
// above the title (the tagline), the title in our heading serif, one or two sentences and the main
// actions; on wide screens a round picture on the right, in a brass ring like a stage light. On a phone
// the picture goes below the text, smaller. No slideshow: one clear message and the way to book.
//
// The title, text and picture come from the home page's record and the media library in /admin; the
// actions from src/app/(site)/page.tsx.
import Image from 'next/image'
import type { ReactNode } from 'react'

// W4: put your own name in this tagline
const TAGLINE = 'Practice rooms for choirs, bands and theatre groups · a site by Test A and Test B'

type HeroProps = {
  title: string
  text?: string | null
  actions?: ReactNode
  image?: { src: string; alt: string; width: number; height: number } | null
}

export function Hero({ title, text, actions, image }: HeroProps) {
  return (
    <section className="staff-lines grid items-center gap-block overflow-hidden rounded-panel bg-ink p-6 text-canvas sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14 lg:p-14">
      <div className="grid gap-5">
        <p className="text-sm font-bold tracking-[0.08em] text-brass-tint uppercase">{TAGLINE}</p>
        <h1 className="text-4xl">{title}</h1>
        {text && <p className="max-w-[46ch] text-lg text-canvas/90">{text}</p>}
        {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {image && (
        // A circle with a brass ring: the stage light our pictures sit in.
        <div className="relative mx-auto aspect-square w-48 overflow-hidden rounded-full border-8 border-brass sm:w-64 lg:w-full lg:max-w-sm">
          <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 1024px) 24rem, 16rem" className="object-cover" />
        </div>
      )}
    </section>
  )
}
