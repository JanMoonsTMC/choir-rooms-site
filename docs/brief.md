# Project brief

Written by: Test A and Test B

The short description of our site: who it is for and what it does. Its reader has never seen our site.
The details are in `docs/requirements.md`.

## What the site is for

- **The promise:** Riverside Voices' room rental helps the people who organise rehearsals for a choir, a
  band or a theatre group to find a room that fits their group and book a free time slot, so that the
  choir earns the rent that pays for its house.
- **Who runs it:** Riverside Voices, a city choir with its own rehearsal house on Quay Street.
- **What it offers:** The choir uses its four rooms on Thursday evenings and rents them out the rest of
  the week, in two-hour time slots.
- **Real or made up:** Made up. Riverside Voices, its house and its address exist only for this course
  project.

## Its users

| Kind of user | What they come to do | What they have when it is done |
| --- | --- | --- |
| A choir's secretary or a theatre group's stage manager | Book a room for a fixed evening or a Saturday | A saved booking, its confirmation and a calendar file |
| A band member who books the practice space | Find the room that holds the band and has what it needs (a drum kit, amplifiers) | The room that fits, ready to book |
| The choir's room manager | Keep the rooms, the equipment and the time slots right in `/admin` | A site that shows what can really be booked |

| Comparable site (its address) | Date we looked | One thing we learned from it |
| --- | --- | --- |
| https://pirate.com/en/rehearsal-studios/new-york | 18 November 2026 | Each kind of studio lists its equipment piece by piece and its price per hour before the booking starts. Our room cards show the same two things: the equipment and the price per two-hour slot. |
| https://wiltshiremusic.org.uk/hire-us/rehearsals | 18 November 2026 | Each room shows how many people it holds, but a group has to send an enquiry form and cannot see which times are free. Our room pages show the free time slots, so a group books without waiting for an answer. |

We looked at both sites after our own site was built. They changed nothing on it.

| What we do not know yet | How and when we will find out |
| --- | --- |
| Whether organisers really book on a phone, often in a break at work, as we assume | Read the devices in Vercel Web Analytics once real groups use the site (`docs/decisions/analytics.md`) |
| Whether someone who has never seen the site can book without help | Watch one person outside our team do the primary task: the first thing to do with real users (`docs/test-report.md`, "Not tested yet") |

## The two tasks, ranked

1. **Task 1 (the primary task):** Book a practice room for a time slot
   - **Type:** transactional
   - **Outcome:** The booking is saved for a time slot that was still free, and the user sees a
     confirmation with the room, the time and the address.
   - **When it fails:** The group has nowhere to rehearse that week, and the choir loses the rent that
     pays for the house.
2. **Task 2:** Find the room that fits your group
   - **Type:** informational
   - **Outcome:** The user knows which rooms hold their group and have what it needs (a piano, a drum
     kit).
   - **When it fails:** Groups book a room that is too small or lacks what they need, and find out only
     when they arrive.

**Why task 1 must work first:** Booking is what the groups come for and what the choir earns from. A
group that finds a room but cannot book it still has nowhere to rehearse, so finding only matters when it
ends in a booking (`docs/decisions/topic-and-tasks.md`).

## Constraints

- Test data only: made-up names, e-mail addresses and bookings, never real personal data.
- No payments.
- Free plans only.
- One group per time slot: a room is never shared by two groups at the same time.
- No accounts of our own and no API keys for other services. The one outside account, the tawk.to
  chat's, is the teacher's, made for this test project (`docs/decisions/integration.md`).

## Not in this version

| Left out | Why | We look at it again when |
| --- | --- | --- |
| Paying online | The project allows no payments. The site shows the price, and the choir's treasurer sends an invoice after the rehearsal. | A real choir uses the site and wants to be paid before the rehearsal |
| A confirmation e-mail | It needs an e-mail service with an account and a key. The confirmation page and a calendar file (.ics) take its place. | The site sends e-mails for real |
| Repeating bookings (every Tuesday until June) | A group books each week on its own. | Groups ask for bookings that repeat every week |
| Photos of the rooms | The rooms are made up, so the site shows our own drawings of them. | The site serves a real house |

Also left out: cancelling or changing a booking yourself (a group e-mails the choir, and an editor
changes it in `/admin`), accounts for groups and a Dutch version. `docs/handover.md` ranks what to build
next.
