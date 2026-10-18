# Test report

What we learned by testing our site with its tasks and with tools. It is read by whoever decides whether
the site can go live, and later by whoever improves it. Round 1 tested the primary task (book a room); round 2
follows before the hand-over.

## What was tested, and how

### Round 1: book a practice room (18 October 2026)

The task, as we wrote it down before we started:

> "Your group of eight wants to rehearse on a weekday evening about three weeks from now. Book a room for
> it on this site. Use made-up details: a made-up group, name and e-mail address."

- **Version**: the site built from our branch `h2-book-room` (`npm run build`, `npm start`), with the
  example rooms and eight weeks of time slots.
- **Who took part**: nobody else was watched. We had nobody outside our team to ask in time, so each of us
  did the task ourselves in a private window, reading only what is on the screen, once at phone width
  (390 px) and once at laptop width, and wrote down every moment we hesitated.
- **Tools**, on the same version: the browser checks with axe (`npm run check`, every page at 390 and
  1100 px) and Lighthouse 12.6.1 (mobile) on `/rooms/the-loft` and `/rooms`.


## What we saw


| # | Behaviour (what you saw) | Interpretation (what you think it means) | Uncertainty (what you are not sure of) |
| --- | --- | --- | --- |
| 1 | At phone width, the slot list runs below the screen; at its end there is nothing, and **Later time slots** sits above the list, out of sight. We scrolled to the end looking for a date three weeks away before we found it. | On a phone, the end of a list is where people look for "more". | We knew the site; someone new may look elsewhere, or give up sooner. |
| 2 | The room cards said "EUR 20 per time slot". Reading only the card, we could not tell how long a slot is: the two hours are only in the slot times and on the About page. | A price per slot needs the slot's length next to it. | We have not seen a real user misread it. |
| 3 | After "Your booking is saved", the page said what was saved, but not how to pay or how to cancel. | The confirmation leaves the next questions open. | On a real site an e-mail might answer this; ours sends none. |
| 4 | We typed "8-10" as the group size. The field said "Enter how many people come as a whole number, like 12."; with 10 the booking was saved, and the other fields kept what we had typed. | The message and the kept values work as meant. | — |
| 5 | For a group of eight, The Loft and The Studio showed at once on the room cards ("Up to … people"), without the filters. | The size on the card is enough for this task; the filters matter more for task 2. | Task 2 was not part of this round. |
| 6 | Tools: axe found no serious or critical problem on any page at either width. Lighthouse (mobile) on `/rooms/the-loft`: performance 94, accessibility 100, best practices 96, SEO 100. It flagged the room's picture at the top as the largest element, loaded lazily (largest contentful paint 3.1 s), and a missing site icon (`/favicon.ico` 404 in the console). | The picture a phone shows first should load at once; the missing icon is a small, real error. | Measured on our own computer, not on Vercel's network. |


## What we changed, and the retest


| Finding | Change | Retest and result |
| --- | --- | --- |
| 1 | **Later time slots** also appears under the list of slots (`SlotPicker.tsx`). | We did the task again at 390 px in a private window: the link is right under the list. Pass. |
| 2 | Prices now read "EUR 20 per two-hour slot" on the cards and the room page. | Read the cards again: the length is next to the price. Pass. |
| 3 | The confirmation has a "What happens next" part: nothing to pay now, the invoice after the rehearsal, and how to change or cancel (with a link to Contact). | Booked again: the part shows after "Your booking is saved". Pass. |
| 4 | No change. | — |
| 6 | The title picture loads with priority (`PageTitle.tsx`); the site has an icon (`src/app/icon.svg`). | Lighthouse again: performance 96, accessibility 100, best practices 100, SEO 100; largest contentful paint 2.7 s, no lazy-loaded first picture, no console error. Pass. |

All tests and browser checks (60) pass on the changed version.


## The release check

Before the site goes live, each change passes:

- **CI on its pull request**: lint, types and the tests (`test`), the generated files (`types-fresh`), the
  migrations on an empty database with removals explained (`migrations`), the site in a real browser at
  390 and 1100 px with axe (`browser-checks`), the AI note (`ai-note`) and no starter leftovers
  (`leftovers`).
- **The preview** of each pull request, opened by the other team member.
- **After the merge, on the live site**: the home page shows Riverside Voices and "Team code: T29-7G6N";
  `/rooms/the-loft` shows its picture and its free time slots.

One improvement with its evidence: the room page's largest contentful paint went from 3.1 s to 2.7 s
(Lighthouse, mobile, same computer), and best practices from 96 to 100.

## Not tested yet

- **People who are not us**: nobody outside our team has done either task. Risk: we know the site, so we
  miss what a newcomer would stumble on. First thing to do with real users.
- **Task 2 (find a room)**: planned for round 2. Risk: the filters' words ("Group size", "Equipment")
  may not be what groups look for.
- **A screen reader by hand** (NVDA or VoiceOver): only axe checked the markup. Risk: the order in which
  the booking form's problems are read out could still confuse.
- **Booking on the live site**: we tested on our own build only, to keep the live bookings clean. Risk:
  a difference between Neon and our laptop database; the CI tests on Postgres make it small.
- **After the eight weeks of time slots**: what a group sees when a room has no slots left. Risk: an
  empty form if nobody adds new slots (see `docs/handover.md`).
