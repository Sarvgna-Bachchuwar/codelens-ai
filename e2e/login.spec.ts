import { test, expect } from '@playwright/test'

test('login page shows GitHub sign in button', async ({ page }) => {
  await page.goto('/login')
  const button = page.getByRole('button', { name: /sign in with github/i })
  await expect(button).toBeVisible()
})
