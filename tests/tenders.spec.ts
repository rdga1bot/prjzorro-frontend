import { test, expect } from '@playwright/test'

test.describe('Тендери — критичні flows', () => {

  test('головна сторінка завантажується', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Prozorro/)
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('список тендерів: завантажується та показує рядки', async ({ page }) => {
    await page.goto('/tenders')
    // Чекаємо що таблиця або картки з'явились (не loading)
    await expect(page.locator('table, [data-testid="tender-list"]').first()).toBeVisible({ timeout: 10000 })
    // Має бути хоча б один рядок
    const rows = page.locator('tbody tr, [data-testid="tender-row"]')
    await expect(rows.first()).toBeVisible({ timeout: 10000 })
  })

  test('фільтр за регіоном', async ({ page }) => {
    await page.goto('/tenders')
    const regionSelect = page.locator('select[name="region"], [data-testid="region-filter"]').first()
    if (await regionSelect.isVisible()) {
      await regionSelect.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('фільтр за ризиком', async ({ page }) => {
    await page.goto('/tenders?risk_level=high')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('tbody tr, [data-testid="tender-row"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('детальна сторінка тендера відкривається', async ({ page }) => {
    await page.goto('/tenders')
    await page.waitForLoadState('networkidle')
    // Клікаємо перший тендер
    const firstLink = page.locator('tbody tr a, [data-testid="tender-row"] a').first()
    await expect(firstLink).toBeVisible({ timeout: 10000 })
    await firstLink.click()
    // Має завантажитись сторінка тендера
    await expect(page.locator('h1, [data-testid="tender-title"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('пошук тендерів', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.locator('input[type="search"], input[placeholder*="пошук" i], [data-testid="search-input"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('будівництво')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')
      // Результати або "не знайдено" — не повинно бути помилки 500
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
    }
  })

  test('сторінка /search відповідає', async ({ page }) => {
    const res = await page.goto('/search?q=медичне')
    expect(res?.status()).toBeLessThan(500)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('сторінка Громади показує 25 регіонів', async ({ page }) => {
    await page.goto('/hromada')
    await page.waitForLoadState('networkidle')
    // Має бути список карток регіонів
    const cards = page.locator('button, [role="button"]').filter({ hasText: /область|м\. Київ/i })
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(24)
  })

  test('Громади: деталь регіону і back navigation', async ({ page }) => {
    await page.goto('/hromada')
    await page.waitForLoadState('networkidle')
    const firstCard = page.locator('button').filter({ hasText: /Київська область/i }).first()
    if (await firstCard.isVisible()) {
      await firstCard.click()
      // URL повинен змінитись на ?region=
      await expect(page).toHaveURL(/region=/)
      // Кнопка "Регіони" (back)
      const backBtn = page.locator('button, a').filter({ hasText: /Регіони/i }).first()
      await expect(backBtn).toBeVisible({ timeout: 5000 })
      await backBtn.click()
      // Повернулись до списку
      await expect(page).toHaveURL(/\/hromada$/)
    }
  })

  test('сторінка Топ ризиків завантажується', async ({ page }) => {
    await page.goto('/risky')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').filter({ hasText: /ризик/i }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('Завантаження')
  })

  test('сторінка Аналітики завантажується', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('навігація між сторінками працює', async ({ page }) => {
    await page.goto('/')
    for (const [label, path] of [
      ['Тендери',    '/tenders'],
      ['Компанії',   '/companies'],
      ['Громади',    '/hromada'],
    ]) {
      await page.getByRole('link', { name: label }).first().click()
      await expect(page).toHaveURL(new RegExp(path))
      await page.waitForLoadState('networkidle')
    }
  })

})
