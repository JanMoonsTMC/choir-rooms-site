# Decision: how our content reaches the live site

Decided by Test A (content model and data), with Test B, on 18 October 2026.

## The question

How do the live site's records change from the starter's bicycle example to our rooms, equipment and time
slots, when nobody can log in to the live `/admin` to do it by hand?

## Options considered

- **Edit the records in `/admin`.** Advantage: the way the starter means content to change, with no code.
  Drawback: none of us can log in to the live `/admin` (the first editor's password is not ours to use),
  and the old example tables (workshops, topics, the clinic, its price list) go anyway, because our
  content model replaces them.
- **Switch the seed's "example added" note off, so the seed runs once more.** Advantage: it reuses the
  seed as it is. Drawback: the seed never overwrites a record that exists, so the starter's home, about,
  contact and privacy pages and the Site facts would keep their bicycle text; and a preview never seeds,
  so a pull request's preview would show empty rooms.
- **A data migration that replaces the example.** Advantage: the production build already runs every
  migration before it builds the site (`scripts/build.mjs`), exactly once per database, inside a database
  transaction, and a preview runs it too, so the preview shows what the live site will show. Drawback: a
  migration is code that changes live data, so it must be careful and tested.
- **A one-off script run against the live database from a laptop.** Advantage: simple. Drawback: it needs
  the live connection string on a laptop, which the starter refuses on purpose, and nobody would see it in
  a pull request.

## The decision

A data migration, in three steps that run in this order on every database (`src/migrations/`):

1. `20261017_224135_remove_old_time_slots` (written by hand): deletes the old clinic's bookings and time
   slots, which were example and test records only. Without this, the next step stops on a database that
   holds an old slot, because a time slot now needs a room.
2. `20261017_224211_rooms_and_equipment` (generated with `npm run migrate:create`): removes the tables of
   the starter's workshops, topics, clinics and repairs, and adds rooms, equipment and the new columns of
   time slots and bookings. We changed one thing by hand: `IF EXISTS` on five `DROP CONSTRAINT` lines,
   because the generated file dropped foreign keys that its own `DROP TABLE ... CASCADE` had already
   removed, and so failed on every database, a new one too.
3. `20261017_224621_choir_content` (written by hand): only on a database where the starter's example was
   added (the note in `public.starter_example_seeded`), it removes the six bicycle photos from the media
   list and runs our seed (`src/seed/seed.ts`) with `replaceStarterPages`: our 8 pieces of equipment, 4
   rooms, their time slots for the coming 8 weeks (from the day it runs), and our home, about, contact
   and privacy pages and Site facts. On the live site it also uploads the room pictures to the Blob store;
   on a preview, which has no Blob store, the rooms are saved without pictures.

On a new, empty database (a laptop, CI, the tests) step 3 does nothing, and `npm run seed` adds the same
content. We checked it with `tests/integration/live-content.test.ts`, which runs step 3 the way Payload
runs every migration (in one transaction) on a database that holds the starter's example, twice, and on
an empty one; and once by hand on a laptop database that held the example (`npm run migrate`: "replaced
the starter's example (created or replaced 237, kept 2)").

## Why

- The production build runs migrations before anything else and stops when one fails, so the live site
  never runs our code against the old tables (`scripts/build.mjs`, "MIGRATIONS: FAILED").
- A migration runs once per database: Payload records it in `payload_migrations`. Nothing comes back
  after an editor changes it later, as the starter promises for the seed.
- The time slots are inserted with one database statement: one by one, through Payload, the 216 slots
  would take longer on the live database than the build allows the migration step (110 seconds).

## Consequences

- The starter's example records are gone for good on the live site: workshops, topics, the clinic and its
  price list. They were example data only.
- The six bicycle photos stay in the Blob store as files, unused; only their rows in the media list go.
  The lead can delete them in the Vercel Blob dashboard.
- The coming time slots end 8 weeks after the deploy that ran the migration. After that an editor adds
  new ones in `/admin`, or a later migration adds the next weeks (see `docs/handover.md`).
- The data migration runs our current seed code. A later change to the seed changes nothing on the live
  site (the migration has run there), but a later change to the rooms, equipment or time slot fields must
  not break this migration on a fresh preview: keep those collections' fields as they are, or add new
  fields as optional.
- The course's warm-up check (`/api/course-check`) still answers, as the course-check contract asks for
  a site without clinics: no clinic, no list, no booking.

## Facts read on

- 18 October 2026: `scripts/build.mjs`, `src/seed/run.ts`, `src/seed/exampleFlag.ts` and
  `scripts/migrate.mjs` in our repository; `node_modules/@payloadcms/drizzle/dist/migrate.js` (Payload
  3.90.2) for how a migration runs in a transaction.

## Review when

When the coming time slots run out (8 weeks after this deploy), or when someone needs to change the
rooms' fields: then decide whether the next content change is a new migration or work in `/admin`.
