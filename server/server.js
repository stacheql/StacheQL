const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();
const Stache = require("../stache.js");

const API_URL = "https://api.yelp.com/v3/graphql";
const API_KEY = process.env.ACCESS_TOKEN;

const config = {
  cacheExpiration: 120, // seconds
  uniqueVariables: {
    term: String,
    location: Number,
    radius: Number,
  },
  queryObject: "search",
  queryTypename: "Businesses",
  flexArg: "limit",
  offsetArg: "offset",
};
const stache = new Stache(config, true);

app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:8080",
    optionsSuccessStatus: 200,
  })
);

app.post(
  "/api",
  stache.check,
  (req, res, next) => {
    if (res.locals.httpRequest) {
      request.post(
        {
          url: API_URL,
          method: "POST",
          headers: {
            Authorization: "Bearer " + API_KEY,
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
