const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const url = "https://news.ycombinator.com";
axios
  .get(url)
  .then((response) => {
    const html = response.data;

    const $ = cheerio.load(html);

    const newsItems = [];
    $("tr.athing").each((index, element) => {
      const title = $(element).find(".titleline").text().trim();
      newsItems.push({ title });
    });

    $("td .subtext").each((index, element) => {
      const commentCount = $(element)
        .find('a:contains("comment")')
        .text()
        .trim()
        .replace(/\D/g, "");
      newsItems[index].comments =
        commentCount != "" ? parseInt(commentCount) : 0;
    });

    const organizedData = {
      "0-100": [],
      "101-200": [],
      "201-300": [],
      "301-n": [],
    };

    newsItems.forEach((item) => {
      const commentCount = parseInt(item.comments, 10);

      if (commentCount >= 0 && commentCount <= 100) {
        organizedData["0-100"].push(item);
      } else if (commentCount <= 200) {
        organizedData["101-200"].push(item);
      } else if (commentCount <= 300) {
        organizedData["201-300"].push(item);
      } else {
        organizedData["301-n"].push(item);
      }
    });

    const outputFileName = "news_data.json";
    fs.writeFileSync(outputFileName, JSON.stringify(organizedData, null, 2));
    console.log(
      `Data has been scraped and organized. Exported to ${outputFileName}`
    );
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
