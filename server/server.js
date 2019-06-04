const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
// const Redis = require("ioredis");
// const redis = new Redis();
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
    // ***SUPERSET ROUTE***
    if (res.locals.subset && res.locals.offset) {
      console.log(
        `*** SUPERSET ROUTE: fetching ${req.body.variables.limit -
          res.locals.offset} add'l results ***`
      );
      req.body.variables.offset = res.locals.offset;
      req.body.variables.limit = req.body.variables.limit - res.locals.offset;
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
          res.locals.superset = Object.assign(
            {},
            res.locals.subset,
            stache.offsetKeys(stache.normalize(body), res.locals.offset)
          );
          return next();
        }
      );
    }
    // ***SUBSET ROUTE***
    else if (res.locals.subset) {
      console.log(
        `*** SUBSET ROUTE: fetching ${
          req.body.variables.limit
        } cached results ***`
      );
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.subset = stache.denormalize(res.locals.subset);
      res.locals.subset.data.search.total = Date.now() - res.locals.start; // for timer
      return res.send(res.locals.subset);
      // ***NO MATCH ROUTE***
    } else {
      console.log(
        `*** NO MATCH: fetching ${req.body.variables.limit} results ***`
      );
      req.body.variables.offset = 0; // need to initialize offset for any API request, since it's part of the query in the gql
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
          next();
        }
      );
    }
  },
  stache.it
);

app.listen(3020);
