# Test report

Written by: Test A and Test B

What we learned by testing our site. It is read by whoever decides whether the site can go live, and
later by whoever improves it.

The report grew in two rounds. In the first round we did our primary task, book a room, and fixed what
we saw. In the second round we did the same task again after our changes, and wrote the release check.
We also tried our second task once on the finished site; its findings are at the end of "What we saw".

## What was tested, and how

- **Task:** "Your group of eight wants to rehearse on a weekday evening about three weeks from now. Book
  a room for it on this site. Use made-up details: a made-up group, name and e-mail address."
- **Who took part:** Nobody else was watched. We had nobody outside our team to ask in time, so each of
  us did the task ourselves in a private window, reading only what is on the screen, and wrote down
  every moment we hesitated. We built the site, so we had seen all of it.
- **Success:** The booking is saved for a weekday evening about three weeks ahead, and the confirmation
  page shows it.
- **Version of the site:** The site built from our branch `h2-book-room` (`npm run build`, `npm start`),
  with the example rooms and eight weeks of time slots.
- **Device and browser:** Our own computers, in a private browser window, once at phone width (390 px)
  and once at laptop width.
- **Place:** Each of us at our own computer.
- **Date of the test:** 18 October 2026
- **Tools, on the same version:** the browser checks with axe (`npm run check`, every page at 390 and
  1100 px) and Lighthouse 12.6.1 (mobile) on `/rooms/the-loft` and `/rooms`.

## What we saw

| # | Behaviour (what you saw) | Interpretation (what you think it means) | Uncertainty (what you are not sure of) |
| --- | --- | --- | --- |
| 1 | At phone width, the slot list runs below the screen; at its end there is nothing, and **Later time slots** sits above the list, out of sight. We scrolled to the end looking for a date three weeks away before we found it. | On a phone, the end of a list is where people look for "more". | We knew the site; someone new may look elsewhere, or give up sooner. |
| 2 | The room cards said "EUR 20 per time slot". Reading only the card, we could not tell how long a slot is: the two hours are only in the slot times and on the About page. | A price per slot needs the slot's length next to it. | We have not seen a real user misread it. |
| 3 | After "Your booking is saved", the page said what was saved, but not how to pay or how to cancel. | The confirmation leaves the next questions open. | On a real site an e-mail might answer this; ours sends none. |
| 4 | We typed "8-10" as the group size. The field said "Enter how many people come as a whole number, like 12."; with 10 the booking was saved, and the other fields kept what we had typed. | The message and the kept values work as meant. | — |
| 5 | For a group of eight, The Loft and The Studio showed at once on the room cards ("Up to … people"), without the filters. | The size on the card is enough for this task; the filters matter more for our second task. | Our second task was not part of this round. |
| 6 | Tools: axe found no serious or critical problem on any page at either width. Lighthouse (mobile) on `/rooms/the-loft`: performance 94, accessibility 100, best practices 96, SEO 100. It flagged the room's picture at the top as the largest element, loaded lazily (largest contentful paint 3.1 s), and a missing site icon (`/favicon.ico` 404 in the console). | The picture a phone shows first should load at once; the missing icon is a small, real error. | Measured on our own computer, not on Vercel's network. |

### Our second task on the finished site

On 18 October 2026 each of us also did our second task ourselves, in a private window at phone and at
laptop width, on the site built from our branch `final-integrations`. Again nobody else was watched. The
task: "You play in a band of five. You need a drum kit and amplifiers. Find the rooms that would work
for you, and say which one you would book and why. You do not have to book it."

| # | Behaviour (what you saw) | Interpretation (what you think it means) | Uncertainty (what you are not sure of) |
| --- | --- | --- | --- |
| 7 | Both ways in reached The Band Room: **Equipment** in the filter, and "Drum kit and amplifiers" under "What does your group need?" on the home page, which opens the filtered list. | Both ways in work for a band. | Groups that need a piano may look for other words. |
| 8 | **Group size** offers ranges ("Up to 8 people"); there is no box to type "5". | The ranges work, but a typed number could be quicker. | We did not see anyone hesitate; this is our own judgement. |
| 9 | To compare The Studio and The Hall we opened them in two tabs. | Comparing two rooms is a need we do not support. | We do not know how often groups compare. |
| 10 | On a phone, after **Show rooms**, the result line ("Rooms for up to 8 people with Drum kit and amplifiers — 1 room") shows without scrolling. | Opening the page at `#results` works as meant. | — |
| 11 | Tools: axe found no serious or critical problem. Lighthouse (mobile) on `/rooms?people=8&feature=drum-kit-and-amplifiers` and `/equipment/drum-kit-and-amplifiers`: performance 97, accessibility 100, best practices 96, SEO 100 on both. Best practices lost points for one console error: the Web Analytics script (`/_vercel/insights/script.js`) answered 404 until Analytics was switched on in Vercel. | The site is fast and accessible; the one error went away once Analytics was enabled in the Vercel dashboard. | Measured on our own computer; the live site's numbers may differ. |

## What we changed, and the retest

- **Finding:** 1
- **Fixed or not fixed:** Fixed: on a phone, the end of the list is where we looked for more.
- **What we changed:** **Later time slots** also appears under the list of slots (`SlotPicker.tsx`).
- **Pull request:** #6

- **Finding:** 2
- **Fixed or not fixed:** Fixed: a price per slot needs the length of the slot next to it.
- **What we changed:** Prices now read "EUR 20 per two-hour slot" on the cards and the room page.
- **Pull request:** #6

- **Finding:** 3
- **Fixed or not fixed:** Fixed: the confirmation left the next questions open.
- **What we changed:** The confirmation has a "What happens next" part: nothing to pay now, the invoice
  after the rehearsal, and how to change or cancel (with a link to Contact).
- **Pull request:** #6

- **Finding:** 4 and 5
- **Fixed or not fixed:** Not fixed: both worked as meant.

- **Finding:** 6
- **Fixed or not fixed:** Fixed: the picture a phone shows first should load at once, and the missing icon was a small, real error.
- **What we changed:** The title picture loads with priority (`PageTitle.tsx`), and the site has an icon
  (`src/app/icon.svg`).
- **Pull request:** #6

- **Findings 7 to 11 (our second task):** Not fixed in code: the task worked both ways in. Findings 8
  and 9 are in `docs/handover.md` ("Left out, and in which order") as things to build next. Finding 11
  needed a setting, not code: Analytics is now switched on in Vercel.

**Retest:** On 18 October 2026, on the version with these changes, we did the same task again in a
private window at 390 px. Again nobody else was watched. The link to later time slots is right
under the list (finding 1), the cards say how long a slot is (finding 2), and after "Your booking is
saved" the page says what happens next (finding 3). Lighthouse again on `/rooms/the-loft`: performance
96, accessibility 100, best practices 100, SEO 100; largest contentful paint 2.7 s instead of 3.1 s, and
no console error (finding 6). All tests and all 60 browser checks passed on that version.

## The release check

Done on 18 October 2026, with both tasks.

- **Device and browser:** Our own computers: a private browser window by hand, at 390 px and at laptop
  width, and Chrome driven by the starter's browser checks at 390 and 1100 px.
- **What we found with the keyboard only, and at phone width:** Both tasks can be completed. With Tab
  alone we filtered the rooms, chose a time slot and booked, and we always saw where the focus was
  (requirement R10). At 390 px no page scrolls sideways. axe found no serious or critical problem.
- **Our decision:** Release, with one follow-up: watch a person outside our team do both tasks (see "Not
  tested yet").

## Not tested yet

| Not tested | What could go wrong because of it |
| --- | --- |
| People who are not us: nobody outside our team has done either task | We know the site, so we miss what a newcomer would stumble on. It is the first thing to do with real users. |
| Groups that need a piano or step-free access: our second task was only tried for a band that needs a drum kit | Other groups may look for their equipment under other words. |
| A screen reader by hand (NVDA or VoiceOver): only axe checked the markup | The order in which the booking form's problems are read out could still confuse. |
| Booking on the live site: we tested on our own build only, to keep the live bookings clean | A difference between Neon and our laptop database; the CI tests on Postgres make it small. |
| After the eight weeks of time slots: what a group sees when a room has no slots left | An empty form if nobody adds new slots (see `docs/handover.md`). |
