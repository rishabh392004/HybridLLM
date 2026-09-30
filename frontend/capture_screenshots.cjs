const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function capture() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screens = [
    { name: '01_login.png', url: 'http://localhost:5174/login', waitMs: 1500 },
    { name: '02_register.png', url: 'http://localhost:5174/register', waitMs: 1500 },
    { name: '03_blended_map.png', url: 'http://localhost:5174/?region=Konkan%20%26%20Goa&param=rainfall&lead=24', waitMs: 2500 },
    { name: '04_model_weights.png', url: 'http://localhost:5174/weights?region=Konkan%20%26%20Goa&param=rainfall&lead=24', waitMs: 1800 },
    { name: '05_model_compare.png', url: 'http://localhost:5174/compare?region=Konkan%20%26%20Goa&param=rainfall&lead=24', waitMs: 1800 },
    { name: '06_skill_scoreboard.png', url: 'http://localhost:5174/scoreboard?region=Konkan%20%26%20Goa&param=rainfall', waitMs: 1800 },
    { name: '07_alerts_directives.png', url: 'http://localhost:5174/alerts?region=Konkan%20%26%20Goa', waitMs: 1800 },
    { name: '08_export_override.png', url: 'http://localhost:5174/override?region=Konkan%20%26%20Goa&param=rainfall&lead=24', waitMs: 1800 },
  ];

  for (const s of screens) {
    console.log(`Capturing ${s.name} from ${s.url}...`);
    await page.goto(s.url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(e => console.log('Navigation:', e.message));
    await new Promise(r => setTimeout(r, s.waitMs));
    const dest = path.join(screenshotsDir, s.name);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`Saved ${dest}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
