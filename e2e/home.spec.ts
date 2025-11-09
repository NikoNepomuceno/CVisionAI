import { test, expect } from '@playwright/test'

test('home renders header', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CVisionAI' })).toBeVisible()
})


