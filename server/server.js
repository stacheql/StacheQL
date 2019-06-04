const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();
const Stache = require("../stache.js");

const YELP_API_URL = "https://api.yelp.com/v3/graphql";
const YELP_API_KEY = process.env.ACCESS_TOKEN;

const config = {
  cacheExpiration: 120, // seconds
};
const stache = new Stache(config);

app.use(
  cors({
    origin: "http://localhost:8080",
    optionsSuccessStatus: 200,
  })
);

app.use(bodyParser.json());

app.post(
  "/api",
  stache.check,
  (req, res, next) => {
    if (res.locals.httpRequest) {
      request.post(
        {
          url: YELP_API_URL,
          method: "POST",
          headers: {
            Authorization: "Bearer " + YELP_API_KEY,
          },
          json: true,
          body: req.body,
        },
        (err, response, body) => {
          res.locals.body = body;
          return next();
        }
      );
    } else {
      return next();
    }
  },
  stache.it
);

app.listen(3020);
