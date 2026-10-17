'use client'

// What this is: a room's booking form: choose a time, give your group's name and size, your name and
// e-mail address, add a note if you like, and press "Book this slot". It runs in the browser
// ('use client'), so it can show "Saving your booking…" while the server works and point at the
// problems when a booking was not saved. The checks and the save happen on the server:
// src/tasks/book-slot/ (see its README.md).
//
// What happens when the user presses the button:
//   - the button says "Saving your booking…" and cannot be pressed again until the answer is back;
//   - saved: the server opens the confirmation page;
//   - not saved: the form comes back with everything the user typed, a box at the top that says what
//     went wrong (the keyboard focus moves to it), and a message under each field with a problem;
//   - no answer at all (the connection dropped): the form stays as it was and says it cannot tell
//     whether the booking was saved. Sending it again is safe: it is never booked twice.
//
// The box that says what went wrong is BookingProblem.tsx, the button BookingSubmitButton.tsx.
//
// What to change for your own site: the labels and the words. Keep the hidden fields and the notice.
import { unstable_rethrow } from 'next/navigation'
import { createContext, use, useActionState, useEffect, useRef } from 'react'
import { BookingProblem } from '@/components/site/BookingProblem'
import { BookingSubmitButton } from '@/components/site/BookingSubmitButton'
import { FieldError } from '@/components/site/FieldError'
import { Notice } from '@/components/site/Notice'
import { SlotPicker, type SlotChoice } from '@/components/site/SlotPicker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MADE_UP_DATA_NOTICE } from '@/content/riverside-voices'
import type { BookingField, BookingResult, BookingValues } from '@/tasks/book-slot/createBooking'
import { saveBooking } from '@/tasks/book-slot/saveBooking'
import { typedValues } from '@/tasks/book-slot/typedValues'

type BookingFormProps = {
  // The room's slug: the server checks that the chosen time belongs to this room.
  room: string
  // How many people the room holds: the group size field's hint says it, and the server checks it.
  capacity: number
  // The address of the next two weeks' time slots, shown under the list (SlotPicker), when there are any.
  laterHref?: string
  slots: SlotChoice[]
  // A random code the room page makes for this one form (see requestId in src/collections/Bookings.ts).
  requestId: string
  // The member who is logged in, with the optional members' area on (src/lib/membersArea.ts): their
  // name ('' when their account has none) and their e-mail address, and nothing else. null when the
  // area is off or nobody is logged in, and then the form is the ordinary one.
  member?: { name: string; email: string } | null
}

const EMPTY: BookingValues = { timeSlot: '', groupName: '', groupSize: '', name: '', email: '', note: '' }

// What the user sent last time, for every part inside the form. The fields below get it directly; a
// part in its own function can read it with useSentValues(), so it can show what the user had chosen
// when the form comes back.
export const SentValues = createContext<BookingValues>(EMPTY)
export function useSentValues(): BookingValues {
  return use(SentValues)
}

/**
 * Sends the form to the server (saveBooking). When the server cannot be reached at all (the
 * connection dropped, or the answer got lost), the call fails: instead of an error page, the form
 * then gets a "lost" answer and keeps everything the user typed, and the same requestId. If the
 * booking was in fact saved, sending it again returns that same booking (createBooking.ts, step 3).
 */
async function sendBooking(previous: BookingResult | null, formData: FormData): Promise<BookingResult> {
  try {
    return await saveBooking(previous, formData)
  } catch (error) {
    // Opening the confirmation page after a save also arrives here, as a special "redirect" error.
    // unstable_rethrow passes those on to Next.js, so the confirmation page still opens.
    unstable_rethrow(error)
    // For the developer: the browser's console says why the request was lost.
    console.error('The booking request got no answer:', error)
    return { ok: false, lost: true, message: 'The server could not be reached.', values: typedValues(formData) }
  }
}

export function BookingForm(props: BookingFormProps) {
  const { room, capacity, slots, requestId, member, laterHref } = props
  // state: null at first, then the answer of the last send (only failures come back: a saved booking
  // opens the confirmation page instead).
  const [state, formAction] = useActionState(sendBooking, null)
  const failed = state && !state.ok ? state : null
  // A member who is logged in starts with their own name and e-mail address filled in, and can still
  // change them; without a name on their account the name field stays empty (never the e-mail address).
  // After a send that did not save, what they really typed comes back instead.
  const values = failed?.values ?? (member ? { ...EMPTY, name: member.name, email: member.email } : EMPTY)
  const errors: Partial<Record<BookingField, string>> = failed?.errors ?? {}

  // After a failed send, move the keyboard focus to the box at the top: a screen reader reads it out,
  // and the next Tab reaches the first link in it.
  const summary = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (failed) summary.current?.focus()
  }, [failed])

  // aria-invalid and aria-describedby link a field to its error message (FieldError), so a screen
  // reader reads the message with the field's label.
  const problem = (field: BookingField) =>
    errors[field] ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` } : {}

  return (
    // noValidate: the server checks every field and explains each problem in words, the same way in
    // every browser, instead of the browser's own small pop-ups.
    <form action={formAction} noValidate className="grid gap-6">
      {/* Everything inside can read what the user sent last time (useSentValues). */}
      <SentValues value={values}>
        {failed && (
          <div ref={summary} tabIndex={-1} className="rounded-frame">
            <BookingProblem result={failed} />
          </div>
        )}

        {member && (
          <Notice label="Logged in">
            <p>{`You are logged in as ${member.name || member.email}. This booking will be saved to your account.`}</p>
          </Notice>
        )}

        {/* Not shown: which room this is, and the form's random code. */}
        <input type="hidden" name="room" value={room} />
        <input type="hidden" name="requestId" value={requestId} />

        <SlotPicker slots={slots} selected={values.timeSlot} error={errors.timeSlot} laterHref={laterHref} />

        <div className="grid gap-2">
          <Label htmlFor="groupName">
            Group name <span className="font-normal text-ink-soft">(required)</span>
          </Label>
          <p id="groupName-hint" className="text-ink-soft">The name of your choir, band or theatre group.</p>
          <Input
            id="groupName"
            name="groupName"
            autoComplete="organization"
            required
            defaultValue={values.groupName}
            className="scroll-mt-28"
            {...problem('groupName')}
            aria-describedby={errors.groupName ? 'groupName-hint groupName-error' : 'groupName-hint'}
          />
          {errors.groupName && <FieldError id="groupName-error">{errors.groupName}</FieldError>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="groupSize">
            People in your group <span className="font-normal text-ink-soft">(required)</span>
          </Label>
          <p id="groupSize-hint" className="text-ink-soft">{`This room holds up to ${capacity} people.`}</p>
          {/* inputMode="numeric": a phone shows its number keys. type="text", not "number": a number field
              changes its value when someone scrolls over it, and some browsers drop what it cannot read. */}
          <Input
            id="groupSize"
            name="groupSize"
            inputMode="numeric"
            required
            defaultValue={values.groupSize}
            className="scroll-mt-28 sm:max-w-40"
            {...problem('groupSize')}
            aria-describedby={errors.groupSize ? 'groupSize-hint groupSize-error' : 'groupSize-hint'}
          />
          {errors.groupSize && <FieldError id="groupSize-error">{errors.groupSize}</FieldError>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">
            Your name <span className="font-normal text-ink-soft">(required)</span>
          </Label>
          {/* scroll-mt-16: a link from the error box scrolls the field into view with its label above. */}
          <Input id="name" name="name" autoComplete="name" required defaultValue={values.name} className="scroll-mt-16" {...problem('name')} />
          {errors.name && <FieldError id="name-error">{errors.name}</FieldError>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">
            Your e-mail address <span className="font-normal text-ink-soft">(required)</span>
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={values.email} className="scroll-mt-16" {...problem('email')} />
          {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="note">
            Note <span className="font-normal text-ink-soft">(optional)</span>
          </Label>
          <p id="note-hint" className="text-ink-soft">For example, what your group needs set up. At most 500 characters.</p>
          <Textarea
            id="note"
            name="note"
            defaultValue={values.note}
            className="scroll-mt-28"
            {...problem('note')}
            aria-describedby={errors.note ? 'note-hint note-error' : 'note-hint'}
          />
          {errors.note && <FieldError id="note-error">{errors.note}</FieldError>}
        </div>

        {/* The trap field: name="extra" is TRAP_FIELD in src/tasks/book-slot/guards.ts (keep the two the
            same). People never see it, a screen reader skips it (aria-hidden) and Tab never reaches it
            (tabIndex -1); a program that fills in every field fills this one, and its booking is not
            saved. It sits off the screen rather than display:none, because some programs skip fields
            that are switched off that way. After a failed send it is empty again. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="extra">Leave this field empty</label>
          <input id="extra" name="extra" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <Notice>
          <p>{MADE_UP_DATA_NOTICE}</p>
        </Notice>

        <BookingSubmitButton />
      </SentValues>
    </form>
  )
}
