const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const app = express();
const Stache = require("../stache.js");
// const Stache = require("stacheql");

const API_URL = "https://api.yelp.com/v3/graphql";
const API_KEY = process.env.ACCESS_TOKEN;

const config = {
  cacheExpiration: 120, // seconds
  staticArgs: {
    term: String,
    location: Number,
    radius: Number,
  },
  flexArg: "limit",
  offsetArg: "offset",
  queryObject: "search",
  queryTypename: "Businesses",
};

const stache = new Stache(config);

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
  },
  stache.it
);

app.listen(3020);
