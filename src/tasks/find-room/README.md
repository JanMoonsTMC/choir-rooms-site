# Our second task: find the room that fits your group

A group's organiser opens **Rooms**, chooses how many people come and, if they need something special,
a piece of equipment (a grand piano, a drum kit, step-free access), and gets the rooms that fit. From a
room they can open each piece of equipment; its page lists every room that has it. (This task is the
starter's "find a workshop" task, adapted to our rooms.)

## Where it lives

| File | What it does |
|---|---|
| `src/tasks/find-room/filters.ts` | Reads the filters from the address (`?people=…&feature=…`), leaves out anything it cannot use, and says the result in words |
| `src/tasks/find-room/queries.ts` | Turns the filters into a question for the database (a Payload `where`) |
| `src/app/(site)/rooms/page.tsx` | The list page: the filter form, the result line and the room cards |
| `src/app/(site)/rooms/[slug]/page.tsx` | One room's page, with a Back link to the same filtered list (and the booking form) |
| `src/app/(site)/equipment/page.tsx`, `src/app/(site)/equipment/[slug]/page.tsx` | Every piece of equipment, and one piece with the rooms that have it: the many-to-many from the other side |
| `src/components/site/RoomFilters.tsx`, `RoomCard.tsx`, `FeatureList.tsx`, `ParentLink.tsx` | The parts those pages are made of |
| `tests/unit/filters.test.ts`, `tests/integration/find-room.test.tsx` | The tests |

## Why it is built this way

- **Group size, not an exact number.** "Up to 8 / 12 / 25 / 60 people" follows our rooms' sizes, so each
  choice changes the list. A room fits when it holds at least that many (`capacity >= people`).
- **The filters live in the web address.** The form uses `method="get"`, so choosing filters only
  changes the address. A filtered list can then be shared (one member chooses, another books), Back
  returns to it, and it works without JavaScript.
- **An address can say anything.** The page leaves out what it cannot use and never crashes:
  - an empty value, such as `?people=` (what the form sends for "Any size"), means no filter;
  - a size we do not offer, such as `?people=500`, is ignored: the list shows every room;
  - unknown equipment, such as `?feature=harp`, gives an empty list with "No rooms match these filters"
    and a **Clear filters** link. It is not a "page not found": the list itself still exists.
- **After "Show rooms" the page opens at the results** (`/rooms?…#results`), so on a phone the user sees
  them without scrolling past the form again.
- **Every fact comes from one place.** A room's size, price, place in the house and equipment are its own
  fields; the address and the pricing rule are in the Site facts global (`/admin` → Site facts).

## What to keep when you change it

- the plain GET form with a visible label above each field and a **Show rooms** button;
- reading the address carefully, and the empty result with **Clear filters**;
- the result line in words, which is also the browser tab's title (a screen reader reads it out when the
  page opens);
- the Back link that carries the filters (`filterQuery`);
- `export const dynamic = 'force-dynamic'` on each page, so an editor's change shows at once.

To offer another group size, add it to `GROUP_SIZES` in `filters.ts`: the form and the check follow.
