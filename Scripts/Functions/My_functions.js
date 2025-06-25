async function autoScroll(page, duration_ms) {
  let previousHeight = 0, newHeight, attempt = 0, timer = 0;
  const maxAttempts = 20, start = Date.now();

  if (duration_ms === -1) duration_ms = Infinity;

  while (timer <= duration_ms && attempt < maxAttempts) {
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await new Promise(resolve => setTimeout(resolve, 3000));

    newHeight = await page.evaluate(() => document.body.scrollHeight);
    
    if (newHeight === previousHeight) {
      attempt++;
    } else {
      attempt = 0;
      previousHeight = newHeight;
    }

    timer = Date.now() - start;
  }
};

const readline = require('readline');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

const escapeCSV = val => `"${String(val).replaceAll('\n', ';').replace(/"/g, '""')}"`

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function rotateTabs(tab_list, cycle_time = 500) {
  let i = -1;
  const intervalID = setInterval(() => {
    i = (i + 1) % tab_list.length;
    tab_list[i].bringToFront();
  }, cycle_time);

  return intervalID;
}

module.exports = {
  autoScroll,
  askQuestion,
  escapeCSV,
  sleep,
  rotateTabs
};