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

- **Content in `/admin`**: the choir's room manager keeps the rooms, equipment and time slots; the
  secretary keeps the pages and the Site facts; the treasurer reads the bookings for the invoices. Each
  gets an editor account from an existing editor (`/admin` → Users → Create new). The first editor is the
  one in Vercel's settings `FIRST_ADMIN_EMAIL` / `FIRST_ADMIN_PASSWORD`, held by the releases role.
  Last tested: never on the live site (on 18 October 2026 nobody in the team could log in there yet; the
  live content came through migrations instead, see `docs/decisions/live-content.md`). Tested on our own
  computers every day of the project.
- **What needs a developer**: a new field or collection (a migration), a new page, and any content
  change on the live site while nobody can log in to `/admin` (a data migration, as we did).
- **Updates** (Node, Next.js, Payload): releases role; never done since the start (the starter's
  versions, Node 22).
- **Monitoring**: releases role reads the Vercel dashboard (deployments, functions' errors, Analytics)
  once a week. Last done: 18 October 2026 (deployments only; Analytics not yet switched on).
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

- **Web Analytics records nothing until it is switched on**: Vercel → project `choir-rooms-site` →
  **Analytics** → **Enable**, then Redeploy. Until then the browser's console shows a 404 for
  `/_vercel/insights/script.js`; the site works.
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
  unless you really rename something. `.env.production` switches Web Analytics on for every production
  build.
- A change reaches the live site through `main`. Never use Vercel's "Promote to Production": use
  Redeploy, and check that the build log shows `MIGRATIONS: verified committed migrations`.
- Our own steps: every change is a pull request from its own branch, with the template filled in (the AI
  note included). The other team member opens the preview and reviews Files changed; only the releases
  role merges, when the required checks are green: `test`, `types-fresh`, `migrations`, `browser-checks`
  and `ai-note` (plus `leftovers`), and the branch is up to date with `main`. Read the first production
  build log after each merge.
