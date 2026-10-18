// What this is: the tawk.to chat window, our one integration (docs/decisions/integration.md). Next.js's
// Script runs tawk.to's own loader (src/lib/chat.ts) once, when the browser is idle after the page has
// loaded (lazyOnload): the chat never slows down the rooms or the booking form, and the page works the
// same if tawk.to does not answer. The site layout adds this only when NEXT_PUBLIC_CHAT is "tawk".
import Script from 'next/script'
import { TAWK_LOADER } from '@/lib/chat'

export function SiteChat() {
  return (
    <Script id="tawk-to-chat" strategy="lazyOnload">
      {TAWK_LOADER}
    </Script>
  )
}
