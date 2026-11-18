// Test records for our content model, shared by the tests: a room, and a time slot of a room. Made-up
// data only.

/** A room's required fields. Give each test room its own slug. */
export const roomData = {
  name: 'Test room',
  slug: 'test-room',
  capacity: 12,
  price: 20,
  location: 'Ground floor',
  summary: 'A room for the tests.',
}

const HOUR = 60 * 60 * 1000

/** A two-hour time slot of a room, starting at `startsAt` (a week from now unless given). */
export function slotData(room: number, startsAt: string | Date = new Date(Date.now() + 7 * 24 * HOUR), places = 1) {
  const start = new Date(startsAt)
  return { room, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 2 * HOUR).toISOString(), places }
}
