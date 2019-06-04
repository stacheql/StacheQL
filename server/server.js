const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const redis = require("ioredis").createClient(6379, 'stacheql.kbhpb0.0001.usw1.cache.amazonaws.com', {no_ready_check: true});
// const redis = new Redis();

const EXPIRATION = 2 * 60; // seconds
const YELP_API_URL = "https://api.yelp.com/v3/graphql";
const YELP_API_KEY = process.env.ACCESS_TOKEN;
var app = express();

app.use(
  cors({
    origin: "http://localhost:8080",
    optionsSuccessStatus: 200,
  })
);

app.use(bodyParser.json());


const clean = object => {
  let key = Object.values(object);
  let stringed = "";
  for (let i=0; i<key.length-1; i++) {
    if (i === 0) {
      stringed += key[i].toLowerCase();
    } else {
      stringed = stringed + " " + key[i]
    }
  }
  // exist[stringed] = object.limit
  console.log(`** this is inside clean function and this is cleaned result **`);
  console.log(stringed)

  return stringed;
}

const normalize = object => {
  return Object.assign(
    {},
    ...(function flattener(objectBit, path = "") {
      return [].concat(
        ...Object.keys(objectBit).map(key => {
          return typeof objectBit[key] === "object" && objectBit[key] !== null
            ? flattener(objectBit[key], `${path}.${key}`)
            : { [`${path}.${key}`]: objectBit[key] };
        })
      );
    })(object)
  );
};

const denormalize = pathsObject => {
  const payload = {};
  for (let key in pathsObject) {
    let workingObj = payload;
    let path = key.split(".");
    for (let i = 1; i < path.length; i += 1) {
      const e = path[i];
      if (i === path.length - 1) workingObj[e] = pathsObject[key];
      if (!workingObj[e]) {
        if (Number(path[i + 1]) || Number(path[i + 1]) === 0) {
          workingObj[e] = [];
        } else workingObj[e] = {};
      }
      workingObj = workingObj[e];
    }
  }
  return payload;
};

const offsetKeys = (object, offset) => {
  let newObj = {};
  for (let key in object) {
    let path = key.split(".");
    if (path[4]) {
      path[4] = +path[4] + offset;
      newObj[path.join(".")] = object[key];
    }
  }
  return newObj;
};

app.post(
  "/api",
  (req, res, next) => {
    console.log("\n");
    res.locals.query = clean(req.body.variables);
    res.locals.start = Date.now(); // demo timer
    redis.get(res.locals.query, (err, result) => {
      if (err) {
        console.log("~~ERROR~~ in redis.get: ", err); // more error handling?
      } else if (result) {
        let temp = {
          ".data.search.__typename": "Businesses",
        };
        let max = 0;
        for (let key in JSON.parse(result)) {
          let path = key.split(".");
          if (path[4] && +path[4] < req.body.variables.limit) {
            if (+path[4] > max) max = +path[4];
            temp[key] = JSON.parse(result)[key];
          }
        }
        if (req.body.variables.limit > max + 1) res.locals.offset = max + 1; // initializing res.locals.offset will mean that we have a superset
        res.locals.subset = denormalize(temp);
      }
      next();
    });
  },
  (req, res, next) => {
    // ***SUPERSET ROUTE***
    if (res.locals.subset && res.locals.offset) {
      console.log(
        `*** SUPERSET ROUTE: fetching ${req.body.variables.limit -
          res.locals.offset} results ***`
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
          res.locals.body = body;
          res.locals.superset = denormalize(
            Object.assign(
              {},
              normalize(res.locals.subset),
              offsetKeys(normalize(res.locals.body), res.locals.offset)
            )
          );
          return next();
        }
      );
    }
    // ***SUBSET ROUTE***
    else if (res.locals.subset) {
      console.log("***SUBSET ROUTE***");
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.subset.data.search.total = Date.now() - res.locals.start; // for timer
      return res.send(res.locals.subset);
      // ***NO MATCH ROUTE***
    } else {
      console.log(
        `***NO MATCH: fetching ${req.body.variables.limit} results***`
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
  (req, res, next) => {
    let normalized;
    // ***SUPERSET ROUTE***
    if (res.locals.superset) {
      res.locals.superset.data.search.total = Date.now() - res.locals.start; // demo timer
      normalized = JSON.stringify(normalize(res.locals.superset));
      res.send(res.locals.superset);
    }
    // ***NO MATCH ROUTE***
    if (!res.locals.superset) {
      res.locals.body.data.search.total = Date.now() - res.locals.start; // demo timer
      normalized = JSON.stringify(normalize(res.locals.body));
      res.send(res.locals.body);
    }
    console.log(`Inserted to Redis: ${Date.now() - res.locals.start} ms`);
    redis.set(res.locals.query, normalized, "ex", EXPIRATION);
  }
);

app.listen(3020);
