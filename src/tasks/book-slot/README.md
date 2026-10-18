# Our primary task: book a practice room for a time slot

A group's organiser opens a room (from **Rooms**), chooses a free two-hour time slot, gives the group's
name and size, their own name and e-mail address, and presses **Book this slot**. The booking is saved,
and the confirmation page says so. A booked slot cannot be booked again, and a group that does not fit
the room is told so before anything is saved. (This task is the starter's clinic booking, adapted to our
rooms; how a booking works is in `docs/decisions/one-group-per-slot.md`.)

## Where it lives

| File | What it does |
|---|---|
| `src/app/(site)/rooms/[slug]/page.tsx` | The room's page: the room, and the booking form with two weeks of time slots at a time ("Later time slots" for the next two weeks) |
| `src/components/site/BookingForm.tsx` | The form: the time, the group, its size, the contact name, the e-mail address and a note |
| `src/components/site/SlotPicker.tsx` | "Choose a time": one radio button per slot, "Free" or "Booked" (or the places left, for a slot with more than one) |
| `src/components/site/BookingSubmitButton.tsx`, `src/components/site/BookingProblem.tsx` | The form's button ("Saving your booking…" while it is sent), and the box that says what went wrong |
| `src/tasks/book-slot/typedValues.ts` | What the user typed, read from the form when no answer came back, so nothing is lost |
| `src/tasks/book-slot/saveBooking.ts` | The server function the form calls. It opens the confirmation page when the booking is saved |
| `src/tasks/book-slot/createBooking.ts` | The checks and the save, in order (see below). Only the fields it names are saved |
| `src/tasks/book-slot/capacity.ts`, `places.ts` | The places rule: no booking in a full slot, also when an editor moves a booking in /admin |
| `src/tasks/book-slot/guards.ts` | The spam guards: the hidden trap field and the rate limit |
| `src/tasks/book-slot/receipt.ts` | The signed confirmation link, so the confirmation shows this booking and only this one |
| `src/tasks/book-slot/comingSlots.ts` | The weekly time slots, worked out for the coming weeks (used by the seed and the live-content migration) |
| `src/app/(site)/rooms/[slug]/booked/page.tsx` | The confirmation page |
| `src/app/(site)/rooms/[slug]/error.tsx` | The last safety net: "This page could not be shown", with Try again |
| `tests/integration/booking.test.ts`, `booking-race.test.ts`, `tests/unit/book-slot.test.ts` | The tests |

## What happens when a user presses "Book this slot"

`createBooking` checks, in this order, and stops at the first "no":

1. **The trap field.** The form has a field nobody sees. A program that fills in every field fills this
   one too. Nothing is saved, and the answer only says "Your booking was not saved. Please try again."
2. **The fields.** A time slot of this room that has not started yet; the group's name (at most 100
   characters); how many people come, as a whole number, and **no more than the room holds** ("The Loft
   holds at most 12 people. Choose a bigger room for your group."); a contact name; an e-mail address in
   a form the database accepts; an optional note (at most 500 characters). Every problem is listed at
   once, and everything the user typed comes back in the form.
3. **The same form twice.** Each form carries a random `requestId`. If the answer to a booking got lost
   and the user sends the form again, they get the same booking back: never a second one.
4. **The rate limit.** At most 5 bookings an hour from one device. Only sends that got this far count,
   so typing mistakes never use it up. The device's address is never stored: only a hash of it, kept for
   an hour.
5. **The save, with the places rule.** `capacity.ts` locks the slot, counts its bookings and refuses a
   full slot with "This slot is full. Choose another time." The lock makes two groups who book the same
   slot at the same moment wait for each other, so only one of them gets it. The form then comes back
   with no time chosen and every slot as it is now ("Booked").

When the server cannot be reached at all, the form says it cannot tell whether the booking was saved,
and keeps everything typed: sending it again is safe (step 3).

Only after the booking is saved does the user see the confirmation: "Your booking is saved. This is a
practice project: use made-up details; no one will contact you.", with the room, the time and the
address. Its address carries a signature, so a changed or made-up link shows "We can't show this booking
confirmation." and nothing else.

Bookings are private. The room page only counts them; it never shows a group, a name or an e-mail
address.

**While you test on your own computer** you may book more than 5 times in an hour and get "Too many
bookings from this device." Wait an hour, or empty the `throttle` table in your laptop's (never the live)
database: `delete from throttle;`. The rows only hold hashed addresses.

## What to keep when you change it

- `guards.ts`, the trap field in the form, and its place first in the checks;
- the hidden `requestId` and `room` fields in the form;
- the made-up-data notice above the button, and the confirmation's exact words;
- the check that the group fits the room, on the server (the hint under the field only explains it);
- `export const dynamic = 'force-dynamic'` on both pages.
