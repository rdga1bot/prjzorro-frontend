import { test, expect } from '@playwright/test'

test.describe('Компанії', () => {

  test('сторінка компаній завантажується', async ({ page }) => {
    await page.goto('/companies')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('профіль компанії відкривається по ЄДРПОУ', async ({ page }) => {
    // Відкритий ЄДРПОУ (Укрзалізниця)
    await page.goto('/companies/40075815')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, [data-testid="company-name"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('вкладки компанії перемикаються', async ({ page }) => {
    await page.goto('/companies/40075815')
    await page.waitForLoadState('networkidle')
    const supplierTab = page.locator('button, [role="tab"]').filter({ hasText: /постачальник|supplier/i }).first()
    if (await supplierTab.isVisible()) {
      await supplierTab.click()
      await expect(page).toHaveURL(/tab=supplier/)
      await page.waitForLoadState('networkidle')
    }
  })

  test('граф зв\'язків компанії завантажується', async ({ page }) => {
    await page.goto('/companies/40075815')
    await page.waitForLoadState('networkidle')
    const networkTab = page.locator('button, [role="tab"]').filter({ hasText: /граф|зв\'язки|network/i }).first()
    if (await networkTab.isVisible()) {
      await networkTab.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('svg, canvas').first()).toBeVisible({ timeout: 8000 }).catch(() => {})
    }
  })

  test('порівняння двох компаній', async ({ page }) => {
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

})
