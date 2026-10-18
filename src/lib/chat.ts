// What this is: the switch and the loader for our one integration, the tawk.to chat window
// (docs/decisions/integration.md). The site layout (src/app/(site)/layout.tsx) adds the chat to every
// public page only when NEXT_PUBLIC_CHAT is exactly "tawk": our .env.production sets it for every
// production build (the live site and the previews). Without it (npm run dev, the unit tests) no chat
// script is loaded and nothing goes to tawk.to. The browser checks test a production build, so the chat
// is on there, but their browser cannot reach tawk.to (playwright.config.ts).
//
// The widget's address is public: it says which tawk.to account and widget the chat belongs to, and it
// is in every page that shows the chat. It is not a secret key; there is none for this integration.

/** The chat widget of the tawk.to property for this site (the account holder's dashboard shows it). */
export const TAWK_WIDGET_URL = 'https://embed.tawk.to/6ad4b263b2e7a834cef07781/1k57dhl5o'

/**
 * tawk.to's own loader, as its dashboard gives it (Administration → Chat Widget), with only the widget
 * address taken from TAWK_WIDGET_URL. It adds the widget's script to the page; the script then draws
 * the chat button in the bottom corner.
 */
export const TAWK_LOADER = `var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date(); (function(){ var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0]; s1.async=true; s1.src='${TAWK_WIDGET_URL}'; s1.charset='UTF-8'; s1.setAttribute('crossorigin','*'); s0.parentNode.insertBefore(s1,s0); })();`

/**
 * True only when NEXT_PUBLIC_CHAT is exactly "tawk". NEXT_PUBLIC_ settings are copied into the site when
 * it is built, so after changing this one, build (or restart npm run dev) again.
 */
export function chatOn(): boolean {
  return process.env.NEXT_PUBLIC_CHAT === 'tawk'
}
