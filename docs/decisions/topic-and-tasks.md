# Decision: our topic and our two tasks

Decided together by Test A and Test B on 18 October 2026, at the start of the project.

## The question

Which topic does our site serve, and which two user tasks does it support, in which order?

## Options considered

- **Keep the starter's topic (bicycle repairs) and only rename it.** Advantage: almost no work on the
  content model. Drawback: it is not our topic, and the course asks for a site on the team's own topic.
- **A city choir that rents out its practice rooms, with "book a room" first and "find a room" second.**
  Advantage: both tasks are real for the people who organise rehearsals, and the starter's two example
  tasks (book a time slot, find a workshop with filters) map onto them closely. Drawback: we must rebuild
  the content model around rooms, equipment and time slots, and replace every example record.
- **The same choir, with "find a room" first.** Advantage: finding is easier to build and test. Drawback:
  a group that finds a room but cannot book it still has nowhere to rehearse; finding only matters
  because it leads to a booking.
- **A choir's concert calendar (find a concert, reserve a seat).** Advantage: a familiar task. Drawback:
  seat reservations are close to ticket sales, and we may not take payments.

## The decision

A city choir, Riverside Voices, that rents its practice rooms to other choirs, bands and theatre groups.
The primary task is transactional: **book a practice room for a time slot**. The second task is
informational: **find the room that fits your group**, by group size and equipment. The ranking is in
`docs/brief.md`; the requirements for both tasks are in `docs/requirements.md`.

## Why

- Both tasks have a clear loser when they fail: a group without a rehearsal room, or a group in a room
  that is too small (`docs/brief.md`, "The two tasks, ranked").
- Booking is ranked first because it is what the choir earns from and what the groups come for; finding
  only matters when it ends in a booking.
- The starter already has a slot booking with a places rule, double-click protection and a rate limit
  (`src/tasks/book-slot/README.md`), and a filtered list whose filters live in the address. We adapt
  both instead of building them again.
- A room and its equipment are a natural many-to-many: a room has several pieces of equipment, and a
  piece of equipment (an upright piano) is in several rooms. The site can show it from both sides.

## Consequences

- Every example record (workshops, topics, the clinic and its price list) goes. The content model is
  rebuilt around rooms, equipment, time slots and bookings, with migrations that remove the old tables.
- The site shows a price but takes no payment: the choir sends an invoice after the rehearsal.
- No photos: the rooms are made up, and we will not show photos of other people's rooms as if they were
  ours.

## Facts read on

- 18 October 2026: the starter's `README.md`, `src/tasks/book-slot/README.md` and
  `src/tasks/find-workshop/README.md`, for what the starter's two example tasks already do.

## Review when

When the choir's own use of the rooms changes (for example a second weekly rehearsal), or when groups
ask for something the two tasks do not cover, such as booking every week until the summer.
