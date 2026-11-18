// For teams: tell the course's checks where your transactional task saves its records.
//
// Your transactional task is the user task that saves something, such as a booking, a sign-up or an
// order. When your team hands in, the course checks your live site's /api/course-check?include=team
// (docs/COURSE-CHECK-CONTRACT.md, "The team section"). That answer lists your collections and their
// many-to-many links, and the id and creation time of the newest record in the collection named here,
// so the check can see that a record really landed. It never answers what a record holds.
//
// Fill in:
// - `collection`: the slug of the collection your transactional task saves into (as in its file in
//   src/collections);
// - `nameField` (optional): a text field of that collection that names the record, such as `name` or
//   `title`. When the check asks with your team code, it looks only for the newest record whose
//   name field contains that code. Leave it out if your records have no such field.
//
// Ours: our primary task books a practice room, so its records are bookings (src/collections/Bookings.ts).
// The field that names a booking is the group's name, `groupName` ("Group name" on the booking form).
// The course checks our team with our team code, T29-7G6N: a test booking for the hand-in carries the
// code in its group name, for example "Test choir T29-7G6N". The check finds it there as a whole word,
// and answers only that booking's id and creation time, never the group, a name or an e-mail address.
import type { CourseCheckConfig } from '@/lib/courseCheck'

export const courseCheckConfig: CourseCheckConfig = {
  transactional: {
    collection: 'bookings',
    nameField: 'groupName',
  },
}
