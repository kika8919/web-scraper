"use strict";
const express = require("express");

const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 3000;

app.use(cors("*"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res, next) => {
  try {
    let { pages } = req.query;
    if (!pages) pages = 1;

    const url = "https://news.ycombinator.com";
    const promises = [];
    for (let i = 1; i <= pages; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(axios.get(`${url}/?p=${i}`));
          }, i * 900);
        })
      );
    }

    let allPageResponses = [];
    Promise.all(promises)
      .then((responses) => {
        for (let response of responses) {
          allPageResponses.push(...extractData(response));
        }
        const organizedData = {
          "0-100": [],
          "101-200": [],
          "201-300": [],
          "301-n": [],
        };

        allPageResponses.forEach((item) => {
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
        fs.writeFileSync(
          outputFileName,
          JSON.stringify(organizedData, null, 2)
        );
        console.log(
          `Data has been scraped and organized. Exported to ${outputFileName}`
        );
      })
      .then(() => {
        res.json({
          status: "success",
          message: "Please check the news_data.json",
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        next(error);
      });
  } catch (err) {
    next(err);
  }
});

const extractData = (response) => {
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
    newsItems[index].comments = commentCount != "" ? parseInt(commentCount) : 0;
  });

  return [...newsItems];
};

app.use((err, req, res, next) => {
  res.status(500);
  res.json({
    status: "error",
    err,
  });
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
