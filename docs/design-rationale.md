# Design rationale

Why our site looks and behaves the way it does. Whoever changes the design later reads it first, so they
know what each choice protects.

## Sketches

We sketched the room page, the page of our primary task, as wireframes before building it. Version 1
followed the starter: a coloured title panel with the picture, the facts on the right, the booking form
below the description.

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

What we changed between them, and why:

- **Two weeks of slots at a time, with "Later time slots"**: version 1 listed every coming slot (up to 56
  radio buttons on a phone). Two weeks fit on two phone screens; a group that plans further ahead pages on.
- **The group and its size in the form, with the room's size as a hint**: in version 1 a group found out
  at the door that the room was too small (requirement R8).
- **The equipment as links**: version 1 showed it as labels; now each opens the rooms that have it (R5).

## Palette and type

Everything is set once, in `src/app/(site)/globals.css` (the `@theme` block), and loaded in
`src/app/(site)/layout.tsx`.

- **Ink on warm paper** (`--color-ink` #1f2433 on `--color-canvas` #fffcf5): a concert programme rather
  than a screen; text contrast 15:1.
- **Four accents from a rehearsal room**: river teal (`--color-river`), plum velvet (`--color-plum`),
  brass (`--color-brass`, our signature colour for offsets and the current menu item) and straw, each
  with a tint and a wash for backgrounds. Text on them stays ink.
- **Links dark teal** (#0b6168, 7:1 on the paper) and underlined; the **focus ring burnt orange**
  (#b4410f, 5.5:1 on the paper; straw on the dark hero, where orange would be too dark), so it never looks like a link and is seen on every background.
- **Rose for errors only** (`--color-error`), always with a word ("Not saved").
- **Fraunces** for headings: a warm serif with the feel of a printed concert programme. **Source Sans 3**
  for text: plain, open letters that stay readable at 17 px on a phone. Both under the SIL Open Font
  Licence, served from our own site by next/font.

## Layout at phone and laptop width

- **Home**: on a laptop the dark hero has the text left and the round picture right; on a phone the
  picture shrinks to 12 rem and moves below the text. The room cards go from two columns to one.
- **Rooms**: the two filters and the button sit in one row on a laptop and stack on a phone; after **Show
  rooms** the page opens at the results (`#results`), so a phone user does not scroll past the form.
- **A room**: on a laptop the facts ("At a glance") are a column on the right next to the form; on a
  phone they come first, above the description and the form. The time slots are two columns on a laptop,
  one on a phone.
- **The menu** wraps onto a second row on a phone instead of hiding behind a button: five short links.
- No page scrolls sideways at 390 px: the browser checks test every page at 390 and 1100 px.

## The principles we applied

- **Visibility of system status** (Nielsen): each time slot says "Free" or "Booked" in words, and the
  button says "Saving your booking…" while it works.
- **Error prevention**: the group size hint says how many people the room holds before the user types,
  and a booked slot cannot be chosen.
- **Recognition rather than recall**: the result line repeats the filters ("Rooms for up to 25 people —
  2 rooms"), and the room page links back to the same filtered list.
- **Proximity**: a field's label, hint and error message sit together; separate parts of a page get much
  more space (`--spacing-section`).
- **Consistency**: one card style for every room on every page (home, rooms, equipment), from one
  component (`src/components/site/RoomCard.tsx`).

## Forms and feedback

- **Required or optional** is written in each label ("(required)", "(optional)"), never only a star.
- **What went wrong**: after a failed send, a box at the top says "Not saved" and lists each problem as a
  link to its field; the keyboard focus moves to it, so a screen reader reads it out. Each field with a
  problem gets a thicker border, a rose wash and its message under it (`aria-invalid`,
  `aria-describedby`).
- **Nothing typed is lost**: the form comes back with every value, also when the connection dropped
  ("Not confirmed": sending again never books twice).
- **What was saved**: only after a real save does the confirmation say "Your booking is saved", with the
  room, the time and the address.

## What makes it our own

- Our own palette, type pairing (Fraunces and Source Sans 3) and focus colour, instead of the starter's
  navy, mint and Hanken Grotesk.
- A dark hero with music staff lines and a round picture in a brass ring, instead of the starter's light
  two-column panel.
- Cards with a coloured band on top and the picture above the text at every width, instead of the
  starter's side-by-side card with a solid offset.
- Our own pictures: drawings of each room in our palette (`src/seed/images/SOURCES.md`).
- Our own content model and pages: rooms, equipment and their pages, two weeks of slots at a time, and a
  booking form for a group.
