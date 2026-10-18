# Decision: an integration

Whether the site connects to another service, and to which. Its reader comes later, with one question:
can I change this, and what happens if I do? Decided by Test B, with Test A, on 18 October 2026.

## The question

How does a group keep its booked rehearsal in view after booking, so that nobody forgets the time or
the place (requirement R11)?

## Options considered

- **No integration: the confirmation page only.** Advantage: nothing to build. Drawback: the
  confirmation is gone once the tab is closed; in test round 1 people asked what happens next.
- **A confirmation e-mail through an e-mail service (Resend).** Advantage: it arrives where people look.
  Drawback: it needs an account, an API key and a sending domain, and our brief rules out new accounts
  and any real e-mail to made-up addresses.
- **A booking calendar service (Cal.com).** Advantage: calendars and reminders included. Drawback: an
  account, and it would replace our own booking task instead of supporting it.
- **A map (OpenStreetMap embed).** Advantage: no key needed. Drawback: it helps with the place, not the
  time; and an embedded map sends every user's internet address to the map's servers.
- **A calendar file (iCalendar, `.ics`) made by our own site.** Advantage: every calendar app (Google
  Calendar, Apple Calendar, Outlook) opens it; no account, no key, no payment, nothing is sent to another
  service. Drawback: the user has to open the file; it does not update itself if the booking changes.

## The decision

A calendar file of the booking: **Add to my calendar** on the confirmation page.

- **Installed**: no package. `src/lib/calendar.ts` writes the file in the iCalendar format (RFC 5545: CRLF
  line endings, long lines folded at 75 characters, commas and semicolons escaped); the route
  `src/app/(site)/rooms/[slug]/booked/calendar/route.ts` serves it as `riverside-voices-<room>.ics`.
- **What it holds**: the room ("Rehearsal in The Loft (Riverside Voices)"), the start and end in UTC, the
  address from the Site facts, and where the room is in the house with how to change or cancel. Never the
  group, a name, an e-mail address or the note.
- **Who can get it**: only someone with the signed confirmation link, for a booking of that room, like the
  confirmation page itself; anything else gets a 404.
- **How we checked it**: `tests/unit/calendar.test.ts` (the format), `tests/integration/calendar.test.ts`
  (the right booking, nothing private, 404 for a changed or other room's link), and the browser check
  that books a room and downloads the file. The integration test reads the served file line by line: one
  event, at the booked time, with the address.

## Why

- The brief allows no new accounts, keys or payments: the calendar file is the only candidate that needs
  none of them and still helps with the primary task.
- In test round 1, two of three people asked what happens after booking; the time and the place in their
  own calendar answer half of it (the "What happens next" text answers the rest).
- Nothing leaves our site: the file is made on our server and downloaded by the user.

## Consequences

- A changed or cancelled booking does not change the event in the user's calendar: they have to delete it
  themselves. The event's UID is the same for the same booking, so opening a new file updates it in most
  calendar apps.
- There is no reminder unless the user's calendar app adds one.
- No service can be down: the file works as long as our site works.

## Facts read on

- 18 October 2026: [RFC 5545, Internet Calendaring and Scheduling (iCalendar)](https://www.rfc-editor.org/rfc/rfc5545),
  section 3.1 (content lines end with CRLF; lines should not be longer than 75 octets and are folded with
  CRLF and a space).
- 18 October 2026: the course's list of integration candidates in `docs/decisions/integration.md` of the
  starter (chat window, e-mail service, booking calendar, newsletter, map).

## Review when

When the site sends e-mails for real (then a confirmation e-mail with the calendar file attached), or
when groups ask for reminders or for bookings that repeat every week.
