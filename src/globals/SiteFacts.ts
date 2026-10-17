import type { GlobalConfig } from 'payload'
import { anyone, editorsOnly } from '../access'

// The facts that several pages show: one record, so each fact has one source. An editor changes the
// pricing rule here once, and the home page and every room page show the new text at once.
// A "global" is a record that exists exactly once (there is one set of site facts, not a list).
export const SiteFacts: GlobalConfig = {
  slug: 'site-facts',
  label: 'Site facts',
  admin: {
    description: 'Change these here, once: every page reads them from here.',
  },
  // The same as the Pages: anyone may read them, only editors may change them.
  access: {
    read: anyone,
    update: editorsOnly,
  },
  fields: [
    {
      name: 'pricingRule',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Shown on the home page, the rooms page and every room page.',
      },
    },
    {
      name: 'place',
      type: 'text',
      required: true,
      admin: {
        description: 'The address of the house. Shown on the Contact page, on every room page and on the booking confirmation.',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Shown on the Contact page.',
      },
    },
  ],
}
