# Decision: analytics

Written by: Test B, with Test A

Whether the site measures how it is used, and with which tool. Its reader comes later, with one
question: can I change this, and what happens if I do?

## The question

- **The question:** Which rooms and pages do groups look at, and do they reach the booking form?
- **The need or requirement behind it:** The choir wants to know which rooms to describe better, and
  whether the rooms list leads to bookings. Bookings alone (in `/admin`) say nothing about the groups
  who looked and left.

## Options considered

| Option | What it would give | What it would cost |
| --- | --- | --- |
| No analytics | Nothing to set up, and nothing about users leaves the site. | We would only know about bookings, never about the groups who looked and left. |
| Vercel Web Analytics, page views only (free Hobby plan) | It is already built into the starter (`src/lib/analytics.ts`). It sets no cookies, so no cookie banner, and it needs no new account: it is part of the Vercel project we already have. | On Hobby only page views count, not our two events (`filter_used`, `booking_saved`), and only one month of reports is kept. |
| Matomo or Plausible | More reports, and custom events. | A new account, or a server someone has to run and pay for. Our brief allows free plans only, and no new accounts. |

## The decision

- **We chose:** Vercel Web Analytics, page views only.
- **What we installed, and where its settings are:** The starter's `@vercel/analytics` package, loaded
  by `src/components/site/SiteAnalytics.tsx` in the site layout. `NEXT_PUBLIC_ANALYTICS=vercel` in
  `.env.production` switches it on for every production build (the live site and the previews). In the
  dashboard, Vercel → the project → **Analytics** → **Enable** is done. One change of our own: every
  page view passes through `withoutBookingRef` (`src/lib/analytics.ts`) first, so a confirmation page is
  counted as `/rooms/the-loft/booked`, without the signed booking reference in its address.
- **How we checked that it does what we expected:** The tests (`tests/unit/analytics.test.ts`): the
  layout loads it only when switched on, and the booking reference is removed while every other address
  is kept. On 18 October 2026 on the live site, in Chrome driven by a script (puppeteer, headless):
  opening `/rooms` loaded the analytics script (200) and then sent the page view (200). Vercel's script
  ignores browsers that say they are automated, so for this check the browser gave an ordinary Chrome
  user agent.
- **Who took part in the decision:** Test B (research and testing), with Test A, on 18 October 2026.

## Why

- **Why we chose it:**
  - It answers our question with page views alone: the views of each `/rooms/<slug>` against the views
    of its `/booked` page show which rooms lead to bookings.
  - Vercel's documentation (read on 18 October 2026) says it sets no cookies, identifies visits by a
    hash that is discarded after 24 hours, and stores no personal identifiers. So our privacy page can
    stay short and no cookie banner is needed.
  - The Hobby plan includes 50,000 events a month; our site will see far fewer.
- **What this evidence cannot tell us:** We saw the page view being sent, not arriving: we have not yet
  read it in the dashboard's reports. What Vercel stores we know from its documentation only.

## Consequences

- **Its cost in money and in time:** No money on the Hobby plan. Reports cover one month only, so
  someone reads them every month. When the 50,000 events are used up, collection pauses until the next
  month; the site keeps working.
- **Who maintains it:** The releases role, who reads the Vercel dashboard (`docs/handover.md`).
- **What we give up:** We cannot count the two steps the starter marks as events (`filter_used`,
  `booking_saved`): they need a paid plan, and Vercel drops them on Hobby. The calls stay in the code,
  ready for a later plan.
- **How we could leave the tool later:** Remove `NEXT_PUBLIC_ANALYTICS` from `.env.production`: the
  layout then loads no analytics script. Then also take the part "Counting visits" off the privacy page.
- **The data it collects about our users, and whether it needs a cookie banner:** Users' page views go
  to Vercel, without cookies and without a personal identifier, so no cookie banner. The privacy page
  says so ("Counting visits"); the live privacy page got this text through the migration
  `20261018_000041_privacy_analytics`.

## Facts read on

| Page | Its link | Read on |
| --- | --- | --- |
| Pricing for Web Analytics (Hobby: 50,000 events a month, no custom events, one month of reports, collection pauses at the limit) | https://vercel.com/docs/analytics/limits-and-pricing | 18 October 2026 |
| Privacy and Compliance (no third-party cookies, a request hash discarded after 24 hours, the data stored per page view) | https://vercel.com/docs/analytics/privacy-policy | 18 October 2026 |
| Getting started with Vercel Web Analytics (enable it per project in the dashboard; the `Analytics` component in the root layout) | https://vercel.com/docs/analytics/quickstart | 18 October 2026 |

## Review when

When we want to count filters and bookings as events (then a paid plan, or another tool in `track()`),
when the reports show more than 30,000 page views in a month, or when the site gets real users and their
personal data.
