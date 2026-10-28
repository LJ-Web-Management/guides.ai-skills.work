import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:true,workers:2,timeout:30000,retries:process.env.CI?1:0,reporter:'list',
  use:{baseURL:'http://127.0.0.1:4321',trace:'retain-on-failure',launchOptions:{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)}},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{command:'npm start',url:'http://127.0.0.1:4321',reuseExistingServer:!process.env.CI,timeout:30000},
});
