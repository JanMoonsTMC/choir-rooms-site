# Hand-over

Everything the next owner of this site needs. Never write a password, a secret or a connection string
in this file.

## Who owns what

Each responsibility, with an owner named as a role, who can log in, and when it was last tested.

| Service | What it holds | Owner (account name, not the password) |
| --- | --- | --- |
| GitHub | the code: `JanMoonsTMC/choir-rooms-site` | Releases and repository role (Test A), GitHub account `JanMoonsTMC`; Test B (`jnmoons`) is a collaborator |
| Vercel | the live site and its settings: project `choir-rooms-site` | Releases role (Test A), in the Vercel account that owns the project |
| Neon | the database (connected through Vercel, Frankfurt) | Same Vercel account, through Storage; no separate Neon login is needed |
| Vercel Blob | the images (public store, Production only) | Same Vercel account, through Storage |
| tawk.to | the chat window on every public page (its property and widget `6ad4b263b2e7a834cef07781/1k57dhl5o`), its settings, and every message users type in it | The teacher's tawk.to account, made for this test project; no team member has a tawk.to login |

- **Content in `/admin`**: the choir's room manager keeps the rooms, equipment and time slots; the
  secretary keeps the pages and the Site facts; the treasurer reads the bookings for the invoices. Each
  gets an editor account from an existing editor (`/admin` → Users → Create new). The first editor is the
  one in Vercel's settings `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD`, held by the releases role.
  Last tested: never on the live site (on 18 October 2026 nobody in the team could log in there yet; the
  live content came through migrations instead, see `docs/decisions/live-content.md`). Tested on our own
  computers every day of the project.
- **The chat** (tawk.to): the holder of the tawk.to account reads and answers the messages in tawk.to's
  dashboard, and changes the chat's look and greeting there. Last tested: 18 October 2026 on the live
  site: the button shows on `/` and `/rooms` and opens the chat window; no message sent, so nobody has yet
  seen one arrive in the dashboard. A next owner makes their own tawk.to property and puts its widget address in
  `src/lib/chat.ts`; `NEXT_PUBLIC_CHAT` in `.env.production` switches the chat off (any value but `tawk`).
- **What needs a developer**: a new field or collection (a migration), a new page, and any content
  change on the live site while nobody can log in to `/admin` (a data migration, as we did).
- **Updates** (Node, Next.js, Payload): releases role; never done since the start (the starter's
  versions, Node 22).
- **Monitoring**: releases role reads the Vercel dashboard (deployments, functions' errors, Analytics)
  once a week. Last done: 18 October 2026 (deployments only; Analytics is switched on, its reports not
  read yet).
- **Backup and restore**: Neon keeps a restore window (point-in-time restore from the Neon console, reached
  through Vercel → Storage). Owner: releases role. Last tested: never.
- **Ownership of the name and the content**: Riverside Voices is a made-up choir for a course project;
  the pictures are our own drawings from Lucide icons (`src/seed/images/SOURCES.md`).

## Left out, and in which order

Ranked by what users and the choir lose without it:

1. **New time slots after the first eight weeks.** The live site has slots until 13 December 2026 (eight
   weeks from the deploy of 18 October). After that groups can book nothing until someone adds slots in
   `/admin` → Time Slots, one by one. Next to build: a button or a small script that adds the next eight
   weeks of the weekly pattern (`src/tasks/book-slot/comingSlots.ts` already works them out).
2. **A confirmation e-mail.** Groups only have the confirmation page and the calendar file; a lost tab
   means a forgotten booking. Needs an e-mail service (an account and a key), so it was out of scope.
3. **Changing or cancelling a booking yourself.** Today a group e-mails us and an editor changes it.
4. **Comparing rooms side by side** (test round 2, finding 9).
5. **Typing the exact group size in the filter** instead of choosing a range (round 2, finding 8).
6. **Repeating bookings** (every Tuesday until June), real photos of the rooms, and a Dutch version.

What does not work yet, or could break, and what to do about it:

- **Web Analytics ignores automated browsers**: a check by script (Playwright, puppeteer) loads the script
  but sends no page view unless the browser gives an ordinary user agent (`docs/decisions/analytics.md`).
- **The chat depends on tawk.to and on its account**: if tawk.to is down or a browser blocks it, there is
  no chat button and everything else works. If the teacher's tawk.to account or its property is removed,
  the button disappears or shows an error: switch the chat off (`NEXT_PUBLIC_CHAT`) or put in a new
  property's address. A question nobody answers waits in tawk.to.
- **The time slots run out on 13 December 2026** (see 1 above).
- **Six old bicycle photos are still files in the Blob store**, unused (their media records were removed).
  Delete them in Vercel → Storage → the Blob store if you want it tidy.
- **The previews have no Blob store**, so rooms there show no picture. That is expected.
- **A failed migration stops the production build**, and the live site keeps the previous version: read
  the build log ("MIGRATIONS: FAILED") and fix the migration before redeploying.

## How you will know it works

- **Bookings per week**: in `/admin` → Bookings, sorted by date. Act when there are fewer than 3 a week for
  a month: ask the groups why (prices, times, the booking form).
- **Room page views against confirmations**: in Vercel → Analytics, the views of `/rooms/<room>` against
  `/rooms/<room>/booked`. Act when fewer than 1 in 20 views of a room page ends in a booking.
- **CI and the production build**: GitHub → Actions on `main`, and Vercel → Deployments. Act at once on any
  red run or failed deployment.

How to run, change and deploy the site safely:

- On your own computer: `docs/guides/local-setup.md`.
- Different from the starter: our content model (rooms, equipment, time slots, bookings) and how live
  content changes without `/admin` (`docs/decisions/live-content.md`). `npm run migrate:create` asks
  questions in the terminal when a table is removed or added; answer "create table" / "create column"
  unless you really rename something. `.env.production` switches Web Analytics and the tawk.to chat on
  for every production build.
- A change reaches the live site through `main`. Never use Vercel's "Promote to Production": use
  Redeploy, and check that the build log shows `MIGRATIONS: verified committed migrations`.
- Our own steps: every change is a pull request from its own branch, with the template filled in (the AI
  note included). The other team member opens the preview and reviews Files changed; only the releases
  role merges, when the required checks are green: `test`, `types-fresh`, `migrations`, `browser-checks`
  and `ai-note` (plus `leftovers`), and the branch is up to date with `main`. Read the first production
  build log after each merge.
