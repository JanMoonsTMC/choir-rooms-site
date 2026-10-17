# Requirements

What the site must do, written so that someone else can check it. Each requirement expresses a need of
our users, and has a check that passes or fails on the live site. We fill in the results at the end of
the project, on the live site.

The primary task (book a room) is R6 to R10; the second task (find a room) is R1 to R5. Which task matters
most is in `docs/brief.md`.

| Id | Requirement | Serves | Check | Result |
| --- | --- | --- | --- | --- |
| R1 | Any user can see every room with how many people it holds, its price per time slot and its equipment, without logging in | Find a room: groups compare rooms before they choose | On `/rooms`, without filters: four rooms are listed (The Hall, The Studio, The Loft, The Band Room), each with "Up to … people", a price in EUR and its equipment | Not yet: not built |
| R2 | A user can narrow the rooms to the ones that hold their whole group | Find a room: a room that is too small is useless | On `/rooms`, choose the group size **Up to 25 people**, then **Show rooms**: exactly two rooms are listed, The Studio and The Hall, and the heading says "2 rooms" | Not yet: not built |
| R3 | A user can narrow the rooms to the ones that have the equipment they need | Find a room: a band needs a drum kit, a choir a piano | On `/rooms`, choose the equipment **Drum kit and amplifiers**, then **Show rooms**: only The Band Room is listed | Not yet: not built |
| R4 | A filtered list can be shared and reached again with Back | Find a room: one member chooses, another books | Do R2, copy the address and open it in a private window: the same two rooms are listed and the group size is still chosen | Not yet: not built |
| R5 | A user sees which equipment a room has, and which rooms have a piece of equipment | Find a room: compare rooms by what matters to the group | On `/rooms/the-studio`, the equipment list links to **Upright piano**; that page lists The Studio and The Loft | Not yet: not built |
| R6 | A user can book a free time slot of a room for their group, without an account and without paying | Book a room: the group needs a place to rehearse | On `/rooms/the-loft`, choose the first free time slot, fill in a made-up group name, name, e-mail address and a group size of 8, then **Book this slot**: the confirmation page shows "Your booking is saved", The Loft, the time and the address | Not yet: not built |
| R7 | A time slot is never booked by two groups | Book a room: two groups in one room is a wasted evening | After R6, open `/rooms/the-loft` again: the slot you booked shows "Booked" and cannot be chosen | Not yet: not built |
| R8 | A group that does not fit in the room is told so before anything is saved | Book a room: a room that is too small is found out at the door | On `/rooms/the-loft`, book a free slot with a group size of 20: the booking is not saved, and the group size field says the room holds at most 12 people | Not yet: not built |
| R9 | A user who forgets a field or mistypes their e-mail address sees what to fix, without losing what they typed | Book a room: users book on a phone, in a hurry | On a room page, leave the group name empty and type `name@example` as the e-mail address, then **Book this slot**: a message at the top says two fields need checking, both fields are marked, and the other values are still filled in | Not yet: not built |
| R10 | Both tasks work on a phone and with the keyboard alone | Both tasks: most organisers book on a phone | On `/rooms` and on a room page at 390 px wide: no sideways scrolling; with Tab alone you can filter, choose a slot and book, and you always see where the focus is. CI's browser checks (axe) find no problems | Not yet: not built |
| R11 | After booking, a user can put the rehearsal in their own calendar | Book a room: nobody forgets the rehearsal | On the confirmation page, **Add to my calendar** downloads a `.ics` file; opened in a calendar app it shows the room, the start and end time and the address, and no name or e-mail address | Not yet: not built |
| R12 | A user can read what the booking form keeps about them and for how long | Book a room: trust before typing in details | On `/privacy`: it lists the fields the booking form saves, who can see them and how long they are kept | Not yet: not built |

How to write a good check: name the page, the action and the exact result. A result is never just
"done": "Not yet: the list is right, but the shared link loses the group size" tells the next reader
exactly what to fix.
