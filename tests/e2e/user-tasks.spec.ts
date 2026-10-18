// The site's two user tasks, done in a real browser at 390 and 1100 px (the two projects in
// playwright.config.ts):
//   task 1 (the primary task): book a practice room for a time slot, including what happens when a
//           user makes a mistake and when the connection drops while the booking is sent;
//   task 2: find the room that fits your group.
import { expect, test, type Page } from '@playwright/test'
import { runFixture } from './global-setup'
import { BOOKING_CONFIRMATION, countBookings, MADE_UP_DATA_NOTICE, NOT_CONFIRMED, readFixture, useOwnAddress } from './helpers'

test.describe('task 2: find the room that fits your group', () => {
  test('filter by group size and equipment, open a room, follow its equipment to the other side, and come back to the same filters', async ({ page }) => {
    await page.goto('/rooms')
    await expect(page.getByRole('heading', { level: 1, name: 'Rooms' })).toBeVisible()

    await page.getByLabel('Group size').selectOption({ label: 'Up to 12 people' })
    await page.getByLabel('Equipment').selectOption({ label: 'Upright piano' })
    await page.getByRole('button', { name: 'Show rooms' }).click()

    // The filters are in the address, so the list can be shared and Back finds it again.
    await expect(page).toHaveURL(/\/rooms\?people=12&feature=upright-piano#results$/)
    const results = page.locator('#results')
    await expect(results.getByRole('heading', { name: 'Rooms for up to 12 people with Upright piano — 2 rooms' })).toBeVisible()
    await expect(results.getByRole('link', { name: 'The Loft' })).toBeVisible()
    await expect(results.getByRole('link', { name: 'The Band Room' })).toHaveCount(0)

    await results.getByRole('link', { name: 'The Studio' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'The Studio' })).toBeVisible()

    // The equipment leads to its own page, which lists the rooms from the other side of the link.
    await page.getByRole('main').getByRole('link', { name: 'Upright piano' }).first().click()
    await expect(page).toHaveURL(/\/equipment\/upright-piano$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Upright piano' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'The Loft' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('link', { name: 'The Studio' })).toBeVisible()

    // The browser's Back button, then the room page's own way back: the filters are still chosen.
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1, name: 'The Studio' })).toBeVisible()
    await page.getByRole('link', { name: 'Back to the filtered rooms' }).click()
    await expect(page).toHaveURL(/\/rooms\?people=12&feature=upright-piano/)
    await expect(page.getByLabel('Group size')).toHaveValue('12')
    await expect(page.getByLabel('Equipment')).toHaveValue('upright-piano')
  })
})

test.describe('task 1: book a practice room for a time slot', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await useOwnAddress(page, testInfo)
  })

  // Opens the test room from the rooms list, as a user would.
  async function openClinic(page: Page) {
    const { room } = readFixture()
    await page.goto('/rooms')
    await page.getByRole('main').getByRole('link', { name: room.name }).first().click()
    await expect(page).toHaveURL(new RegExp(`/rooms/${room.slug}$`))
    await expect(page.getByRole('heading', { level: 1, name: room.name })).toBeVisible()
  }

  async function fillIn(page: Page) {
    await page.getByRole('radio').first().check()
    await page.getByLabel('Group name').fill('Test choir')
    await page.getByLabel('People in your group').fill('10')
    await page.getByLabel('Your name').fill('Test Person')
    await page.getByLabel('Your e-mail address').fill('test@example.com')
  }

  const requestIdOf = (page: Page) => page.locator('input[name="requestId"]').inputValue()

  test('choose a slot, give a name and an e-mail address, book, and see the confirmation word for word', async ({ page }) => {
    await openClinic(page)
    await expect(page.locator('form').filter({ has: page.locator('input[name="requestId"]') })).toContainText(MADE_UP_DATA_NOTICE)
    await fillIn(page)
    await page.getByRole('button', { name: 'Book this slot' }).click()

    await expect(page).toHaveURL(/\/rooms\/e2e-check-room\/booked\?ref=\d+\.[0-9a-f]{32}$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Booking saved' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'Your booking is saved.' })).toContainText(BOOKING_CONFIRMATION)
    await expect(page.getByText(BOOKING_CONFIRMATION, { exact: true })).toBeVisible()

    // A feature of the booking task: the booking as a calendar file (R11, docs/decisions/calendar-file.md).
    const download = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Add to my calendar' }).click()
    expect((await download).suggestedFilename()).toBe('riverside-voices-e2e-check-room.ics')
  })

  test('a mistake: the form says what is wrong, moves the focus there, and keeps what was typed', async ({ page }) => {
    await openClinic(page)
    await page.getByLabel('Group name').fill('Test choir')
    await page.getByLabel('People in your group').fill('10')
    await page.getByLabel('Your name').fill('Test Person')
    await page.getByLabel('Your e-mail address').fill('not-an-address')
    await page.getByLabel('Note').fill('We need twelve chairs.')
    await page.getByRole('button', { name: 'Book this slot' }).click()

    const problem = page.getByRole('alert').filter({ hasText: 'Not saved' })
    await expect(problem).toBeVisible()
    await expect(problem.getByRole('link')).toHaveCount(2)
    await expect(problem.getByRole('link', { name: 'Enter your e-mail address in the right form, like name@example.com.' })).toBeVisible()
    // The keyboard focus moved to the box, so a screen reader reads it out.
    await expect(page.locator(':focus')).toContainText('Not saved')
    await expect(page.getByLabel('Your e-mail address')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Group name')).toHaveValue('Test choir')
    await expect(page.getByLabel('Your name')).toHaveValue('Test Person')
    await expect(page.getByLabel('Your e-mail address')).toHaveValue('not-an-address')
    await expect(page.getByLabel('Note')).toHaveValue('We need twelve chairs.')
    await expect(page).toHaveURL(/\/rooms\/e2e-check-room$/)
  })

  test('a group bigger than the room: not saved, and the group size field says how many the room holds', async ({ page }) => {
    await openClinic(page)
    await fillIn(page)
    await page.getByLabel('People in your group').fill('40')
    await page.getByRole('button', { name: 'Book this slot' }).click()
    const problem = page.getByRole('alert').filter({ hasText: 'Not saved' })
    await expect(problem.getByRole('link', { name: 'Test rehearsal room holds at most 30 people. Choose a bigger room for your group.' })).toBeVisible()
    await expect(page.getByLabel('People in your group')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('People in your group')).toHaveValue('40')
  })

  test('the connection drops before the booking reaches the server: "Not confirmed", everything kept; sending again books once', async ({ page, request }) => {
    await openClinic(page)
    await fillIn(page)
    await page.getByLabel('Note').fill('Sent while offline.')
    const requestId = await requestIdOf(page)

    // The booking form's send is a POST to the room page's own address: make it fail as a dropped
    // connection would.
    await page.route('**/rooms/e2e-check-room', (route) => (route.request().method() === 'POST' ? route.abort('internetdisconnected') : route.fallback()))
    await page.getByRole('button', { name: 'Book this slot' }).click()

    const box = page.getByRole('alert').filter({ hasText: 'Not confirmed' })
    await expect(box).toBeVisible()
    await expect(box).toContainText(NOT_CONFIRMED[0])
    await expect(box).toContainText(NOT_CONFIRMED[1])
    await expect(page.getByRole('radio').first()).toBeChecked()
    await expect(page.getByLabel('Your name')).toHaveValue('Test Person')
    await expect(page.getByLabel('Your e-mail address')).toHaveValue('test@example.com')
    await expect(page.getByLabel('Note')).toHaveValue('Sent while offline.')
    expect(await requestIdOf(page)).toBe(requestId)
    expect(await countBookings(request, requestId)).toBe(0)

    // The connection is back: the same press books it, once.
    await page.unroute('**/rooms/e2e-check-room')
    await page.getByRole('button', { name: 'Book this slot' }).click()
    await expect(page).toHaveURL(/\/booked\?ref=/)
    await expect(page.getByText(BOOKING_CONFIRMATION, { exact: true })).toBeVisible()
    expect(await countBookings(request, requestId)).toBe(1)
  })

  test('saved, then the answer lost on the way back: sending again shows the saved booking, and there is still one', async ({ page, request }) => {
    await openClinic(page)
    await fillIn(page)
    const requestId = await requestIdOf(page)

    // The request reaches the server, which saves the booking; its answer never reaches the browser.
    await page.route('**/rooms/e2e-check-room', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      await route.fetch()
      await route.abort('connectionreset')
    })
    await page.getByRole('button', { name: 'Book this slot' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Not confirmed' })).toBeVisible()
    expect(await countBookings(request, requestId)).toBe(1)
    expect(await requestIdOf(page)).toBe(requestId)

    await page.unroute('**/rooms/e2e-check-room')
    await page.getByRole('button', { name: 'Book this slot' }).click()
    await expect(page).toHaveURL(/\/booked\?ref=/)
    await expect(page.getByText(BOOKING_CONFIRMATION, { exact: true })).toBeVisible()
    expect(await countBookings(request, requestId)).toBe(1)
  })

  test('the database fails while the room is shown: the error page says so, and "Try again" shows the room once it works', async ({ page }) => {
    const { room } = readFixture()
    // The rooms table is renamed for a moment (fixture.ts break): every read of a room fails.
    runFixture('break')
    try {
      const response = await page.goto(`/rooms/${room.slug}`)
      expect(response?.status()).toBe(500)
      await expect(page.getByRole('heading', { level: 1, name: 'This page could not be shown' })).toBeVisible()
      await expect(page.getByRole('main').getByRole('link', { name: 'All rooms' })).toBeVisible()
    } finally {
      runFixture('mend')
    }
    // "Try again" asks the server again (Next.js's retry), so the page now works without a reload.
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { level: 1, name: room.name })).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/rooms/${room.slug}$`))
  })
})
