const Redis = require("ioredis");
const redis = new Redis();

class Stache {
  constructor(config) {
    this.it = this.it.bind(this);
    this.stage = this.stage.bind(this);
    this.check = this.check.bind(this);
    this.makeQueryString = this.makeQueryString.bind(this);
    this.config = config;
    this.clean = this.clean.bind(this);
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

<<<<<<< HEAD
  clean (object) {
    let key = Object.values(object);
    let stringed = "";
    
    for (let i=0; i<key.length-1; i++) {
      if (i === 0) {
        stringed += key[i].toLowerCase();
      } else {
        stringed = stringed + " " + key[i]
      }
    }
    console.log(`** this is inside clean function and this is cleaned result **`);
    console.log(stringed)
  
    return stringed;
=======
  makeQueryString(variables, req) {
    let queryString = "";
    for (let key in variables) {
      let stringy = "req.body.variables.".concat(key);
      queryString = queryString.concat(eval(stringy));
    }
    return queryString.toLowerCase();
>>>>>>> e688f5ef6b5aea0d55068b28082ee494357f1116
  }

  check(req, res, next) {
    console.log("\n");
<<<<<<< HEAD
    // variables is a key that is set in our vue js file
    res.locals.query = this.clean(req.body.variables);
=======
    res.locals.query = this.makeQueryString(this.config.uniqueVariables, req);
>>>>>>> e688f5ef6b5aea0d55068b28082ee494357f1116
    res.locals.start = Date.now(); // demo timer
    redis.get(res.locals.query, (err, result) => {
      if (err) {
        console.log("~~ERROR~~ in redis.get: ", err); // more error handling?
      } else if (result) {
        res.locals.subset = {
          ".data.search.__typename": "Businesses",
        };
        let max = 0;
        let arrayed = Object.keys(JSON.parse(result))
        let last = arrayed[arrayed.length-2].split(".");
        let foured = last[4];
        // console.log("this should be foured");
        // console.log(foured);
        
        
        // console.log("this should be last arrayed");
        // console.log(arrayed[arrayed.length-2]);
        for (let key in JSON.parse(result)) {
          let path = key.split(".");
          // console.log("this is path");
          // console.log(path);
          if (path[4] && +path[4] < req.body.variables.limit) {
            if (+path[4] > max) max = +path[4];
            res.locals.subset[key] = JSON.parse(result)[key];
            console.log("this is res.locals.subset[key]")
            console.log(res.locals.subset[key])
          }
        }
        if (req.body.variables.limit > max + 1) res.locals.offset = max + 1; // initializing res.locals.offset will mean that we have a superset
      }
      this.stage(req, res, next);
    });
  }

  stage(req, res, next) {
    // ***SUBSET ROUTE***
    if (res.locals.subset && !res.locals.offset) {
      console.log(`*** SUBSET: get ${req.body.variables.limit} from cache ***`);
      console.log(`Returned from cache: ${Date.now() - res.locals.start} ms`);
      res.locals.subset = this.denormalize(res.locals.subset);
      res.locals.subset.data.search.total = Date.now() - res.locals.start; // for timer
      return res.send(res.locals.subset);
    }
    // ***SUPERSET ROUTE***
    else if (res.locals.subset && res.locals.offset) {
      console.log(
        `*** SUPERSET: fetch ${req.body.variables.limit -
          res.locals.offset} add'l ***`
      );
      req.body.variables.offset = res.locals.offset;
      req.body.variables.limit = req.body.variables.limit - res.locals.offset;
      res.locals.httpRequest = true;
      next();
      // ***NO MATCH ROUTE***
    } else {
      console.log(`*** NO MATCH: fetch ${req.body.variables.limit} ***`);
      req.body.variables.offset = 0; // need to initialize offset for any API request
      res.locals.httpRequest = true;
      next();
    }
  }

  it(req, res) {
    let normalized;
    // ***SUPERSET ROUTE***
    if (res.locals.subset && res.locals.offset) {
      res.locals.superset = Object.assign(
        {},
        res.locals.subset,
        this.offsetKeys(this.normalize(res.locals.body), res.locals.offset)
      );
      normalized = JSON.stringify(res.locals.superset);
      res.locals.superset = this.denormalize(res.locals.superset);
      res.locals.superset.data.search.total = Date.now() - res.locals.start; // demo timer
      res.send(res.locals.superset);
    }
    // ***NO MATCH ROUTE***
    else {
      res.locals.body.data.search.total = Date.now() - res.locals.start; // demo timer
      normalized = JSON.stringify(this.normalize(res.locals.body));
      res.send(res.locals.body);
    }
    console.log(`Inserted to Redis: ${Date.now() - res.locals.start} ms`);
    redis.set(res.locals.query, normalized, "ex", this.config.cacheExpiration);
  }
}

module.exports = Stache;
