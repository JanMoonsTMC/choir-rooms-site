# Project brief

The short description of your site: who it is for and what it does. Its reader has never seen your
site, so write what a stranger needs to understand it. Keep it to one page; the details belong in
`docs/requirements.md`.

## What the site is for

Riverside Voices is a city choir with its own rehearsal house on Quay Street. The choir uses the rooms on
Thursday evenings and rents them out the rest of the week to other groups: choirs, bands and theatre
groups. The site promises those groups that they can find a room that fits them and book a free time slot
online, in a few minutes, without phoning or e-mailing anyone.

Riverside Voices, its house and its address are made up for this course project.

## Its users

The people who organise rehearsals for a small group: a choir's secretary, a band member who books the
practice space, the stage manager of an amateur theatre group. They know their group's size and what
they need (a piano, a drum kit, room to move), and they want a room for a fixed evening or a Saturday.
Most of them book on a phone, often in a break at work.

## The two tasks, ranked

The two things a user comes to do, the primary task first. For each: what users lose when it fails.

1. **Book a practice room for a time slot** (transactional). The user picks a room, chooses a free time
   slot, fills in their group's details and gets a confirmation. When it fails, the group has nowhere
   to rehearse that week, and the choir loses the rent that pays for the house.
2. **Find the room that fits your group** (informational). The user filters the rooms by group size and
   by what they need (a grand piano, a drum kit, step-free access) and compares them. When it fails,
   groups book a room that is too small or lacks what they need, and find out only when they arrive.

## Constraints

What must hold whatever is built.

- Test data only: made-up names, e-mail addresses and bookings, never real personal data.
- No payments.
- Free plans only.
- One group per time slot: a room is never shared by two groups at the same time.
- No accounts of our own and no API keys for other services: anything we connect to must work without
  us signing up. The one outside account, the tawk.to chat's, is the teacher's, made for this test project
  (`docs/decisions/integration.md`).

## Not in this version

What you decided to leave out, so that nobody mistakes it for something forgotten.

- Paying online. The choir's treasurer sends an invoice after the rehearsal; the site only shows the
  price.
- Cancelling or changing a booking yourself. A group e-mails the choir, and an editor changes it in
  `/admin`.
- Repeating bookings (every Tuesday until June). A group books each week on its own.
- Accounts for groups. The optional members' area of the starter stays switched off.
- Photos of the rooms. The rooms are made up, so the site shows our own drawings of them instead.
- A confirmation e-mail. The confirmation page and a calendar file (.ics) take its place.
- A Dutch version of the site.
