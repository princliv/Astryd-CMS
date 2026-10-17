import { defineConfig } from '@playwright/test';

// Pre-launch platform smoke suite. Builds the app in mock mode (MSW, seed in src/mocks/seed.ts) into its
// own folder and serves it, so it needs no backend and never touches ./dist.
const PORT = 5176;
const chromium = process.env.PLAYWRIGHT_CHROMIUM_PATH;

export default defineConfig({
  testDir: './tests/platform',
  timeout: 60000,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/platform' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the installed Google Chrome; set PLAYWRIGHT_CHROMIUM_PATH to use another Chromium build.
    ...(chromium ? { launchOptions: { executablePath: chromium } } : { channel: 'chrome' }),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite build --mode production --outDir dist-platform-test --emptyOutDir && npx vite preview --outDir dist-platform-test --host localhost --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/login`,
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCKS: 'true', VITE_DEFAULT_RESTAURANT_ID: 'rest_lumiere', VITE_DEFAULT_RESTAURANT_SLUG: 'lumiere-mayfair' },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
