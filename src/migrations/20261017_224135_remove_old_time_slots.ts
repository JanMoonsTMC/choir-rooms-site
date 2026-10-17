import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// A data migration, written by hand: it changes no table, only removes rows. It runs right before
// 20261017_224211_rooms_and_equipment, which moves every time slot from a clinic to a room: a time slot
// then needs a room ("room_id ... NOT NULL"), and an old clinic slot has none, so the next migration
// would stop on any database that still holds one. The starter's clinic, its time slots and their
// bookings were example and test records only (docs/decisions/live-content.md), so they go first,
// bookings before their time slots. On a new, empty database this deletes nothing.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`DELETE FROM "bookings"`)
  await db.execute(sql`DELETE FROM "time_slots"`)
}

// Removed rows cannot come back: undoing this migration changes nothing.
export async function down(_args: MigrateDownArgs): Promise<void> {}
