# Content and structure

What content our site holds and how it is organised. Everyone who adds a page or a field reads it first,
so the site keeps one structure.

## Content inventory

| Content | Where it is shown | Where it comes from | Who keeps it up to date |
| --- | --- | --- | --- |
| Rooms: name, size, price per slot, place in the house, summary, description, picture | Home, Rooms, a room's page, an equipment page | `/admin` → Rooms (our first four came from the seed and the live-content migration) | The choir's room manager |
| Equipment: name, description, which rooms have it | Home (quick links), Rooms (filter), Equipment, a room's page | `/admin` → Equipment, and each room's Equipment field | The room manager |
| Time slots of each room | A room's page (the booking form) | The first 8 weeks came from the seed or the migration; after that the room manager adds them in `/admin` → Time Slots | The room manager |
| Bookings: group, group size, contact name, e-mail, note | Only in `/admin` (private); the public pages only count them | The booking form | The treasurer (invoices), the room manager (changes and cancellations) |
| Pages: home intro, About, Contact, Privacy | `/`, `/about`, `/contact`, `/privacy` | `/admin` → Pages | The choir's secretary |
| Site facts: pricing rule, address, e-mail | Home, Rooms, a room's page, Contact, the confirmation | `/admin` → Site facts | The secretary |
| Pictures | Rooms, home | `/admin` → Media (our drawings, see `src/seed/images/SOURCES.md`) | The room manager |

## Content model

Four collections of our own, plus the starter's Pages, Media, Users and the optional Members:

- **Rooms** (`src/collections/Rooms.ts`): `name`, `slug`, `capacity` (most people it holds), `price`
  (EUR per two-hour slot), `location` (where in the house), `summary`, `description` (rich text),
  `image` (Media), `features` (many Equipment), and the reverse list `timeSlots`.
- **Equipment** (`features`, `src/collections/Features.ts`): `name`, `slug`, `description`, and the
  reverse list `rooms`.
- **Time slots** (`timeSlots`, `src/collections/TimeSlots.ts`): `room` (one Room), `startsAt`, `endsAt`,
  `places` (1: one group per slot), and the reverse list `bookings` (editors only).
- **Bookings** (`src/collections/Bookings.ts`): `timeSlot` (one Time slot), `groupName`, `groupSize`,
  `name` (contact), `email`, `note`, `requestId` (stops double sends), `member` (members' area only).

How they link:

- Room **many-to-many** Equipment: stored once, in each room's `features`; each piece of equipment's
  `rooms` reads it back. The site shows it from both sides: a room page lists its equipment, an equipment
  page lists its rooms.
- Room **one-to-many** Time slots, Time slot **one-to-many** Bookings: stored in the child (`room`,
  `timeSlot`). The database refuses to delete a room that has slots, a slot that has bookings, or
  equipment a room still lists.

## Sitemap

| Page | Address | Leads to |
| --- | --- | --- |
| Home | `/` | Rooms, a room, the filtered rooms list (equipment quick links), About |
| Rooms (find a room) | `/rooms`, filtered: `/rooms?people=25&feature=upright-piano` | A room, an equipment page |
| A room (book a room) | `/rooms/<slug>`, later weeks: `/rooms/<slug>?from=2` | Its equipment, the confirmation, back to the (filtered) rooms list |
| Booking confirmation (not counted) | `/rooms/<slug>/booked?ref=…` | The calendar file, Contact, back to the room, Home |
| Calendar file (a download, not a page) | `/rooms/<slug>/booked/calendar?ref=…` | — |
| Equipment | `/equipment` | An equipment page |
| One piece of equipment | `/equipment/<slug>` | Its rooms, the rooms list filtered by it |
| About | `/about` | Contact |
| Contact | `/contact` | — |
| Privacy (not counted) | `/privacy` | — |
| Page not found (not counted) | any other address | Home, Rooms |

That is seven pages that count: Home, Rooms, a room, Equipment, one piece of equipment, About and
Contact.

## Navigation labels

The main menu: **Home**, **Rooms**, **Equipment**, **About**, **Contact**. The footer adds **Privacy**.

- "Rooms", not "Book": a group first looks at the rooms, and every room page has its booking form; the
  home page's main button says "Find and book a room".
- "Equipment", not "Features": it is the word groups use when they ask us ("do you have a drum kit?").
- Short single words fit on one or two rows on a phone, with no menu button to find first.

## Each user task, step by step

**1. Book a practice room for a time slot (primary).**

1. Home: **Find and book a room** (or a room card).
2. Rooms: open a room (filters optional, task 2).
3. The room's page: read its size, price and equipment; choose a free time slot ("Later time slots" for
   further weeks); fill in the group, the number of people, a contact name, an e-mail address and
   optionally a note; press **Book this slot**.
4. Not saved: the box at the top lists each problem with a link to its field; everything typed stays.
5. Saved: the confirmation shows the room, the time and the address, what happens next, and **Add to my
   calendar** (a `.ics` file).

**2. Find the room that fits your group.**

1. Home: an equipment quick link, or **Find and book a room**.
2. Rooms: choose **Group size** and **Equipment**, then **Show rooms**; the result line says how many
   rooms fit.
3. Open a room: its equipment links to each equipment page, which lists every room with it.
4. **Back to the filtered rooms** returns to the same list, filters kept.
