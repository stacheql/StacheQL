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
    origin: "http://localhost:8080",
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

const offsetKeys = (object, offset) => {
  let result = {};
  for (let key in object) {
    let path = key.split(".");
    if (path[4]) {
      path[4] = +path[4] + offset;
      result[path.join(".")] = object[key];
    }
  }
  return result;
};

app.post(
  "/api",
  (req, res, next) => {
    console.log("\n");
    res.locals.query = `${req.body.variables.term.toLowerCase()} ${
      req.body.variables.location
    } ${req.body.variables.radius}`;
    res.locals.start = Date.now(); // for timer
    // below, res.locals.query was JSON.stringify(req.body)
    redis.get(res.locals.query, (err, result) => {
      if (err) {
        console.log("~~ERROR~~ in redis.get: ", err); // will need better error handling
      } else if (result) {
        let temp = {
          // ".data.search.total": 0,
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
        if (req.body.variables.limit > max + 1) res.locals.offset = max + 1;
        // console.log("OFFSET: ", res.locals.offset);
        // res.locals.result = denormalize(JSON.parse(result));
        res.locals.result = denormalize(temp);
      }
      // else {
      //   res.locals.query = res.locals.query;
      // }
      next();
    });
  },
  (req, res, next) => {
    // ***SUPERSET***
    if (res.locals.result && res.locals.offset) {
      console.log("***SUPERSET ROUTE***");
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
          res.locals.combined = denormalize(
            Object.assign(
              {},
              normalize(res.locals.result),
              offsetKeys(normalize(res.locals.body), res.locals.offset)
            )
          );
          console.log("***COMBINED***: ", res.locals.combined);
          return next();
        }
      );
      // console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      // res.locals.result.data.search.total = Date.now() - res.locals.start; // for timer
      // return res.send(res.locals.result);
    }
    // ***SUBSET***
    else if (res.locals.result) {
      console.log("***SUBSET ROUTE***");
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.result.data.search.total = Date.now() - res.locals.start; // for timer
      return res.send(res.locals.result);
    } else {
      console.log("$$ POST REQUEST TO YELP API $$");
      req.body.variables.offset = 0; // need this for any API request, since it's part of the query in the gql
      console.log(req.body.variables);
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
    if (res.locals.combined) {
      res.locals.combined.data.search.total = Date.now() - res.locals.start;
      normalized = JSON.stringify(normalize(res.locals.combined));
      res.send(res.locals.combined);
    }
    if (!res.locals.combined) {
      res.locals.body.data.search.total = Date.now() - res.locals.start; // for demo timer
      normalized = JSON.stringify(normalize(res.locals.body));
      res.send(res.locals.body);
    }
    console.log(`Inserted to Redis: ${Date.now() - res.locals.start} ms`);
    redis.set(res.locals.query, normalized, "ex", EXPIRATION);
  }
);

app.listen(3020);
