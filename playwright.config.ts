import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./tests/browser', timeout:30000, workers:1,
  use:{baseURL:'http://localhost:5175',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'},screenshot:'only-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true}}]
});
