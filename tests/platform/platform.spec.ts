import { test, expect, type Page } from '@playwright/test';

// Tenants and credentials mirror DEMO_LOGINS.md (mock mode).
const PASSWORD = 'password123';
const TENANTS = [
  { vertical: 'Restaurant', orgId: 'LUMIERE', email: 'owner@lumiere.com', siteId: 'rest_lumiere', name: 'Lumière' },
  { vertical: 'Gym', orgId: 'PULSEFIT', email: 'owner@pulsefit.com', siteId: 'site_pulsefit', name: 'PulseFit Studios' },
  { vertical: 'Retail', orgId: 'NOVAGOODS', email: 'owner@novagoods.com', siteId: 'site_novagoods', name: 'Nova Goods' },
  { vertical: 'Salon', orgId: 'SLOANECO', email: 'owner@sloaneandco.com', siteId: 'site_sloaneco', name: 'Sloane & Co.' },
  { vertical: 'Coffee', orgId: 'FERNWOOD', email: 'owner@fernwoodcoffee.com', siteId: 'site_fernwood', name: 'Fernwood Coffee' },
  { vertical: 'Laundry', orgId: 'BRIGHTSIDE', email: 'owner@brightsidelaundry.com', siteId: 'site_brightside', name: 'Brightside Laundry' },
];
const PUBLIC_SITES = [...TENANTS.map((t) => t.siteId), 'rest_lumiere_nh'];
const PUBLIC_PAGES = ['', 'items', 'menu', 'reservations', 'membership', 'locations', 'checkout'];

const OWNER_ROUTES = [
  '/admin', '/admin/orders', '/admin/reservations', '/admin/membership',
  '/admin/website/pages', '/admin/website/pages/home', '/admin/website/pages/header-footer', '/admin/website/pages/theme', '/admin/website/media',
  '/admin/menu/categories', '/admin/menu/items', '/admin/menu/addons', '/admin/menu/offers',
  '/admin/restaurant/information', '/admin/restaurant/contact', '/admin/restaurant/hours', '/admin/restaurant/social',
  '/admin/settings/account', '/admin/settings/locations', '/admin/settings/users', '/admin/settings/website-sync',
  '/admin/settings/reserve', '/admin/settings/domains',
];
const OWNER_ONLY_ROUTES = ['/admin/settings/locations', '/admin/settings/users', '/admin/settings/website-sync', '/admin/settings/reserve', '/admin/settings/domains'];

/** Collects uncaught exceptions and console errors so every check can assert the page ran cleanly. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Third-party map tiles/images failing offline is not an app bug.
    if (/Failed to load resource|ERR_|tile\.openstreetmap|maps\.googleapis/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

async function freshMockDb(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.clear());
}

async function login(page: Page, orgId: string, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Organization ID').fill(orgId);
  await page.getByLabel('Email').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function expectRendered(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByText(/something went wrong|unexpected application error/i)).toHaveCount(0);
}

/** Role guards redirect once auth has loaded, so wait for the URL to move off the forbidden route. */
async function expectKeptOut(page: Page, route: string) {
  await expect(page, `should be kept out of ${route}`).not.toHaveURL(new RegExp(`${route}$`));
  await expectRendered(page);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await freshMockDb(page);
});

test.describe('platform entry & auth', () => {
  test('root redirects to login and auth pages render', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    for (const path of ['/login', '/signup', '/super-admin', '/forgot-password']) {
      await page.goto(path);
      await expectRendered(page);
      await expectNoHorizontalScroll(page);
    }
    expect(errors).toEqual([]);
  });

  test('protected admin redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('wrong password is rejected with a clear message', async ({ page }) => {
    await login(page, 'LUMIERE', 'owner@lumiere.com', 'wrong-password');
    await expect(page.getByText('Incorrect Organization ID, email, or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  for (const t of TENANTS) {
    test(`${t.vertical} owner can sign in and reach the dashboard`, async ({ page }) => {
      const errors = trackErrors(page);
      await login(page, t.orgId, t.email);
      await expect(page).toHaveURL(/\/admin\/?$/);
      await expectRendered(page);
      expect(errors).toEqual([]);
    });
  }

  test('session survives a reload', async ({ page }) => {
    await login(page, 'LUMIERE', 'owner@lumiere.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.reload();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });
});

test.describe('admin screens', () => {
  test('owner can open every admin screen without errors', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'route sweep runs once on desktop');
    test.setTimeout(180000);
    const unmocked: string[] = [];
    page.on('response', (r) => {
      // MSW passes unknown endpoints through to the real backend, which isn't running here.
      if (r.status() >= 500 && /^\/api\//.test(new URL(r.url()).pathname)) unmocked.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
    });
    await login(page, 'LUMIERE', 'owner@lumiere.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    const failures: string[] = [];
    for (const route of OWNER_ROUTES) {
      const errors = trackErrors(page);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      if (/\/login/.test(page.url())) failures.push(`${route}: bounced to login`);
      const crashed = await page.getByText(/something went wrong|unexpected application error/i).count();
      if (crashed) failures.push(`${route}: error screen`);
      if (!(await page.locator('main, #root').first().innerText()).trim()) failures.push(`${route}: blank page`);
      failures.push(...errors.map((e) => `${route}: ${e}`));
      page.removeAllListeners('pageerror');
      page.removeAllListeners('console');
    }
    expect(failures).toEqual([]);
    expect(unmocked, 'requests that bypassed the mock API').toEqual([]);
  });

  test('every tenant owner can open the core screens', async ({ browser }, info) => {
    test.skip(info.project.name === 'mobile', 'route sweep runs once on desktop');
    test.setTimeout(240000);
    const failures: string[] = [];
    for (const t of TENANTS) {
      // A fresh context per tenant so no session or mock data carries over between Orgs.
      const context = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport });
      const page = await context.newPage();
      await login(page, t.orgId, t.email);
      await expect(page).toHaveURL(/\/admin\/?$/);
      for (const route of ['/admin/orders', '/admin/reservations', '/admin/membership', '/admin/menu/items', '/admin/website/pages/home', '/admin/settings/users']) {
        const errors = trackErrors(page);
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        if (await page.getByText(/something went wrong|unexpected application error/i).count()) failures.push(`${t.orgId} ${route}: error screen`);
        failures.push(...errors.map((e) => `${t.orgId} ${route}: ${e}`));
        page.removeAllListeners('pageerror');
        page.removeAllListeners('console');
      }
      await context.close();
    }
    expect(failures).toEqual([]);
  });

  test('admin layout fits a phone screen', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile only');
    await login(page, 'LUMIERE', 'owner@lumiere.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    for (const route of ['/admin', '/admin/reservations', '/admin/orders', '/admin/menu/items']) {
      await page.goto(route);
      await expectRendered(page);
      await expectNoHorizontalScroll(page);
    }
  });
});

test.describe('roles & permissions', () => {
  test('staff cannot reach owner-only settings', async ({ page }) => {
    await login(page, 'LUMIERE', 'staff@lumiere.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    for (const route of OWNER_ONLY_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expectKeptOut(page, route);
    }
    await page.goto('/admin/superadmin/sites');
    await expectKeptOut(page, '/admin/superadmin/sites');
  });

  test('owner cannot reach the platform area', async ({ page }) => {
    await login(page, 'LUMIERE', 'owner@lumiere.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.goto('/admin/superadmin/sites');
    await expectKeptOut(page, '/admin/superadmin/sites');
  });

  test('super admin lands on All Sites and sees every site', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/super-admin');
    await page.getByLabel('Email').fill('admin@platform.com');
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin\/superadmin\/sites/);
    for (const t of TENANTS) await expect(page.getByText(t.name).first()).toBeVisible();
    await page.goto('/admin/orders');
    await expectKeptOut(page, '/admin/orders');
    expect(errors).toEqual([]);
  });

  test('org owner only sees their own organization data', async ({ page }) => {
    await login(page, 'PULSEFIT', 'owner@pulsefit.com');
    await expect(page).toHaveURL(/\/admin\/?$/);
    await page.goto('/admin/menu/items');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Lumière/)).toHaveCount(0);
  });
});

test.describe('public tenant websites', () => {
  for (const siteId of PUBLIC_SITES) {
    test(`${siteId} public pages render`, async ({ page }) => {
      test.setTimeout(120000);
      const failures: string[] = [];
      for (const p of PUBLIC_PAGES) {
        const errors = trackErrors(page);
        await page.goto(`/?preview=true&site=${siteId}#/${p}`);
        await page.waitForLoadState('networkidle');
        if (await page.getByText(/site not found|something went wrong/i).count()) failures.push(`#/${p}: error screen`);
        if (!(await page.locator('#root').innerText()).trim()) failures.push(`#/${p}: blank page`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 1) failures.push(`#/${p}: ${overflow}px horizontal overflow`);
        failures.push(...errors.map((e) => `#/${p}: ${e}`));
        page.removeAllListeners('pageerror');
        page.removeAllListeners('console');
      }
      expect(failures).toEqual([]);
    });
  }

  test('restaurant site sets the browser title and has a header', async ({ page }) => {
    await page.goto('/?preview=true&site=rest_lumiere');
    await expect(page).toHaveTitle(/Lumi/);
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('unknown booking link shows no customer data', async ({ page }) => {
    await page.goto('/s/lumiere-mayfair/reservation/' + 'a'.repeat(43));
    await expect(page.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0);
  });
});
