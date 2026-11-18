import type { CollectionConfig } from 'payload'
import { editorsOnlyField, isEditor, publicContent } from '../access'
import { preventCapacityReduction, preventDependentDeletion, requireExistingRelation } from '../lib/modelIntegrity'
import { SITE_TIME_ZONE } from '../lib/format'
import { positiveInteger } from './fields'

/**
 * A time slot's start, written the way people in Brussels read it, for example "10 Oct 2026, 15:00".
 * The database stores every time in UTC (world time), which is one or two hours behind Brussels, so
 * showing the stored value as it is would put every time slot at the wrong hour.
 */
export function brusselsTime(startsAt: string | Date | null | undefined): string {
  const date = new Date(startsAt ?? Number.NaN)
  if (Number.isNaN(date.getTime())) return 'Time slot'
  return new Intl.DateTimeFormat('en-GB', { timeZone: SITE_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

// One bookable time slot of a room, usually two hours. One group books it (places: 1).
export const TimeSlots: CollectionConfig = {
  slug: 'timeSlots',
  admin: {
    // Payload can only use a saved field as a record's title, so the edit page shows startsAt. The list
    // shows the friendlier 'When (Brussels time)' column instead.
    useAsTitle: 'startsAt',
    defaultColumns: ['label', 'room', 'places'],
  },
  access: publicContent,
  hooks: {
    beforeDelete: [
      preventDependentDeletion(
        'bookings',
        'timeSlot',
        'This time slot still has bookings. Open Bookings and move each one to another time slot or delete it, then delete the time slot.',
      ),
    ],
    beforeChange: [
      requireExistingRelation('room', 'rooms', 'This room no longer exists. Choose another room.'),
      preventCapacityReduction,
    ],
    afterRead: [
      ({ doc, req }) => {
        // Code on the server reads with full rights unless told otherwise, so the editors-only rule on
        // 'bookings' is not enough by itself. Anyone who is not a logged-in editor never receives the
        // bookings list, so names and e-mail addresses stay private.
        if (!isEditor({ req })) delete doc.bookings
        return doc
      },
    ],
  },
  fields: [
    // One-to-many: every time slot belongs to exactly one room. Stored here.
    {
      name: 'room',
      type: 'relationship',
      relationTo: 'rooms',
      required: true,
    },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          // The same pattern as the 'When (Brussels time)' column, for example "10 Oct 2026, 15:00".
          displayFormat: 'd MMM yyyy, HH:mm',
          // The picker's list of times on the 24-hour clock too (15:00, not 3:00 PM).
          timeFormat: 'HH:mm',
        },
      },
    },
    // When the room must be free again. Shown with the start ("19:00–21:00") and put in the calendar file.
    {
      name: 'endsAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy, HH:mm',
          timeFormat: 'HH:mm',
        },
      },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) => {
        if (!value) return 'Choose when the time slot ends.'
        const start = new Date(String(siblingData.startsAt ?? ''))
        if (!Number.isNaN(start.getTime()) && new Date(String(value)) <= start) return 'The end must be after the start.'
        return true
      },
    },
    {
      name: 'places',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      validate: positiveInteger,
      admin: {
        description: 'How many groups can book this time slot. A practice room takes 1 group at a time.',
      },
    },
    // Not stored: worked out from startsAt every time a time slot is read, for the list in /admin.
    {
      name: 'label',
      label: 'When (Brussels time)',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [({ siblingData }) => brusselsTime(siblingData.startsAt)],
      },
    },
    // The reverse side of the one-to-many: this slot's bookings, read from each booking's "timeSlot".
    // Only editors see it, because bookings hold names and e-mail addresses.
    {
      name: 'bookings',
      type: 'join',
      collection: 'bookings',
      on: 'timeSlot',
      access: {
        read: editorsOnlyField,
      },
    },
  ],
}
