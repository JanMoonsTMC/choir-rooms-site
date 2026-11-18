# Design rationale

Written by: Test A and Test B

Why our site looks and behaves the way it does. Whoever changes the design later reads it first, so they
know what each choice protects.

## Sketches

- **Our sketches:** The three wireframes below, of the room page: the page of our primary task. We drew
  them as text before building it. Version 1 followed the starter: a coloured title panel with the
  picture, the facts on the right, the booking form below the description.

```
Version 1 (laptop)                         Version 2 (laptop), what we built
+--------------------------------------+   +--------------------------------------+
| Rooms > The Studio                   |   | Rooms > The Studio                   |
| [ The Studio           ] [ picture ] |   | [ The Studio, one line ] [ picture ] |
| About this room ...    | At a glance |   | About this room ...    | At a glance |
| Book a time slot       | size, price |   | Book a time slot       | size, price |
|  ( ) 28 slots, 4 weeks | equipment   |   | Time slots in the next | place       |
|  ...                   |             |   | two weeks. [Later]     | equipment   |
|  name, e-mail, note    |             |   |  (o) Tue 20 Oct 19-21  |  (links)    |
|  [Book this slot]      |             |   |  group, size (hint)    | pricing rule|
+--------------------------------------+   |  name, e-mail, note    |             |
                                           |  [Book this slot]      |             |
Version 2 (phone)                          |  [Back to the rooms]   |             |
+----------------+                         +--------------------------------------+
| Rooms > Studio |
| The Studio     |
| [picture]      |
| At a glance    |   <- facts first: a group checks size and price before it reads further
| About          |
| Book: 2 weeks  |
| [Later slots]  |
| form, button   |
+----------------+
```

- **What we changed between them:**
  - Two weeks of time slots at a time, with "Later time slots". Version 1 listed every coming slot (up
    to 56 radio buttons on a phone). Two weeks fit on two phone screens; a group that plans further
    ahead pages on.
  - The group and its size in the form, with the room's size as a hint. In version 1 a group found out
    at the door that the room was too small (requirement R8).
  - The equipment as links. Version 1 showed it as labels; now each opens the rooms that have it (R5).

## Palette and type

Every colour is defined once, in the `@theme` block of `src/app/(site)/globals.css`.

| Colour (its name and value) | What it is used for |
| --- | --- |
| Ink, `--color-ink` `#1f2433` | Text, and the background of the dark hero on the home page |
| Warm paper, `--color-canvas` `#fffcf5` | The page background, and the text on the dark hero |
| Soft ink, `--color-ink-soft` `#525a6b` | Secondary text |
| Dark teal, `--color-link` `#0b6168` | Links, always underlined |
| Burnt orange, `--color-focus` `#b4410f` | The focus ring, so that it never looks like a link (straw on the dark hero) |
| River teal `#2a9d8f`, plum `#7d3c6b`, brass `#e3a72f` and straw `#f2d16b` | Four accents from a rehearsal room, each with a tint and a wash for backgrounds. Brass is our signature colour: offsets and the current menu item |
| Rose, `--color-rose` `#c8443c` | Errors only, always with a word ("Not saved") |

| Text colour | Background colour | Contrast ratio | Measured with |
| --- | --- | --- | --- |
| Ink `#1f2433` | Warm paper `#fffcf5` | 15.09:1 | The WCAG 2 contrast formula, calculated from the two values |
| Soft ink `#525a6b` | Warm paper `#fffcf5` | 6.76:1 | The same formula |
| Link dark teal `#0b6168` | Warm paper `#fffcf5` | 7.01:1 | The same formula |
| Warm paper `#fffcf5` | Ink `#1f2433` (the dark hero) | 15.09:1 | The same formula |
| Focus ring burnt orange `#b4410f` (not text; needs 3:1) | Warm paper `#fffcf5` | 5.53:1 | The same formula |

- **Our fonts and sizes:** Fraunces for headings and Source Sans 3 for text, at 17 px on a phone. Both
  are under the SIL Open Font Licence and served from our own site by next/font
  (`src/app/(site)/layout.tsx`).
- **Why these colours and fonts fit our users:** Ink on warm paper and a warm serif give the feel of a
  printed concert programme, which suits a choir's house. Source Sans 3 has plain,
  open letters that stay readable on a phone, where we expect most bookings.

## Layout at phone and laptop width

| Page | On a phone (390 px wide) | On a laptop (1100 px wide) |
| --- | --- | --- |
| Home | The round picture shrinks to 12 rem and moves below the hero's text. The room cards are one column. | The dark hero has the text left and the round picture right. The room cards are two columns. |
| Rooms | The two filters and the button stack. After **Show rooms** the page opens at the results (`#results`), so a user does not scroll past the form. | The two filters and the button sit in one row. |
| A room | The facts ("At a glance") come first, above the description and the form. The time slots are one column. | The facts are a column on the right, next to the form. The time slots are two columns. |

The menu wraps onto a second row on a phone instead of hiding behind a button: five short links. No page
scrolls sideways at 390 px: the browser checks test every page at 390 and 1100 px.

## The principles we applied

| Principle | What we did | Where it shows on our site |
| --- | --- | --- |
| Visibility of system status (Nielsen) | Each time slot says "Free" or "Booked" in words, and the button says "Saving your booking…" while it works. | The booking form on each room's page |
| Error prevention (Nielsen) | The hint under the group size says how many people the room holds before the user types, and a booked slot cannot be chosen. | The booking form on each room's page |
| Recognition rather than recall (Nielsen) | The result line repeats the filters ("Rooms for up to 25 people — 2 rooms"), and the room page links back to the same filtered list. | Rooms, and each room's page |
| Proximity | A field's label, hint and error message sit together; separate parts of a page get much more space (`--spacing-section`). | Every form and every page |
| Consistency | One card style for every room, from one component (`src/components/site/RoomCard.tsx`). | Home, Rooms and each equipment page |

## Forms and feedback

**Form:** the booking form, on each room's page (`/rooms/<slug>`)

| State | What the user sees |
| --- | --- |
| Empty | Each label says "(required)" or "(optional)", never only a star. The hint under the group size says how many people the room holds. |
| Pending | The button says "Saving your booking…". |
| Invalid | A box at the top says "Not saved" and lists each problem as a link to its field, and the keyboard focus moves to it, so a screen reader reads it out. Each field with a problem gets a thicker border, a rose wash and its message under it, for example "Enter how many people come as a whole number, like 12." Everything typed stays. |
| Full | A booked slot cannot be chosen. When another group books the slot while the user is typing: "This slot is full. Choose another time." The form comes back with no time chosen, every slot as it is now, and everything else typed. A group that is too big for the room reads "The Loft holds at most 12 people. Choose a bigger room for your group." |
| Failed | When no answer comes back, the form says it cannot tell whether the booking was saved ("Not confirmed") and keeps everything typed. Sending it again is safe. |
| Repeated | The same form sent twice gives the same booking back, never a second one. After 5 bookings in an hour from one device: "Too many bookings from this device." |
| Saved | Only after a real save: "Your booking is saved. This is a practice project: use made-up details; no one will contact you.", with the room, the time and the address, what happens next, and **Add to my calendar**. |

The two filters on the Rooms page are choice lists that only change the page's address. Nothing is sent
to be saved, so of the seven states only Empty happens there: both filters are optional.

## What makes it our own

- **What differs from the starter:**
  - Our own palette, type pairing (Fraunces and Source Sans 3) and focus colour, instead of the
    starter's navy, mint and Hanken Grotesk.
  - A dark hero with music staff lines and a round picture in a brass ring, instead of the starter's
    light two-column panel.
  - Cards with a coloured band on top and the picture above the text at every width, instead of the
    starter's side-by-side card with a solid offset.
  - Our own pictures: drawings of each room in our palette (`src/seed/images/SOURCES.md`).
  - Our own content model and pages: rooms, equipment and their pages, two weeks of time slots at a
    time, and a booking form for a group.
- **What we kept from the starter, and why it fits our users:** The booking's checks (one booking per
  place, the same form never saved twice, the limit of 5 an hour) and the filtered list whose filters
  live in the address. Our users book on a phone, in a hurry, so nothing typed may be lost; and one
  member often chooses a room while another books it, so a filtered list must be a link they can share
  (requirements R4 and R9).
