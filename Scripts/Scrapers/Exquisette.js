const puppeteer = require("../Puppeteer/node_modules/puppeteer");
const mf = require("../Functions/My_functions");

(async function() {
    const dont_show_head = 'no' === await mf.askQuestion("Do you wanna see the browser? (yes/no) ");
    const browser = await puppeteer.launch({headless: dont_show_head});
    
    await Promise.all(new Array(4).fill(null).map(() => browser.newPage())); // browser now has 5 tabs (1 default + 4 new)
    let tabs = await browser.pages();

    const links = [
        "https://exquisette.com/product-category/bags/",
        "https://exquisette.com/product-category/jewelry/",
        "https://exquisette.com/product-category/shoes/",
        "https://exquisette.com/product-category/accessories/",
        "https://exquisette.com/product-category/clothes/"
    ];

    const page_links = [];

    await Promise.all(tabs.map(async (tab, i) => {
        await tab.goto(links[i], {waitUntil: "load"});

        await tab.waitForSelector("a.page-number", {visible: true});
        await new Promise(resolve => setTimeout(resolve, 5000));

        const max_page = parseInt(await tab.evaluate(() => [...document.querySelectorAll("a.page-number")].at(-1).textContent.trim()), 10);
        
        for (let j = 1; j <= max_page; j++) page_links.push(links[i] + `page/${j}/`)
    }));

    console.log(page_links);
    console.log(page_links.length);

    if (!dont_show_head) await mf.askQuestion("Press Enter to finish program.");

    await browser.close();
})();