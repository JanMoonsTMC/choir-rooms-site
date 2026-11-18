// The facts of our site. When something here changes, the seed (src/seed/seed.ts) is where the example
// content for a new database comes from.
//
// Riverside Voices is a made-up city choir with its own rehearsal house. It rents its practice rooms to
// other choirs, bands and theatre groups. Every fact here is made up for our course project.
//
// The seed (src/seed/seed.ts) copies these facts into the database ONCE per database: after its first
// complete run it notes in the database that the example was added, and every later run, on each
// deploy too, adds nothing. From then on the records live in the database, editors change them in
// /admin, and this file is no longer read for them. Nothing you delete or change in /admin comes back
// after a deploy.
//
// `as const` makes every value here fixed: TypeScript then knows, for example, that the warm-up
// workshop's day is exactly 'Tuesday', not just "some text", and warns about a typo anywhere it is used.

// The site's name: in the header, the footer and every browser tab ("<Page> · Riverside Voices", from
// SITE_TITLE below). Change it here, once.
export const SITE_NAME = 'Riverside Voices'

// The browser tab's title. The home page shows the name alone; every other page gives only its own part
// (such as "Workshops") and Next.js adds " · " and the name after it, so a tab or a bookmark says both
// what the page is and which site it belongs to. Used by src/app/(site)/layout.tsx.
export const SITE_TITLE = { default: SITE_NAME, template: `%s · ${SITE_NAME}` }

export const RIVERSIDE_VOICES = {
  // The place, the e-mail address and the pricing rule (below) go into the Site facts global
  // (src/globals/SiteFacts.ts): every page that shows them reads them from there.
  place: 'Riverside Voices house, Quay Street 12, Riverside',
  email: 'rooms@riversidevoices.example',
  // The choir's open workshops for singers. Only the warm-up workshop has a stated end time; the
  // sight-singing workshop must end by 15:00 (its latestEnd), because a group has booked the room
  // from 15:00. That is a limit, not an end time.
  workshops: [
    {
      title: 'Warm up your voice',
      slug: 'warm-up-your-voice',
      level: 'beginner',
      day: 'Tuesday',
      startTime: '19:00',
      endTime: '20:30',
      price: 12,
      topics: ['voice-and-breathing', 'singing-together'],
    },
    {
      title: 'Read music from scratch',
      slug: 'read-music-from-scratch',
      level: 'beginner',
      day: 'Saturday',
      startTime: '10:00',
      price: 12,
      topics: ['reading-music', 'singing-together'],
    },
    {
      title: 'Sight-sing a new piece',
      slug: 'sight-sing-a-new-piece',
      level: 'intermediate',
      day: 'Saturday',
      startTime: '13:00',
      latestEnd: '15:00',
      price: 18,
      topics: ['reading-music'],
    },
    {
      title: 'Breathe for long phrases',
      slug: 'breathe-for-long-phrases',
      level: 'intermediate',
      day: 'Wednesday',
      startTime: '19:00',
      price: 18,
      topics: ['voice-and-breathing'],
    },
  ],
  // Three topics that overlap: the warm-up and reading workshops each have two topics, so the site can
  // show a many-to-many link from both sides.
  topics: [
    {
      name: 'Voice and breathing',
      slug: 'voice-and-breathing',
      description: 'Warm up safely, breathe from low down and keep a long phrase steady.',
    },
    {
      name: 'Reading music',
      slug: 'reading-music',
      description: 'Read a choir part from the page, from the first notes to a new piece at sight.',
    },
    {
      name: 'Singing together',
      slug: 'singing-together',
      description: 'Listen to the other parts and blend in: the basics of singing in a group.',
    },
  ],
  // The price list on the room booking page: what one two-hour time slot in each room costs.
  repairs: [
    {
      name: 'The Loft, up to 12 people',
      price: 20,
    },
    {
      name: 'The Studio, up to 25 people',
      price: 35,
    },
    {
      name: 'The Hall, up to 60 people',
      price: 60,
    },
  ],
  groupSize: 12,
  pricingRule: 'Sheet music and a pianist are included. Members of Riverside Voices pay half.',
  // The room booking is NOT in the seed yet: an editor adds it in /admin, with its time slots. These are
  // the agreed facts for it: weekday evenings, two-hour time slots, one group per slot.
  // Nothing reads these; they are here so you type the same values in /admin.
  clinicDefaults: {
    day: 'Monday',
    startTime: '19:00',
    endTime: '21:00',
    slotMinutes: 120,
    placesPerSlot: 1,
    slotTimes: ['19:00'],
  },
} as const

// Shown on the booking form, in the booking confirmation and on the privacy page. One copy here, so
// the three places can never say it differently. (The browser checks keep their own copy on purpose,
// in tests/e2e/helpers.ts, so a change here shows up there.)
export const MADE_UP_DATA_NOTICE = 'This is a practice project: use made-up details; no one will contact you.'

// What the booking confirmation page shows after a booking was saved.
export const BOOKING_CONFIRMATION = `Your booking is saved. ${MADE_UP_DATA_NOTICE}`

// The kinds of value above, for code that wants to name them, for example `(w: ExampleWorkshop)`.
export type ExampleWorkshop = (typeof RIVERSIDE_VOICES.workshops)[number]
