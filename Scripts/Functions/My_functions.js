async function autoScroll(page) { // for dynamic websites
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let attempt = 0;
      const maxAttempts = 1000;

      const timer = setInterval(() => {
        const currentHeight = document.body.scrollHeight;
        window.scrollBy(0, 1000);

        setTimeout(() => {
          const newHeight = document.body.scrollHeight;

          if (newHeight === currentHeight) {
            attempt++;
            if (attempt >= maxAttempts) {
              clearInterval(timer);
              resolve();
            }
          } else {
            attempt = 0;
          }
        }, 150); // wait for DOM to update
      }, 200);
    });
  });
}

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