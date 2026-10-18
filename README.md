# Riverside Voices: practice rooms for choirs, bands and theatre groups

Riverside Voices is a made-up city choir with its own rehearsal house. It rents its practice rooms to
other groups, and this site lets them do that online:

- **Book a practice room for a time slot** (our primary task): open a room, choose a free two-hour slot,
  give the group's name and size and a contact, and get a confirmation with a calendar file.
- **Find the room that fits your group**: filter the rooms by group size and equipment, and see from each
  piece of equipment which rooms have it.

It is our team project for the course "Building better websites", built by Test A and Test B on the
course's starter website. The live site is <https://choir-rooms-site.vercel.app>.

It is built with Next.js 16 and Payload CMS 3 on a Postgres database (Neon), with images in Vercel
Blob, Tailwind CSS 4, and TypeScript. It costs nothing: GitHub, Vercel's Hobby plan, Neon's free plan,
and Blob through Vercel.

## Our documents

| Document | What it says |
| --- | --- |
| [Team agreement](docs/team-agreement.md) (D0) | Who does what, and how we decide and review |
| [Brief](docs/brief.md) (D1) | The site's promise, its users, the two tasks ranked, what is left out |
| [Requirements](docs/requirements.md) (D2) | R1 to R12, each with a check and its result |
| [Content and structure](docs/content-structure.md) (D3) | The content model, the sitemap, the menu, both tasks step by step |
| [Design rationale](docs/design-rationale.md) (D4) | Sketches, palette and type, layout, principles, forms |
| [Decision records](docs/decisions/README.md) (D5) | Our topic and tasks, one group per slot, live content, analytics, the calendar file |
| [Test report](docs/test-report.md) (D6) | Two rounds with people, the tools, the fixes and the release check |
| [Hand-over](docs/handover.md) (D7) | Who owns what, what to build next, how to know it works |

## Run it on your own computer

In short (the [local set-up guide](docs/guides/local-setup.md) explains each step):

1. Install Node 22 (the LTS this starter is tested on).
2. Clone the repository, then run `npm ci`.
3. Copy `.env.example` to `.env.local`, remove the `#` in front of its `DATABASE_URL` line (your laptop's
   own database: no account, and it starts by itself), and fill in the other three values. Never use the
   live site's database.
4. Run `npm run migrate`, then `npm run seed`, then `npm run dev`, and open <http://localhost:3000>. The
   seed adds our four rooms, their equipment, eight weeks of time slots and the pages.

## Where things are

| Folder or file | What is in it |
| --- | --- |
| `src/collections` | The content model: Rooms, Features (equipment), TimeSlots, Bookings, and the starter's Pages, Media, Users, Members, Throttle |
| `src/globals/SiteFacts.ts` | **Site facts**: the pricing rule, the address and the e-mail address, kept once for every page |
| `src/app/(site)` | The public pages: `rooms`, `rooms/[slug]` (with `booked` and its `calendar` file), `equipment`, and the plain pages |
| `src/components/site` | The parts the pages are made of: header, hero, room cards, filters, booking form, … |
| `src/tasks/find-room`, `src/tasks/book-slot` | Our two tasks, each with a README on how it works |
| `src/content/riverside-voices.ts` | Our facts: the rooms, the equipment, prices and the weekly time slots |
| `src/seed` | The example content and our pictures, added once to a new database |
| `src/migrations` | Every change to the database's tables, and the data migrations that brought our content to the live site |
| `src/app/(site)/globals.css` | The design tokens: every colour, font, size and space, in one place |
| `src/lib/analytics.ts`, `src/lib/calendar.ts` | Web Analytics (page views) and the booking's calendar file |
| `scripts` | The build, the migration and seed runners, the guard that protects the live database, and the CI checks |
| `docs/guides` | The starter's guides: [first hour](docs/guides/first-hour.md), [local set-up](docs/guides/local-setup.md), [troubleshooting](docs/guides/troubleshooting.md), [UX decisions](docs/guides/ux-decisions.md) |

The route `/api/course-check` answers the course's warm-up checks as fixed in
[the course-check contract](docs/COURSE-CHECK-CONTRACT.md); our site has no clinic, so it answers "no
clinic, no list, no booking". The hero keeps the course's warm-up marker
`// W4: put your own name in this tagline` above its tagline.

## Commands

| Command | What it does |
| --- | --- |
| `npm run db` | Optional: starts your laptop's database on its own (`dev`, `migrate` and `seed` start it by themselves) |
| `npm run dev` | Starts the site at <http://localhost:3000>, after checking that your database is not the live one |
| `npm run build` | The build Vercel runs: on Vercel it first migrates (and, for the live site, seeds), then builds |
| `npm run migrate` | Applies the committed migrations to your own database, and checks that every one is there |
| `npm run migrate:create -- <name>` | Creates a migration for a change to the content model (answer its questions in the terminal) |
| `npm run seed` | Creates your admin account and adds the example content (once) |
| `npm run generate` | Regenerates `src/payload-types.ts` and the admin's import map after a model change |
| `npm run lint`, `npm run typecheck`, `npm test` | Lint, types and the tests (the tests use their own database) |
| `npm run check` | The browser checks, against a site that is already running |

## Rules that keep the site safe

- **Test data only.** Never put real personal data in this site: no real names, e-mail addresses or
  photos of people.
- **Never "Promote to Production"** on Vercel. Use **Redeploy**, and check that the build log shows
  `MIGRATIONS: verified committed migrations`.
- **Never paste the live database's address into `.env.local`.** The commands refuse it.
- **Secrets only in Vercel and in `.env.local`.** Never in a file you commit (`.env.production` holds no
  secret: only the analytics switch).

## Licence and credits

- The code: MIT licence, in [LICENSE](LICENSE), from the course's starter.
- The pictures: our own drawings from [Lucide](https://lucide.dev) icons (ISC licence), see
  [src/seed/images/SOURCES.md](src/seed/images/SOURCES.md).
- The fonts: Fraunces and Source Sans 3, under the SIL Open Font Licence.
