const puppeteer = require("../Puppeteer/node_modules/puppeteer");
const mf = require("../Functions/My_functions");

(async function() {
    const dont_show_head = 'no' === await mf.askQuestion("Do you wanna see the browser? (yes/no) ");
    const browser = await puppeteer.launch({headless: dont_show_head});
    
    await Promise.all(new Array(9).fill(null).map(() => browser.newPage())); // browser now has 10 tabs (1 default + 9 new)
    const tabs = await browser.pages();

    // Initialize 5 category links
    let links = [
        "https://exquisette.com/product-category/bags/",
        "https://exquisette.com/product-category/jewelry/",
        "https://exquisette.com/product-category/shoes/",
        "https://exquisette.com/product-category/accessories/",
        "https://exquisette.com/product-category/clothes/"
    ];

    // Get all page number links
    links = (await Promise.all(links.map(async (link, i) => {
        const tab = tabs[i];
        await tab.goto(link, {waitUntil: "domcontentloaded"});

        const max_page = parseInt(await tab.evaluate(() => [...document.body.querySelectorAll("a.page-number")].map(ele => ele.textContent.trim()).at(-2)), 10);

        return Array.from({length: max_page}, (_, j) => `${link}page/${j + 1}/`);
    }))).flat();

    // Get all product links
    const product_links = [];
    let link_group;
    while (links.length) {
        link_group = Array.from({length: Math.min(10, links.length)}, () => links.pop());

        await Promise.all(tabs.map(async (tab, i) => {
            if (link_group.length <= i) return null;

            await tab.goto(link_group[i], {waitUntil: "domcontentloaded"});

            product_links.push(...new Set(await tab.evaluate(() => [...document.body.querySelectorAll("div.col-inner div div div a")]
                .flatMap(ele => ele.getAttribute("href").startsWith("https://exquisette.com/") ? [ele.getAttribute("href")] : []))));
        }));
    }

    console.log(product_links);
    console.log(product_links.length);

    if (!dont_show_head) await mf.askQuestion("Press Enter to finish program.");

    await browser.close();
})();