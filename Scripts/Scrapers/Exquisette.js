const puppeteer = require("../Puppeteer/node_modules/puppeteer");
const mf = require("../Functions/My_functions");
const fs = require("fs");

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
        await tab.waitForSelector("a.page-number");

        const max_page = parseInt(await tab.evaluate(() => [...document.body.querySelectorAll("a.page-number")].map(ele => ele.textContent.trim()).at(-2)), 10);

        return Array.from({length: max_page}, (_, j) => `${link}page/${j + 1}/`);
    }))).flat();

    let link_group;

    // Get all product links
    const product_links = [];
    while (links.length) {
        link_group = Array.from({length: Math.min(10, links.length)}, () => links.pop());

        await Promise.all(tabs.map(async (tab, i) => {
            if (link_group.length <= i) return;

            const splitted_link = link_group[i].split('/'),
                category = splitted_link.at(-4),
                page = splitted_link.at(-2);
            
            await tab.goto(link_group[i], {waitUntil: "domcontentloaded"});
            await tab.waitForSelector("div.col-inner div div div a");

            product_links.push(...new Set(
                (await tab.evaluate(() => [...document.body.querySelectorAll("div.col-inner div div div a")]
                    .flatMap(ele => ele.getAttribute("href").startsWith("https://exquisette.com/") ? [ele.getAttribute("href")] : [])))
                    .map(lnk => lnk + '||' + category + '||' + page)
            ));
        }));
    }

    // Initialize an empty CSV
    fs.writeFileSync(
        "../../Data/Exquisette.csv",
        "Product_name,Brand,Images,Original_price,Sale_price,SKU,Short_description,Short_description_img,Long_description,Category,Page,Source_link",
        'utf-8'
    );

    // Record links that failed to load
    fs.writeFileSync(
        "../../Data/Failed_Exquisette.txt",
        "Here are the product links from Exquisette that failed:",
        'utf-8'
    );

    mf.rotateTabs(tabs, 500); // Some tabs need to be in front to fully load

    let link_done = 0; // Keep track of how many links have been scraped
    // Go into each product link and scrape
    while (product_links.length) {
        link_group = Array.from({length: Math.min(10, product_links.length)}, () => product_links.pop());

        await Promise.all(tabs.map(async (tab, i) => {
            const [link, category, page] = link_group[i].split('||');

            try {await tab.goto(link, {waitUntil: "domcontentloaded"})} catch (e1) {
                console.error(e1.message, "- Attempt 1 failed, link:", link);
                try {await tab.goto(link, {waitUntil: "networkidle2"})} catch (e2) {
                    console.error(e2.message, "- Attempt 2 failed, link:", link);
                    fs.appendFileSync("../../Data/Failed_Exquisette.txt", `\n${link}`, 'utf-8');
                    return;
                }
            }

            await tab.waitForSelector("div.flickity-slider"); // This element can only appear when set as front tab

            const product_name = await tab.evaluate(() => {
                try {return document.body.querySelector("h1.product-title.product_title.entry-title").textContent.trim()} catch (e) {
                    console.error(e.message, "- Product name not found.");
                    return '';
                }
            });

            const brand = await tab.evaluate(() => {
                try {return document.body.querySelector("div.pwb-single-product-brands.pwb-clearfix a").textContent.trim()} catch (e) {
                    console.error(e.message, "- Brand not found.");
                    return '';
                }
            });

            const slider_imgs = await tab.evaluate(() => {
                try {return [...document.body.querySelector("div.flickity-slider").querySelectorAll("div a img")].map(ele => ele.getAttribute("src"))} catch (e) {
                    console.error(e.message, "- Can't find slider images.");
                    return [];
                }
            });

            const prices = await tab.evaluate(() => {
                try {return [...document.body.querySelector("div.price-wrapper").querySelectorAll("span.woocommerce-Price-amount.amount bdi")].map(ele => ele.textContent.trim())} catch (e) {
                    console.error(e.message, "- Prices not found.");
                    return [];
                }
            });

            const sku = await tab.evaluate(() => {
                try {return document.body.querySelector("span.sku").textContent.trim()} catch (e) {
                    console.error(e.message, "- SKU not found.");
                    return '';
                }
            });

            const [short_des, short_img] = await tab.evaluate(() => {
                const short_des_ele = document.body.querySelector("div.product-short-description");
                let des = '', img = '';
                try {
                    des = [...short_des_ele.children]
                        .map(ele => ele.textContent.replace(/<img[^>]*>/g, '').replaceAll('\n', ';').trim())
                        .filter(Boolean)
                        .join(';');
                } catch (e) {console.error(e.message, "- No short description.")}
                try {img = short_des_ele.querySelector("img").getAttribute("data-src")} catch (e) {console.error(e.message, "- No image in short description.")}
                return [des, img];
            });

            const long_des = await tab.evaluate(() => {
                try {
                    return [...document.body.querySelector("div.woocommerce-Tabs-panel woocommerce-Tabs-panel--description panel entry-content active".replaceAll(' ', '.')).children]
                        .map(child => child.tagName === "UL" ? [...child.children].map(el => el.textContent.trim()).join(';') : child.textContent.trim())
                        .join(';');
                } catch (e) {
                    console.error(e.message, "- No long description.");
                    return '';
                }
            });

            //Product_name,Brand,Images,Original_price,Sale_price,SKU,Short_description,Short_description_img,Long_description,Category,Page,Source_link
            fs.appendFileSync(
                "../../Data/Exquisette.csv",
                '\n' + [
                    product_name,
                    brand,
                    slider_imgs.join(';'),
                    '$' + prices.length ? prices[0] : '',
                    '$' + prices.length === 2 ? prices[1] : '',
                    sku,
                    short_des,
                    short_img,
                    long_des,
                    category,
                    page,
                    link
                ].map(mf.escapeCSV).join(),
                'utf-8'
            )

            link_done++;
        }));

        console.log(`Progress: ${link_done} links finished.`);
    }

    if (!dont_show_head) await mf.askQuestion("Press Enter to finish program.");

    await browser.close();
})();