const Redis = require("ioredis");
const redis = new Redis();

class Stache {
  constructor(config, supersets = true) {
    this.it = this.it.bind(this);
    this.stage = this.stage.bind(this);
    this.check = this.check.bind(this);
    this.makeQueryString = this.makeQueryString.bind(this);
    this.config = config;
    this.supersets = supersets;
  }

  denormalize(object) {
    const newObj = {};
    for (let key in object) {
      let workingObj = newObj;
      let path = key.split(".");
      for (let i = 1; i < path.length; i += 1) {
        const e = path[i];
        if (i === path.length - 1) workingObj[e] = object[key];
        if (!workingObj[e]) {
          if (Number(path[i + 1]) || Number(path[i + 1]) === 0) {
            workingObj[e] = [];
          } else workingObj[e] = {};
        }
        workingObj = workingObj[e];
      }
    }
    return newObj;
  }

  normalize(object) {
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
  }

  offsetKeys(object, offset) {
    let newObj = {};
    for (let key in object) {
      let path = key.split(".");
      if (path[4]) {
        path[4] = +path[4] + offset;
        newObj[path.join(".")] = object[key];
      }
    }
    return newObj;
  }

  makeQueryString(variables, req) {
    let queryString = "";
    for (let key in variables) {
      let stringy = "req.body.variables.".concat(key);
      queryString = queryString.concat(eval(stringy));
    }
    return queryString.toLowerCase();
  }

  check(req, res, next) {
    console.log("\n");
    res.locals.query = this.makeQueryString(this.config.staticArgs, req);
    res.locals.start = Date.now();
    redis.get(res.locals.query, (err, result) => {
      if (err) {
        console.log("~~ERROR~~ in redis.get: ", err);
      } else if (result) {
        let parsedResult = JSON.parse(result);
        // ***EXACT MATCH***
        if (
          parsedResult[`.data.${this.config.queryObject}.count`] ===
          req.body.variables[this.config.flexArg]
        ) {
          parsedResult[".data.search.total"] = Date.now() - res.locals.start;
          console.log(
            `*** EXACT: ${
              req.body.variables[this.config.flexArg]
            } from cache ***`
          );
          console.log(
            `Returned from cache: ${Date.now() - res.locals.start} ms`
          );
          return res.send(this.denormalize(parsedResult));
          // ***SUBSET MATCH***
        } else {
          res.locals.subset = {};
          res.locals.subset[
            `.data.${this.config.queryObject}.__typename`
          ] = this.config.queryTypename;
          let max = 0;
          for (let key in parsedResult) {
            let path = key.split(".");
            if (path[4] && +path[4] < req.body.variables[this.config.flexArg]) {
              if (+path[4] > max) max = +path[4];
              res.locals.subset[key] = parsedResult[key];
            }
          }
          if (req.body.variables[this.config.flexArg] > max + 1)
            res.locals.offset = max + 1; // init res.locals.offset means we have a superset
        }
      }
      this.stage(req, res, next);
    });
  }

  stage(req, res, next) {
    // ***SUBSET ROUTE***
    if (res.locals.subset && !res.locals.offset) {
      console.log(
        `*** SUBSET: get ${
          req.body.variables[this.config.flexArg]
        } from cache ***`
      );
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.subset = this.denormalize(res.locals.subset);
      res.locals.subset.data.search.total = Date.now() - res.locals.start;
      return res.send(res.locals.subset);
    }
    // ***SUPERSET ROUTE***
    else if (res.locals.subset && res.locals.offset && this.supersets) {
      console.log(
        `*** SUPERSET: fetch ${req.body.variables[this.config.flexArg] -
          res.locals.offset} add'l ***`
      );
      req.body.variables[this.config.offsetArg] = res.locals.offset;
      req.body.variables[this.config.flexArg] =
        req.body.variables[this.config.flexArg] - res.locals.offset;
      return next();
      // ***NO MATCH ROUTE***
    } else {
      console.log(
        `*** NO MATCH: fetch ${req.body.variables[this.config.flexArg]} ***`
      );
      req.body.variables[this.config.offsetArg] = 0;
      return next();
    }
  }

  it(req, res) {
    let normalized;
    // ***SUPERSET ROUTE***
    if (res.locals.subset && res.locals.offset && this.supersets) {
      res.locals.superset = Object.assign(
        {},
        res.locals.subset,
        this.offsetKeys(this.normalize(res.locals.body), res.locals.offset)
      );
      normalized = res.locals.superset;
      normalized[`.data.${this.config.queryObject}.count`] =
        req.body.variables[this.config.flexArg] +
        req.body.variables[this.config.offsetArg];
      res.locals.superset = this.denormalize(res.locals.superset);
      res.locals.superset.data.search.total = Date.now() - res.locals.start;
      res.send(res.locals.superset);
    }
    // ***NO MATCH ROUTE***
    else {
      res.locals.body.data.search.total = Date.now() - res.locals.start;
      normalized = this.normalize(res.locals.body);
      normalized[`.data.${this.config.queryObject}.count`] =
        req.body.variables[this.config.flexArg];
      res.send(res.locals.body);
    }
    console.log(`Inserted to Redis: ${Date.now() - res.locals.start} ms`);
    redis.set(
      res.locals.query,
      JSON.stringify(normalized),
      "ex",
      this.config.cacheExpiration
    );
  }
}

module.exports = Stache;
