// The tawk.to chat window, our one integration (src/lib/chat.ts, src/components/site/SiteChat.tsx and the
// site layout). The layout is read without rendering it, as in analytics.test.ts: the test sees which
// components it uses, and nothing is loaded from tawk.to.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The layout's other parts replaced by nothing (they need a database and Next.js's font loader).
vi.mock('next/font/google', () => ({ Fraunces: () => ({ variable: 'font-heading' }), Source_Sans_3: () => ({ variable: 'font-body' }) }))
vi.mock('@/components/site/Header', () => ({ Header: () => null }))
vi.mock('@/components/site/Footer', () => ({ Footer: () => null }))
vi.mock('@/components/site/SiteAnalytics', () => ({ SiteAnalytics: () => null }))

import { SiteChat } from '@/components/site/SiteChat'
import SiteLayout from '../../src/app/(site)/layout'
import { chatOn, TAWK_LOADER, TAWK_WIDGET_URL } from '../../src/lib/chat'

const usesChat = () => JSON.stringify(SiteLayout({ children: null }), (_key, value) => (value === SiteChat ? 'CHAT' : value)).includes('CHAT')

describe('the chat switch', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is on only for exactly "tawk"', () => {
    for (const value of [undefined, '', 'off', 'Tawk', 'tawk.to']) {
      vi.stubEnv('NEXT_PUBLIC_CHAT', value)
      expect(chatOn(), String(value)).toBe(false)
    }
    vi.stubEnv('NEXT_PUBLIC_CHAT', 'tawk')
    expect(chatOn()).toBe(true)
  })

  it('the site layout adds the chat only when it is on', () => {
    vi.stubEnv('NEXT_PUBLIC_CHAT', undefined)
    expect(usesChat()).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_CHAT', 'off')
    expect(usesChat()).toBe(false)
    vi.stubEnv('NEXT_PUBLIC_CHAT', 'tawk')
    expect(usesChat()).toBe(true)
  })

  it('every production build switches it on, and the browser checks cannot reach tawk.to', () => {
    expect(readFileSync(new URL('../../.env.production', import.meta.url), 'utf8')).toMatch(/^NEXT_PUBLIC_CHAT=tawk$/m)
    // Read as text, as ci-workflow.test.ts reads the workflow: the checks' browser for every project
    // starts with Chrome's rule that tawk.to's host names do not exist.
    const config = readFileSync(new URL('../../playwright.config.ts', import.meta.url), 'utf8')
    expect(config).toContain("export const TAWK_BLOCKED = '--host-resolver-rules=MAP tawk.to ~NOTFOUND, MAP *.tawk.to ~NOTFOUND'")
    expect(config).toMatch(/^ {4}launchOptions: \{ args: \[TAWK_BLOCKED\] \},$/m)
    expect(config.slice(config.indexOf('projects:'))).not.toContain('launchOptions')
  })
})

describe('the chat loader', () => {
  it("is tawk.to's own snippet for our widget, run once the page has loaded", () => {
    expect(TAWK_WIDGET_URL).toBe('https://embed.tawk.to/6ad4b263b2e7a834cef07781/1k57dhl5o')
    expect(TAWK_LOADER).toContain("s1.src='https://embed.tawk.to/6ad4b263b2e7a834cef07781/1k57dhl5o'")
    expect(TAWK_LOADER).toMatch(/^var Tawk_API=Tawk_API\|\|\{\}, Tawk_LoadStart=new Date\(\);/)
    const script = SiteChat()
    expect(script.props).toMatchObject({ id: 'tawk-to-chat', strategy: 'lazyOnload', children: TAWK_LOADER })
  })

  it('runs in a page: it adds the widget script before the first script, with nothing else sent', () => {
    // A tiny stand-in for the page: one script tag already there, as in every page of the site.
    const inserted: Array<Record<string, unknown>> = []
    const first = { parentNode: { insertBefore: (node: Record<string, unknown>) => inserted.push(node) } }
    const document = {
      createElement: () => ({ setAttribute(name: string, value: string) { (this as Record<string, unknown>)[name] = value } }),
      getElementsByTagName: () => [first],
    }
    new Function('document', 'Tawk_API', TAWK_LOADER)(document, undefined)
    expect(inserted).toHaveLength(1)
    expect(inserted[0]).toMatchObject({ src: TAWK_WIDGET_URL, async: true, charset: 'UTF-8', crossorigin: '*' })
  })
})
