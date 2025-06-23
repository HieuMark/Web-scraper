const puppeteer = require("../Puppeteer/node_modules/puppeteer");
const mf = require("../Functions/My_functions");
const fs = require("fs");

(async () => {
    const dont_show_head = "no" === await mf.askQuestion("Do you wanna see the browser? (yes/no) ");
    const scrape_duration = parseInt(await mf.askQuestion("How long do you wanna scrape (in ms)? (Type '-1' for unlimited scraping) "), 10);

    const browser = await puppeteer.launch({headless: dont_show_head});
    const page = (await browser.pages())[0];

    await page.goto("https://a.wsxc.cn/pIzypHS");
    await page.waitForSelector("div.relative.w-1-2");

    await mf.autoScroll(page, scrape_duration); // Scroll to the very end of the page

    fs.writeFileSync(
        "../../Data/Kay_Fashion.csv",
        "Image,Description",
        "utf-8"
    );

    const data = await page.evaluate(() => 
        [...document.querySelectorAll("div.relative.w-1-2")]
            .map(ele => [
                ele.querySelector("img").getAttribute("src"),
                ele.querySelector("div.word-break.ellipsis-two").textContent.trim()
            ])
    );

    data.forEach(([img, des]) => fs.appendFileSync(
        "../../Data/Kay_Fashion.csv",
        `\n${mf.escapeCSV(img)},${mf.escapeCSV(des)}`,
        "utf-8"
    ));

    if (!dont_show_head) await mf.askQuestion("Press Enter to end program.");
    
    await browser.close();
})();