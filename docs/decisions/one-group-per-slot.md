# Decision: one group per time slot, no payment online

Decided together by Test A and Test B on 18 October 2026.

## The question

What does one booking hold: how long is a time slot, how many groups can book it, and how does a group
pay?

## Options considered

- **Free start and end times (book from 19:15 to 20:45).** Advantage: groups get exactly the time they
  want. Drawback: the form needs two time pickers, overlapping bookings must be checked, and the choir's
  volunteers would have to tidy up gaps between bookings.
- **Fixed two-hour time slots, one group per slot.** Advantage: a slot is either free or booked, which is
  easy to show and easy to check; the starter's places rule already refuses a full slot. Drawback: a group
  that needs three hours books two slots.
- **Several groups per slot, as the starter's clinic did (2 places).** Advantage: no change to the
  starter. Drawback: a room is never shared by two groups at the same time, so a second place makes no
  sense.
- **Paying online when booking.** Advantage: no unpaid invoices. Drawback: the brief rules out payments,
  and it would need an account with a payment provider.

## The decision

Fixed two-hour time slots, each with one place: the first group that books it has the room. On weekday
evenings a slot runs from 19:00 to 21:00; on Saturdays there are two, from 10:00 to 12:00 and from 14:00 to
16:00. The Hall has no slot on Thursday evenings, when the choir rehearses there itself.

The site shows each room's price per slot. Nobody pays online: the choir's treasurer sends an invoice after
the rehearsal. A booking holds the group's name, its size, a contact name and e-mail address and an
optional note. The group size must fit the room.

## Why

- A free or booked slot is the simplest thing a user can read on a phone.
- The starter's places rule (`src/tasks/book-slot/capacity.ts`) locks the slot while it saves, so two
  groups pressing **Book this slot** at the same moment cannot both get it. With one place per slot that
  rule is exactly "one group per slot".
- The brief allows no payments, and an invoice after the rehearsal is how the choir already works.

## Consequences

- A group that needs a longer rehearsal books two slots.
- Unpaid invoices are the choir's problem, outside the site.
- An editor can still give a slot more places in `/admin`, for example for a shared open rehearsal; the
  site then shows how many places are left.

## Facts read on

- 18 October 2026: `src/tasks/book-slot/README.md` and `src/tasks/book-slot/capacity.ts` in the starter.

## Review when

When groups often book two slots in a row, or ask for half-day bookings.
