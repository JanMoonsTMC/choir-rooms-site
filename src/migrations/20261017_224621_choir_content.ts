import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { seed } from '../seed/seed'

// A data migration, written by hand: it changes no table. It puts our own content on a database that
// still holds the starter's example, which is what the live site has: the seed added that example on
// the first deploy and, by design, never runs there again (src/seed/run.ts). Nobody can log in to the
// live /admin to change it by hand, so this migration does it, once, in the production build's migration
// step (scripts/build.mjs). Why this way: docs/decisions/live-content.md.
//
// What it does, only on a database where the starter's example was added (src/seed/exampleFlag.ts):
//   1. removes the starter's six example photos from the media list (their rows only: the files stay in
//      the Blob store, unused);
//   2. runs our seed (src/seed/seed.ts) with replaceStarterPages: it adds our equipment, rooms and their
//      time slots for the coming eight weeks, and overwrites the home, about, contact and privacy pages
//      and the Site facts with ours.
// The starter's workshops, topics, clinic and price list are already gone: the migration before this one
// (20261017_224211_rooms_and_equipment) removed their tables.
//
// On a new, empty database (your laptop, CI, the tests) it does nothing: there `npm run seed` adds our
// content. On a preview (a copy of the live database, without a Blob store) it adds everything except the
// pictures. Every step looks before it writes, so running it on a database that already has our rooms
// creates nothing twice.
const STARTER_PHOTOS = [
  'repair-a-puncture.jpg',
  'adjust-your-brakes.jpg',
  'service-a-gear-system.jpg',
  'true-a-wheel.jpg',
  'workshop-tools.jpg',
  'clinic-tools.jpg',
]

// Was the starter's example added to this database (src/seed/exampleFlag.ts)? Read through the
// migration's own connection: a second connection would wait for this migration's transaction to end.
async function starterExampleWasAdded(db: MigrateUpArgs['db']): Promise<boolean> {
  const table = await db.execute(sql`select to_regclass('public.starter_example_seeded') as t`)
  if (!table.rows[0]?.t) return false
  const row = await db.execute(sql`select 1 from public.starter_example_seeded where id = 1`)
  return row.rows.length > 0
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  if (!(await starterExampleWasAdded(db))) {
    payload.logger.info('choir_content: a new database, nothing to replace (npm run seed adds our content).')
    return
  }
  // payload.db.deleteMany removes the rows only. payload.delete would also try to delete each file, and
  // on a preview there is no Blob store to delete it from.
  await payload.db.deleteMany({ collection: 'media', where: { filename: { in: STARTER_PHOTOS } }, req })
  // Pictures only where they can be kept: on the live site (a Blob store) or off Vercel.
  const images = Boolean(process.env.BLOB_READ_WRITE_TOKEN) || !process.env.VERCEL
  const result = await seed(payload, { req, images, replaceStarterPages: true })
  payload.logger.info(`choir_content: replaced the starter's example (created or replaced ${result.created}, kept ${result.skipped}; pictures: ${images ? 'yes' : 'no'}).`)
}

// Our content stays when this migration is undone: there is no example to bring back.
export async function down(_args: MigrateDownArgs): Promise<void> {}
