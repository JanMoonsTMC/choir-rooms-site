# Hand-over

Written by: Test A and Test B

Everything the next owner of this site needs. Never write a password, a secret or a connection string
in this file.

## Who owns what

- **Live site:** https://choir-rooms-site.vercel.app/
- **Repository:** https://github.com/JanMoonsTMC/choir-rooms-site
- **Admin screen:** https://choir-rooms-site.vercel.app/admin

| Service | What it holds | Owner (account name, not the password) |
| --- | --- | --- |
| GitHub | the code: `JanMoonsTMC/choir-rooms-site` | Releases and repository role (Test A), GitHub account `JanMoonsTMC`; Test B (`jnmoons`) is a collaborator |
| Vercel | the live site and its settings: project `choir-rooms-site` | Releases role (Test A), in the Vercel account that owns the project |
| Neon | the database (connected through Vercel, Frankfurt) | The same Vercel account, through Storage; no separate Neon login is needed |
| Vercel Blob | the images (public store, Production only) | The same Vercel account, through Storage |
| tawk.to | the chat window on every public page (its property and widget `6ad4b263b2e7a834cef07781/1k57dhl5o`), its settings, and every message users type in it | The teacher's tawk.to account, made for this test project; no team member has a tawk.to login |

| Responsibility | Owner (a role) | Who can log in | Last tested |
| --- | --- | --- | --- |
| Content | The choir's room manager (rooms, equipment, time slots) and its secretary (pages, Site facts); the treasurer reads the bookings for the invoices | Editors in `/admin`, each with an account from an existing editor | Never on the live site: on 18 October 2026 nobody in the team could log in there yet, and the live content came through migrations (`docs/decisions/live-content.md`). Tested on our own computers every day of the project |
| Access | The releases role, who holds the first editor's account | The first editor: the one in Vercel's settings `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` | Never on the live site |
| Updates | The releases role (Node, Next.js, Payload) | The GitHub account and the Vercel account above | Never: the site still runs the starter's versions, on Node 22 |
| Monitoring | The releases role reads the Vercel dashboard once a week: deployments, the functions' errors, Analytics | The Vercel account above | 18 October 2026: deployments only. Analytics is switched on; its reports were not read yet |
| Backup and restore | The releases role. Neon keeps a restore window (point-in-time restore from the Neon console, reached through Vercel → Storage) | The Vercel account above | Never |
| Ownership | No role at the choir: Riverside Voices is made up, so the accounts stay with the releases role (GitHub, Vercel) and with the teacher (tawk.to) | The holders of those accounts | Never: nothing was transferred |

- **Who edits which content in `/admin`:** The room manager keeps the rooms, the equipment and the time
  slots. The secretary keeps the pages and the Site facts. The treasurer reads the bookings.
- **How a new editor gets an account:** From an existing editor: `/admin` → Users → Create new.
- **What needs a developer:** A new field or collection (a migration), a new page, and any content
  change on the live site while nobody can log in to `/admin` (a data migration, as we did).

The chat (tawk.to): the holder of the tawk.to account reads and answers the messages in tawk.to's
dashboard, and changes the chat's look and greeting there. Last tested on 18 October 2026 on the live
site: the button shows on `/` and `/rooms` and opens the chat window. No message was sent, so nobody has
yet seen one arrive in the dashboard. A next owner makes their own tawk.to property and puts its widget
address in `src/lib/chat.ts`; `NEXT_PUBLIC_CHAT` in `.env.production` switches the chat off (any value
but `tawk`).

The pictures are our own drawings from Lucide icons (`src/seed/images/SOURCES.md`).

## Left out, and in which order

1. **New time slots after the first eight weeks.** The live site has slots until 13 December 2026 (eight
   weeks from the deploy of 18 October). After that groups can book nothing until someone adds slots in
   `/admin` → Time Slots, one by one. Next to build: a button or a small script that adds the next eight
   weeks of the weekly pattern (`src/tasks/book-slot/comingSlots.ts` already works them out).
2. **A confirmation e-mail.** Groups only have the confirmation page and the calendar file; a lost tab
   means a forgotten booking. It needs an e-mail service (an account and a key), so it was out of scope.
3. **Changing or cancelling a booking yourself.** Today a group e-mails us and an editor changes it.
4. **Comparing rooms side by side** (`docs/test-report.md`, finding 9).
5. **Typing the exact group size in the filter** instead of choosing a range (finding 8).
6. **Repeating bookings** (every Tuesday until June), real photos of the rooms, and a Dutch version.

- **What does not work yet, or could break:**
  - Nobody outside our team has done either task (`docs/test-report.md`, "Not tested yet").
  - The time slots run out on 13 December 2026 (see 1 above).
  - Web Analytics ignores automated browsers: a check by script (Playwright, puppeteer) loads the script
    but sends no page view unless the browser gives an ordinary user agent
    (`docs/decisions/analytics.md`).
  - The chat depends on tawk.to and on its account. If tawk.to is down or a browser blocks it, there is
    no chat button and everything else works. If the teacher's tawk.to account or its property is
    removed, the button disappears or shows an error. A question nobody answers waits in tawk.to.
  - Six old bicycle photos are still files in the Blob store, unused (their media records were removed).
  - The previews have no Blob store, so rooms there show no picture. That is expected.
  - A failed migration stops the production build, and the live site keeps the previous version.
- **What to do about it:**
  - Watch one person outside the team do both tasks before real groups use the site.
  - Add time slots before 13 December 2026.
  - When the chat's account goes: switch the chat off (`NEXT_PUBLIC_CHAT`) or put in a new property's
    address.
  - Delete the six photos in Vercel → Storage → the Blob store if you want it tidy.
  - After a failed migration: read the build log ("MIGRATIONS: FAILED") and fix the migration before
    redeploying.

## How you will know it works

- **Bookings per week**, read in `/admin` → Bookings, sorted by date. Act when there are fewer than 3 a week for a month: ask the groups why (prices, times, the booking form).
- **Room page views against confirmations**, read in Vercel → Analytics: the views of `/rooms/<room>` against `/rooms/<room>/booked`. Act when fewer than 1 in 20 views of a room page ends in a booking.
- **CI and the production build**, read in GitHub → Actions on `main` and in Vercel → Deployments. Act on 1 failed deployment at once, and read what a red run on `main` says.

How to run, change and deploy the site safely:

- On your own computer: `docs/guides/local-setup.md`.
- Different from the starter: our content model (rooms, equipment, time slots, bookings) and how live
  content changes without `/admin` (`docs/decisions/live-content.md`). `npm run migrate:create` asks
  questions in the terminal when a table is removed or added; answer "create table" / "create column"
  unless you really rename something. `.env.production` switches Web Analytics and the tawk.to chat on
  for every production build.
- A change reaches the live site through `main`. Never use Vercel's "Promote to Production": use
  Redeploy, and check that the build log shows `MIGRATIONS: verified committed migrations`.
- **How a change goes live:** A change to the code goes live through a branch and a pull request
  with its preview and its AI note. Its author waits for the starter's checks, reads what they say,
  and merges it into `main`. A review is optional: we ask the other member for one when a change touches
  the booking. After the merge, the author reads the production build log. Our documents go straight to
  `main`.
- **How we go back:** To go back to the version before, use **Revert** on the merged pull request on
  GitHub. It opens a new pull request that undoes the change: merge it like any other, so that its
  build runs. A revert leaves the database as it is: a migration that has already run stays.
