const express = require("express");
const request = require("request");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const Redis = require("ioredis");
const redis = new Redis();

const EXPIRATION = 2 * 60; // seconds
const YELP_API_URL = "https://api.yelp.com/v3/graphql";
const YELP_API_KEY = process.env.ACCESS_TOKEN;
var app = express();

app.use(
  cors({
    origin: "http://localhost:8888",
    optionsSuccessStatus: 200,
  })
);

app.use(bodyParser.json());

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
      // if we're at the end of the array, we can do the value assignment! yay!!
      if (i === path.length - 1) workingObj[e] = pathsObject[key];
      // only construct a sub-object if one doesn't exist with that name yet
      if (!workingObj[e]) {
        // if the item following this one in path array is a number, this nested object must be an array
        if (Number(path[i + 1]) || Number(path[i + 1]) === 0) {
          workingObj[e] = [];
        } else workingObj[e] = {};
      }
      // dive further into the object
      workingObj = workingObj[e];
    }
  }
  return payload;
};

app.post(
  "/api",
  (req, res, next) => {
    console.log(
      `TERM: ${req.body.variables.term}    LIMIT: ${req.body.variables.limit}`
    );
    res.locals.start = Date.now(); // for timer
    redis.get(JSON.stringify(req.body), (err, result) => {
      if (err) {
        console.log("~~ERROR~~ in redis.get: ", err); // will need better error handling
      } else if (result) {
        res.locals.result = denormalize(JSON.parse(result));
      } else {
        res.locals.query = JSON.stringify(req.body);
      }
      next();
    });
  },
  (req, res, next) => {
    if (res.locals.result) {
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.result.data.search.total = Date.now() - res.locals.start; // for timer
      return res.send(res.locals.result);
    } else {
      console.log("$$ POST REQUEST TO YELP API $$");
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
          res.locals.body = body; // before norm-denorm, right side was JSON.stringify(body)
          // res.locals.result = body; // not necessary if willing to overwrite the 'total' inserted to Redis
          // res.send(res.locals.result); // moved below for norm-denorm
          next();
        }
      );
    }
  },
  (req, res, next) => {
    console.log(`Inserted to Redis: ${Date.now() - res.locals.start} ms`);
    res.locals.body.data.search.total = Date.now() - res.locals.start; // for timer feature
    let normalized = JSON.stringify(normalize(res.locals.body)); // norm-denorm
    res.send(res.locals.body); // before norm-denorm, this was up in HTTP request
    redis.set(res.locals.query, normalized, "ex", EXPIRATION); // before norm-denorm, 'normalized' was res.locals.body
  }
);

app.listen(3020);
