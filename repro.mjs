// Loads the page in a fresh browser and prints the occurrences' dates and the bars drawn.
//
//   npm run dev        # in one terminal
//   npm run repro      # in another
import { chromium } from 'playwright-core';

const URL = process.env.REPRO_URL ?? 'http://localhost:5192/';
const RUNS = Number(process.env.RUNS ?? 3);

const browser = await chromium.launch();
let reproduced = 0;

for (let run = 1; run <= RUNS; run++) {
    const page = await browser.newPage({ viewport : { width : 1400, height : 500 } });
    page.on('pageerror', error => console.log(`page error: ${error.message}`));
    await page.goto(URL);
    await page.locator('.b-sch-event-wrap').first().waitFor({ timeout : 60_000 });
    const { rows, barsPerDay } = await page.evaluate(() => window.report());
    console.log(`\n--- run ${run}\n${await page.locator('#log').textContent()}`);
    const occurrence = rows.find(row => row.day === 21);
    // Expected for 21 Apr: 10:00 -> 22:30, segments 10:00-14:30 and 18:00-22:30 on that day.
    const wrongEnd = !occurrence.end.endsWith('22:30');
    const wrongSegments = occurrence.segments.some(segment => !segment.startsWith('4/21'));
    if (wrongEnd && wrongSegments && barsPerDay[21] === 0 && barsPerDay[14] > 0) {
        reproduced++;
    }
    await page.screenshot({ path : `screenshot-run${run}.png` });
    await page.close();
}

await browser.close();
console.log(`reproduced ${reproduced}/${RUNS}`);
process.exit(reproduced === RUNS ? 0 : 1);
