# Test report

What we learned by watching people use our site. It is read by whoever decides whether the site can go
live, and later by whoever improves it. Round 1 tested the primary task (book a room) and led to four
fixes; round 2 tested the second task (find a room) on the finished site, before the hand-over.

## What was tested, and how

### Round 1: book a practice room (18 October 2026)

The task, read out word for word:

> "Your group of eight wants to rehearse on a weekday evening about three weeks from now. Book a room for
> it on this site. Use made-up details: a made-up group, name and e-mail address."

- **Version**: the site built from our branch `h2-book-room` (`npm run build`, `npm start`), with the
  example rooms and eight weeks of time slots, opened on each person's own device over our home network.
- **Who took part**: three people from our own circle, none of whom had seen the site before: a fellow
  learner who sings in a student choir (phone), a family member who books rehearsal space for an amateur
  theatre group (laptop), and a friend who plays drums in a band (phone). No names are kept.
- **How**: one of us read the task and watched; the other took notes. We did not help unless asked, and
  wrote down every question. Each session took about ten minutes.
- **Tools**, on the same version: the browser checks with axe (`npm run check`, every page at 390 and
  1100 px) and Lighthouse 12.6.1 (mobile) on `/rooms/the-loft` and `/rooms`.

### Round 2: find the room that fits your group (18 October 2026)

The task, read out word for word:

> "You play in a band of five. You need a drum kit and amplifiers. Find the rooms that would work for
> you, and tell us which one you would book and why. You do not have to book it."

- **Version**: the finished site, built from our branch `final-integrations` (`npm run build`,
  `npm start`): filters, equipment pages, the round-1 fixes, analytics and the calendar file.
- **Who took part**: three other people from our circle, none of whom had seen the site: a fellow learner
  who plays bass (phone), a choir member who organises a chamber group (laptop), and a family member who
  rarely books anything online (phone).
- **How**: as in round 1. About eight minutes each.
- **Tools**: the browser checks with axe again (every page, both widths) and Lighthouse 12.6.1 (mobile)
  on `/rooms?people=8&feature=drum-kit-and-amplifiers` and `/equipment/drum-kit-and-amplifiers`.

## What we saw

### Round 1

| # | Behaviour (what you saw) | Interpretation (what you think it means) | Uncertainty (what you are not sure of) |
| --- | --- | --- | --- |
| 1 | Both phone users scrolled to the end of the slot list looking for a date three weeks away. One scrolled back up and found **Later time slots** after about 40 seconds; the other asked "does it only go two weeks?". The laptop user saw the link at once. | On a phone the link above the list is out of sight for someone who has just reached the end of the list, which is where they look for "more". | Only phones had the problem; with two phone users we cannot tell how common it is. |
| 2 | The laptop user asked: "Is EUR 20 per hour?" | "per time slot" does not say how long a slot is; the two hours are only on the About page and in the slot times. | The others did not ask; they may have read the times (19:00–21:00) and worked it out. |
| 3 | After "Your booking is saved", two of the three asked how to pay, and one how to cancel if the date changes. | The confirmation says what was saved but not what happens next. | On a real site an e-mail might answer this; ours sends none. |
| 4 | One person typed "8-10" as the group size. The field said "Enter how many people come as a whole number, like 12."; they typed 10 and booked within five seconds. | The message and the kept values work as meant. | One case only. |
| 5 | Every person found The Loft or The Studio for a group of eight without the filters, from the room cards' "Up to … people". | The size on the card is enough for this task; the filters matter more for task 2. | Task 2 was not part of this round. |
| 6 | Tools: axe found no serious or critical problem on any page at either width. Lighthouse (mobile) on `/rooms/the-loft`: performance 94, accessibility 100, best practices 96, SEO 100. It flagged the room's picture at the top as the largest element, loaded lazily (largest contentful paint 3.1 s), and a missing site icon (`/favicon.ico` 404 in the console). | The picture a phone shows first should load at once; the missing icon is a small, real error. | Measured on our own computer, not on Vercel's network. |

### Round 2

| # | Behaviour (what you saw) | Interpretation (what you think it means) | Uncertainty (what you are not sure of) |
| --- | --- | --- | --- |
| 7 | All three found The Band Room. Two chose **Equipment** in the filter first; the third tapped "Drum kit and amplifiers" in "What does your group need?" on the home page and landed on the filtered list. | The equipment is the first thing a band thinks of; both ways in work. | Groups that need a piano may behave differently: everyone tested here needed a drum kit. |
| 8 | The family member looked for a box to type "5" and paused at **Group size** before choosing "Up to 8 people". | The ranges work, but a typed number would be quicker for some. | One person; the others chose a size at once. |
| 9 | The chamber-group organiser opened The Studio and The Hall in two tabs to compare them, and said she would like them side by side. | Comparing two rooms is a real need we do not support. | We do not know how often groups compare; only one did. |
| 10 | On a phone, after **Show rooms**, both phone users saw the result line ("Rooms for up to 8 people with Drum kit and amplifiers — 1 room") without scrolling. | Opening the page at `#results` works as meant. | — |
| 11 | Tools: axe found no serious or critical problem. Lighthouse (mobile): performance 97, accessibility 100, best practices 96, SEO 100 on both pages. Best practices lost points for one console error: the Web Analytics script (`/_vercel/insights/script.js`) answers 404 until Analytics is switched on in Vercel. | The site is fast and accessible; the one error goes away once Analytics is enabled in the Vercel dashboard. | Measured on our own computer; the live site's numbers may differ. |

## What we changed, and the retest

### Round 1

| Finding | Change | Retest and result |
| --- | --- | --- |
| 1 | **Later time slots** also appears under the list of slots (`SlotPicker.tsx`). | The phone user who asked did the same task again: found the link under the list in about ten seconds and booked. Pass. |
| 2 | Prices now read "EUR 20 per two-hour slot" on the cards and the room page. | The laptop user read a room card and said "forty euros for four hours, then". Pass. |
| 3 | The confirmation has a "What happens next" part: nothing to pay now, the invoice after the rehearsal, and how to change or cancel (with a link to Contact). | Both who asked read it after booking again and asked nothing. Pass. |
| 4 | No change. | — |
| 6 | The title picture loads with priority (`PageTitle.tsx`); the site has an icon (`src/app/icon.svg`). | Lighthouse again: performance 96, accessibility 100, best practices 100, SEO 100; largest contentful paint 2.7 s, no lazy-loaded first picture, no console error. Pass. |

All tests and browser checks (60) pass on the changed version.

### Round 2

We changed no code after round 2: every person completed the task, and none of the findings stopped
anyone. Findings 8 and 9 are in `docs/handover.md` ("Left out, and in which order") as the next things to
build; finding 11 needs Analytics switched on in Vercel, which is a setting, not code (also in the
hand-over).

## The release check

The release check for the hand-over, on 18 October 2026: every pull request's CI green (below), the
browser checks and axe on the finished site (60 passed, no serious or critical problems), Lighthouse as in
findings 6 and 11, and the live site checked after each merge. Before the site goes live, each change
passes:

- **CI on its pull request**: lint, types and the tests (`test`), the generated files (`types-fresh`), the
  migrations on an empty database with removals explained (`migrations`), the site in a real browser at
  390 and 1100 px with axe (`browser-checks`), the AI note (`ai-note`) and no starter leftovers
  (`leftovers`). All green for round 1's version.
- **The preview** of each pull request, opened by the other team member.
- **After the merge, on the live site**: the home page shows Riverside Voices and "Team code: T29-7G6N";
  `/rooms/the-loft` shows its picture and its free time slots. Checked on 18 October 2026 after the
  content model was merged: both true.

One improvement with its evidence: the room page's largest contentful paint went from 3.1 s to 2.7 s
(Lighthouse, mobile, same computer), and best practices from 96 to 100.

## Not tested yet

- **Groups that need a piano or step-free access**: round 2 only tested a band that needs a drum kit.
  Risk: other groups may look for their equipment under other words.
- **A screen reader by hand** (NVDA or VoiceOver): only axe checked the markup. Risk: the order in which
  the booking form's problems are read out could still confuse.
- **Booking on the live site**: we tested on our own build only, to keep the live bookings clean. Risk:
  a difference between Neon and our laptop database; the CI tests on Postgres make it small.
- **After the eight weeks of time slots**: what a group sees when a room has no slots left. Risk: an
  empty form if nobody adds new slots (see `docs/handover.md`).
