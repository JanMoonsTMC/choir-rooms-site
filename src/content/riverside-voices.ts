// The facts of our site, in one place. The seed (src/seed/seed.ts) and the migration that replaced the
// starter's example on the live site (src/migrations/*_choir_content.ts) both copy them into the database.
//
// Riverside Voices is a made-up city choir with its own rehearsal house. It rents its practice rooms to
// other choirs, bands and theatre groups. Every fact here is made up for our course project, and agrees
// with docs/brief.md and the decision records in docs/decisions/.
//
// The seed copies these facts into the database ONCE per database: after its first complete run it notes
// in the database that the example was added, and every later run, on each deploy too, adds nothing.
// From then on the records live in the database, editors change them in /admin, and this file is no
// longer read for them. Nothing you delete or change in /admin comes back after a deploy.
//
// `as const` makes every value here fixed: TypeScript then knows, for example, that the Hall's slug is
// exactly 'the-hall', not just "some text", and warns about a typo anywhere it is used.

// The site's name: in the header, the footer and every browser tab ("<Page> · Riverside Voices", from
// SITE_TITLE below). Change it here, once.
export const SITE_NAME = 'Riverside Voices'

// The browser tab's title. The home page shows the name alone; every other page gives only its own part
// (such as "Rooms") and Next.js adds " · " and the name after it, so a tab or a bookmark says both what
// the page is and which site it belongs to. Used by src/app/(site)/layout.tsx.
export const SITE_TITLE = { default: SITE_NAME, template: `%s · ${SITE_NAME}` }

export const RIVERSIDE_VOICES = {
  // The place, the e-mail address and the pricing rule (below) go into the Site facts global
  // (src/globals/SiteFacts.ts): every page that shows them reads them from there.
  place: 'Riverside Voices house, Quay Street 12, Riverside',
  email: 'rooms@riversidevoices.example',
  pricingRule:
    'Each price is for one two-hour time slot, with chairs, music stands and heating included. Nobody pays online: the choir sends an invoice after your rehearsal.',
  // The equipment a room can have. Several rooms share some of it (an upright piano, a sound system,
  // step-free access), so the site can show the many-to-many from both sides.
  features: [
    { name: 'Grand piano', slug: 'grand-piano', description: 'A tuned grand piano, for accompanied rehearsals and concerts in the house.' },
    { name: 'Upright piano', slug: 'upright-piano', description: 'A tuned upright piano, enough to give notes and accompany a rehearsal.' },
    { name: 'Drum kit and amplifiers', slug: 'drum-kit-and-amplifiers', description: 'A drum kit, a bass amplifier and two guitar amplifiers. Bring your own cymbals and cables.' },
    { name: 'Sound system', slug: 'sound-system', description: 'Speakers, a mixer and two microphones, for backing tracks or a spoken part.' },
    { name: 'Choir risers', slug: 'choir-risers', description: 'Three rows of risers, so every singer sees the conductor.' },
    { name: 'Wall mirrors', slug: 'wall-mirrors', description: 'A mirror wall, for theatre groups and anyone who rehearses movement.' },
    { name: 'Step-free access', slug: 'step-free-access', description: 'No steps from the street to the room, and an accessible toilet on the same floor.' },
    { name: 'Soundproofing', slug: 'soundproofing', description: 'Sound-insulated walls and door, so you can play loud without disturbing the other rooms.' },
  ],
  // The four practice rooms. capacity: the most people a room holds; price: one two-hour time slot, in
  // euros; features: the slugs of the equipment above.
  rooms: [
    {
      name: 'The Hall',
      slug: 'the-hall',
      capacity: 60,
      price: 60,
      location: 'Ground floor, through the main entrance',
      features: ['grand-piano', 'choir-risers', 'sound-system', 'step-free-access'],
    },
    {
      name: 'The Studio',
      slug: 'the-studio',
      capacity: 25,
      price: 35,
      location: 'Ground floor, at the back of the house',
      features: ['upright-piano', 'wall-mirrors', 'sound-system', 'step-free-access'],
    },
    {
      name: 'The Loft',
      slug: 'the-loft',
      capacity: 12,
      price: 20,
      location: 'Second floor, up two flights of stairs (there is no lift)',
      features: ['upright-piano'],
    },
    {
      name: 'The Band Room',
      slug: 'the-band-room',
      capacity: 8,
      price: 25,
      location: 'Basement, down one flight of stairs',
      features: ['drum-kit-and-amplifiers', 'sound-system', 'soundproofing'],
    },
  ],
  // When the rooms can be booked (docs/decisions/one-group-per-slot.md): two-hour time slots, one group
  // each, in Brussels time. Weekday evenings 19:00 to 21:00, and two slots on Saturday. The Hall has no
  // slot on Thursday evening: the choir rehearses there itself. weekday: 1 is Monday, 6 is Saturday.
  slots: {
    weeksAhead: 8,
    hours: 2,
    places: 1,
    times: [
      { weekday: 1, start: '19:00' },
      { weekday: 2, start: '19:00' },
      { weekday: 3, start: '19:00' },
      { weekday: 4, start: '19:00', notIn: ['the-hall'] },
      { weekday: 5, start: '19:00' },
      { weekday: 6, start: '10:00' },
      { weekday: 6, start: '14:00' },
    ],
  },
} as const

// Shown on the booking form, in the booking confirmation and on the privacy page. One copy here, so
// the three places can never say it differently. (The browser checks keep their own copy on purpose,
// in tests/e2e/helpers.ts, so a change here shows up there.)
export const MADE_UP_DATA_NOTICE = 'This is a practice project: use made-up details; no one will contact you.'

// What the booking confirmation page shows after a booking was saved.
export const BOOKING_CONFIRMATION = `Your booking is saved. ${MADE_UP_DATA_NOTICE}`

// The kinds of value above, for code that wants to name them, for example `(room: ExampleRoom)`.
export type ExampleRoom = (typeof RIVERSIDE_VOICES.rooms)[number]
export type ExampleFeature = (typeof RIVERSIDE_VOICES.features)[number]
