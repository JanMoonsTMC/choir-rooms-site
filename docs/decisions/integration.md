# Decision: an integration

Written by: Test A, with Test B

Whether the site connects to another service, and to which. Its reader comes later, with one question:
can I change this, and what happens if I do?

This record replaces our first one of the same day, which chose a calendar file made by our own site.
That file is not on the course's suggested list, so it stays as a feature of the booking task
(`docs/content-structure.md`, "Features of the tasks"; `calendar-file.md`), and it is no longer our
integration.

## The question

- **The question:** Which one service from the course's suggested list (chapter 8.3, "Your integration
  project's candidates") helps groups most with our two tasks?
- **The need or requirement behind it:** Requirement R13: a group can ask the choir a question from any
  public page, without leaving the page and without an account. Our pages leave questions open
  (`docs/test-report.md`, findings 2 and 3: how long a slot is, how to pay or cancel; finding 7: groups
  that need a piano may look for other words). The only other way to ask is the Contact page's e-mail
  address, which is a made-up `.example` address where nothing arrives.

## Options considered

| Option | What it would give | What it would cost |
| --- | --- | --- |
| No integration: only the calendar file our own site makes | Nothing leaves our site, and no account is needed. | It is not on the suggested list, and it answers no question a group has before booking. |
| tawk.to, a chat window (an embed: tawk.to's script runs in our pages and draws the chat) | Free for life with its "Powered by tawk.to" line. A question is asked on the page the group is reading. No secret key, only a public widget address. | A script from another company on every page, which stores its own cookies and local storage in the user's browser. The messages go to tawk.to. It needs a tawk.to account, and someone has to answer. |
| Cal.com, a booking calendar (an embed, or a link to its booking page) | Calendars and reminders included. | An account, and it would replace our own booking task (R6 to R9: one group per slot, group size, made-up data) instead of supporting it. |
| Resend, an e-mail service (an API request, and a webhook back) | A confirmation e-mail arrives where people look. | An account, a secret API key on our server and a sending domain. It would send real e-mails to the made-up addresses our site holds. |
| OpenStreetMap, a map (an embed from its Share panel, or a "Directions" link) | No account and no key. | It answers only "where is it?", which the Contact page's address already answers. An embedded map sends every user's internet address to OpenStreetMap's servers. |
| A newsletter sign-up (no provider named on the list) | We could tell groups about new time slots. | It collects e-mail addresses, real personal data that our test site must not hold, and we have nothing to send regularly. |

## The decision

- **We chose:** The tawk.to chat window, on every public page.
- **What we installed, and where its settings are:** No package. `src/lib/chat.ts` holds tawk.to's own
  loader, as its dashboard gives it (Administration → Chat Widget), and the widget's address
  `https://embed.tawk.to/6ad4b263b2e7a834cef07781/1k57dhl5o`. `src/components/site/SiteChat.tsx` runs
  it with Next.js's `Script` (`lazyOnload`), in the public pages' frame (`src/app/(site)/layout.tsx`),
  so every public page has it and `/admin` does not. `NEXT_PUBLIC_CHAT=tawk` in `.env.production`
  switches it on for every production build; any other value, or none, leaves the chat out. The chat's
  own settings (its colours, its greeting, when it shows as offline) are in tawk.to's dashboard, in the
  account that owns the property.
- **How we checked that it does what we expected:** The unit tests (`tests/unit/chat.test.ts`) and the
  privacy migration's tests (`tests/integration/live-content.test.ts`) passed in CI on pull request #8.
  Its Vercel preview did not build, so we checked on the live site on 18 October 2026, right after the
  merge, in Chrome driven by a script (puppeteer, headless, at 1100 px): `/` and `/rooms` each requested
  the widget's address (200) and showed the chat button in the bottom corner; pressing it opened the
  chat window ("Hi! How can we help?" and a box "Type here and press enter"). `/admin/login` holds no
  tawk.to address, and `/privacy` shows "The chat window".
- **Who took part in the decision:** Test A (releases), with Test B, on 18 October 2026.

## Why

- **Why we chose it:**
  - It is the one candidate that answers R13: a question on the page the group is reading, before it
    books. Cal.com would replace our booking task, Resend and a newsletter would hold or send real
    e-mail addresses, and the map answers a question the Contact page already answers.
  - It costs nothing: tawk.to's pricing page (read on 18 October 2026) says the chat is free for life
    as long as its "Powered by tawk.to" line stays.
  - It needs no account of ours and no secret key: the teacher made the tawk.to property for this test
    project and gave us its public widget address.
  - The booking does not depend on it: the chat loads after the page, and a page whose chat fails to
    load works the same.
- **What this evidence cannot tell us:** We typed no message and have no login to tawk.to, so we have
  not seen a message arrive in the dashboard. That is for the account holder to check. The browser
  checks cannot tell either: their Chrome cannot reach tawk.to (`playwright.config.ts`), and axe never
  audits tawk.to's widget.

## Consequences

- **The accounts it needs, and its cost in money and in time:** One tawk.to account, here the teacher's.
  No money while the "Powered by tawk.to" line stays (removing it costs USD 29 a month). Time: someone
  has to read and answer the messages.
- **Who maintains it:** The holder of the tawk.to account reads and answers the messages and changes the
  chat's settings. The releases role keeps the widget's address in `src/lib/chat.ts`.
- **What we give up:** tawk.to's code runs in our pages with the same rights as ours. Lighthouse and axe
  on the live site now also see tawk.to's widget, which we do not control. And the site, which holds
  made-up data only, now takes real text: a chat message is whatever a user types. The privacy page
  asks for made-up details in the chat too.
- **How we could leave the service later:** Give `NEXT_PUBLIC_CHAT` in `.env.production` any value but
  `tawk`, and take "The chat window" off the privacy page. A next owner who keeps the chat makes their
  own tawk.to property and puts its widget address in `src/lib/chat.ts` (`docs/handover.md`).
- **The personal data that leaves our site, and whether it needs a cookie banner:** When a page loads
  the chat, the user's browser sends tawk.to the user's internet address, the browser's details and the
  page's address, and tawk.to stores its cookies and local storage (one of them recognises the browser
  for six months), before anyone types. A message is sent only when the user types one, with a name or
  an e-mail address only if the user gives one. Nothing of our bookings goes to tawk.to. Our privacy
  page says all this ("The chat window"; the live page got the text through the migration
  `20261018_120000_privacy_chat`). We show no consent question. A site with real users has to decide
  whether it must: tawk.to can ask for consent before it stores anything (its consent form, in its
  dashboard).
- **What happens to our site when the service is down:** There is no chat button, and everything else
  works. When nobody answers, a question waits in tawk.to.

## Facts read on

| Page | Its link | Read on |
| --- | --- | --- |
| tawk.to Help Center, Adding a widget to your website (the widget code from Administration → Chat Widget; each property has its own code) | https://help.tawk.to/article/adding-a-widget-to-your-website | 18 October 2026 |
| tawk.to Help Center, What are tawk.to cookies and what do they do? (its cookies and local storage, one recognising a returning user's browser for six months; without its consent form, "cookies will be stored as soon as the widget loads") | https://help.tawk.to/article/what-are-tawkto-cookies-and-what-do-they-do | 18 October 2026 |
| tawk.to Pricing (the chat is free; removing the "Powered by tawk.to" line costs USD 29 a month) | https://www.tawk.to/pricing/ | 18 October 2026 |
| tawk.to Privacy Policy (the site that uses the widget is the data controller; tawk.to collects the internet addresses of the site's users and keeps data as long as its purposes need) | https://www.tawk.to/privacy-policy/ | 18 October 2026 |
| The course's list of candidates, chapter 8.3 "Integration Patterns: APIs and Webhooks", which classes tawk.to as an embed | In the course | 18 October 2026 |

## Review when

When the site gets real users (then: tawk.to's consent form or a consent question of our own, and the
privacy page again), when the site is handed to an owner with their own tawk.to account, when nobody
answers the chat for a week, or when tawk.to's free plan or its cookies change.
