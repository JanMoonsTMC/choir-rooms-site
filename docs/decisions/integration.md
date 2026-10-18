# Decision: an integration

Whether the site connects to another service, and to which. Its reader comes later, with one question:
can I change this, and what happens if I do? Decided by Test A (releases), with Test B, on 18 October 2026.
This record replaces our first one of the same day, which chose a calendar file made by our own site: that
file is not on the course's suggested list, so it stays as a feature of the booking task
(`docs/content-structure.md`, "Features of the tasks"), and it is no longer our integration.

## The question

Which one service from the course's suggested list (chapter 8.3, "Your integration project's candidates")
helps groups most with our two tasks? We chose it for requirement **R13**: a group can ask the choir a
question from any public page, without leaving the page and without an account. Our pages leave
questions open (test round 1, findings 2 and 3: how long a slot is, how to pay or cancel; round 2: groups
that need a piano or step-free access may look for other words), and the only way to ask today is the
Contact page's e-mail address, which is a made-up `.example` address where nothing arrives.

## Options considered

- **tawk.to, a chat window** (an embed: tawk.to's script runs in our pages and draws the chat). Advantage:
  free for life with its "Powered by tawk.to" line; a question is asked on the page the group is reading;
  no secret key, only a public widget address. Drawback: a script from another company on every page, which
  stores its own cookies and local storage in the user's browser; the messages go to tawk.to; it needs a
  tawk.to account, and someone has to answer.
- **Cal.com, a booking calendar** (an embed, or a link to its booking page). Advantage: calendars and
  reminders included. Drawback: an account, and it would replace our own booking task (R6 to R9: one group
  per slot, group size, made-up data) instead of supporting it.
- **Resend, an e-mail service** (an API request, and a webhook back). Advantage: a confirmation e-mail
  arrives where people look. Drawback: an account, a secret API key on our server and a sending domain;
  and it would send real e-mails to the made-up addresses our site holds.
- **OpenStreetMap, a map** (an embed from its Share panel, or a "Directions" link). Advantage: no account
  and no key. Drawback: it answers only "where is it?", which the Contact page's address already answers;
  an embedded map sends every user's internet address to OpenStreetMap's servers.
- **A newsletter sign-up** (no provider named on the list). Advantage: we could tell groups about new time
  slots. Drawback: it collects e-mail addresses, real personal data that our test site must not hold, and
  we have nothing to send regularly.
- **Only the calendar file our own site makes** (no service). Advantage: nothing leaves our site, no
  account. Drawback: not on the suggested list, and it answers no question a group has before booking.

## The decision

The tawk.to chat window, on every public page.

- **Installed**: no package. `src/lib/chat.ts` holds tawk.to's own loader, as its dashboard gives it
  (Administration → Chat Widget), and the widget's address
  `https://embed.tawk.to/6ad4b263b2e7a834cef07781/1k57dhl5o`. `src/components/site/SiteChat.tsx` runs it
  with Next.js's `Script` (`lazyOnload`: once the page has loaded and the browser is idle). It is in the
  public pages' frame, `src/app/(site)/layout.tsx`, so every public page has it and `/admin` does not.
- **Its settings**: switched on by `NEXT_PUBLIC_CHAT=tawk` in `.env.production`, which every production
  build reads (the live site and the previews). Any other value, or none, leaves the chat out: on our own
  computers with `npm run dev`, and in the unit tests. The browser checks test a production build, so the
  chat is on there, but their Chrome cannot reach tawk.to (`playwright.config.ts`): they test our own
  pages, never wait on tawk.to, and axe never audits tawk.to's widget. The chat's own settings (its
  colours, its greeting, when it shows as offline) are in tawk.to's dashboard, in the account that owns
  the property.
- **What it holds and sends**: the widget address in the page is a public identifier, not a secret; this
  integration has no secret key. When a page loads the chat, the user's browser fetches tawk.to's script
  and sends tawk.to the user's internet address, the browser's details and the page's address; tawk.to
  stores its cookies and local storage (one of them recognises the browser for six months). A message is
  sent only when the user types one, with a name or e-mail address only if the user gives one. Nothing of
  our bookings goes to tawk.to: the chat and the booking form do not share anything.
- **How we checked it**: the unit tests (`tests/unit/chat.test.ts`: the layout adds the chat only when
  the switch says `tawk`; the loader is tawk.to's snippet with our widget's address; every production build
  switches it on and the browser checks' Chrome cannot reach tawk.to) and the privacy migration's tests
  (`tests/integration/live-content.test.ts`). In a browser: not yet (the preview of pull request #12
  first, then the live site). That a message reaches the dashboard is for the account holder to check: we
  have no login to tawk.to, so we will not see one arrive.

## Why

- It is the one candidate that answers R13: a question on the page the group is reading, before it books.
  Cal.com would replace our booking task, Resend and a newsletter would hold or send real e-mail addresses,
  and the map answers a question the Contact page already answers.
- It costs nothing: tawk.to's pricing page (read on 18 October 2026) says the chat is free for life as long
  as its "Powered by tawk.to" line stays.
- It needs no account of ours and no secret key: the teacher made the tawk.to property for this test
  project and gave us its public widget address.
- The booking does not depend on it: the chat loads after the page, and a page whose chat fails to load
  works the same.

## Consequences

- **Privacy**: every page view now reaches tawk.to (internet address, browser, page), and tawk.to stores
  cookies and local storage in the browser as soon as the chat loads, before anyone types. Our privacy
  page says so ("The chat window"; the live page got the text through the migration
  `20261018_120000_privacy_chat`), and that typing is optional. We show no consent question: tawk.to can
  ask for consent before it stores anything (its consent form, in its dashboard), and a site with real
  users should decide whether it must.
- **A third-party script on every page**: tawk.to's code runs in our pages with the same rights as ours.
  If tawk.to is down or blocked, there is no chat button and everything else works. Lighthouse and axe on
  the live site now also see tawk.to's widget, which we do not control.
- **The account's owner**: the property belongs to the teacher's tawk.to account, not to us. Only its
  holder reads and answers the messages and changes the chat's settings; when nobody answers, a question
  waits there. A next owner needs their own tawk.to property and puts its widget address in `src/lib/chat.ts`
  (`docs/handover.md`).
- **Messages are real**: the site holds made-up data only, but a chat message is whatever a user types.
  The privacy page asks for made-up details in the chat too.

## Facts read on

- 18 October 2026: [tawk.to Help Center, Adding a widget to your website](https://help.tawk.to/article/adding-a-widget-to-your-website)
  (the widget code from Administration → Chat Widget, pasted before the closing body tag; each property has
  its own code).
- 18 October 2026: [tawk.to Help Center, What are tawk.to cookies and what do they do?](https://help.tawk.to/article/what-are-tawkto-cookies-and-what-do-they-do)
  (its cookies and local storage, one recognising a returning user's browser for six months; without its
  consent form, "cookies will be stored as soon as the widget loads").
- 18 October 2026: [tawk.to Pricing](https://www.tawk.to/pricing/) (the chat is free; removing the
  "Powered by tawk.to" line costs USD 29 a month).
- 18 October 2026: [tawk.to Privacy Policy](https://www.tawk.to/privacy-policy/) (the site that uses the
  widget is the data controller; tawk.to collects the internet addresses of the site's users and keeps
  data as long as its purposes need).
- 18 October 2026: the course's list of candidates, chapter 8.3 "Integration Patterns: APIs and Webhooks",
  which classes tawk.to as an embed.

## Review when

When the site gets real users (then: tawk.to's consent form or a consent question of our own, and the
privacy page again), when the site is handed to an owner with their own tawk.to account, when nobody
answers the chat for a week, or when tawk.to's free plan or its cookies change.
