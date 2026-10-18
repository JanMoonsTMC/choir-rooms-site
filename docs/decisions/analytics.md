# Decision: analytics

Whether the site measures how it is used, and with which tool. Its reader comes later, with one
question: can I change this, and what happens if I do? Decided by Test B (research and testing), with
Test A, on 18 October 2026.

## The question

Which rooms and pages do groups actually look at, and do they reach the booking form, so that we know
which rooms to describe better and whether the rooms list leads to bookings?

## Options considered

- **No analytics.** Advantage: nothing to set up, nothing about users leaves the site. Drawback: we would
  only know about bookings (in `/admin`), never about the groups who looked and left.
- **Vercel Web Analytics, page views only (free Hobby plan).** Advantage: already built into the starter
  (`src/lib/analytics.ts`), no cookies and no cookie banner, no new account (it is part of the Vercel
  project we already have). Drawback: on Hobby only page views count, not our two events (`filter_used`,
  `booking_saved`), and only one month of reports is kept.
- **Matomo or Plausible.** Advantage: more reports, and custom events. Drawback: a new account or a server
  someone has to run and pay for; our brief allows free plans and no new accounts only.

## The decision

Vercel Web Analytics, page views only.

- **Installed**: the starter's `@vercel/analytics` package, loaded by `src/components/site/SiteAnalytics.tsx`
  in the site layout. It is switched on by `NEXT_PUBLIC_ANALYTICS=vercel` in `.env.production`, which every
  production build reads (the live site and the previews).
- **One change of our own**: every page view passes through `withoutBookingRef` (`src/lib/analytics.ts`)
  first, so a confirmation page is counted as `/rooms/the-loft/booked`, without the signed booking
  reference in its address.
- **Still to do in the dashboard** (the repository owner): Vercel → the project → **Analytics** →
  **Enable**. Until then nothing is recorded, and the script's address answers 404.
- **How we checked it**: the tests (`tests/unit/analytics.test.ts`: the layout loads it only when switched
  on; the booking reference is removed and every other address kept), and in the browser on our own
  production build: the page's HTML loads the script once per page.

## Why

- It answers our question with page views alone: views of each `/rooms/<slug>` against views of its
  `/booked` page show which rooms lead to bookings.
- Vercel's documentation (read on 18 October 2026) says it sets no cookies, identifies visits by a hash
  that is discarded after 24 hours, and stores no personal identifiers; so our privacy page can stay
  short and no cookie banner is needed.
- The Hobby plan includes 50,000 events a month; our site will see far fewer.

## Consequences

- We cannot count the two steps the starter marks as events (`filter_used`, `booking_saved`): they need a
  paid plan, and Vercel drops them on Hobby. The calls stay in the code, ready for a later plan.
- Reports cover one month only, so we read them monthly.
- Users' page views go to Vercel; the privacy page says so ("Counting visits"), and the live privacy page
  got this text through the migration `20261018_000041_privacy_analytics`.
- When the 50,000 events are used up, collection pauses until the next month; the site keeps working.

## Facts read on

- 18 October 2026: [Pricing for Web Analytics](https://vercel.com/docs/analytics/limits-and-pricing)
  (Hobby: 50,000 events a month, no custom events, one-month reporting window, collection pauses at the
  limit).
- 18 October 2026: [Privacy and Compliance](https://vercel.com/docs/analytics/privacy-policy) (no
  third-party cookies, a request hash discarded after 24 hours, the data stored per page view).
- 18 October 2026: [Getting started with Vercel Web Analytics](https://vercel.com/docs/analytics/quickstart)
  (enable it per project in the dashboard; the `Analytics` component in the root layout).

## Review when

When we want to count filters and bookings as events (then a paid plan, or another tool in `track()`),
when the reports show more than 30,000 page views in a month, or when the site gets real users and their
personal data.
