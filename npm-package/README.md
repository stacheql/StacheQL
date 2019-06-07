![stacheql](../demo/src/assets/logo.png)

### Node.js caching middleware for GraphQL queries, using Redis

StacheQL limits roundtrips to the GraphQL API by caching query results, as specified by the `config` object. All matching queries, full or partial, will pull results directly from the Redis cache, and only ping the GraphQL API if needed for additional results.

======================================================================

## Why use StacheQL?

Every cache offers retrieval of exact matches-- StacheQL also offers:

1. _Subset query retrieval:_ For example, retrieving 5 of the top Italian restaurants from the cache using a previously queried/cached list of the top 10 Italian restaurants, obviating the HTTP request to the API.

2. _Superset query retrieval:_ For example, a query for the top 15 Italian restaurants after previously querying/caching a list of the top 10 Italian restaurants would result in returning the 10 items from the cache and pinging the API endpoint for the additional five. Both results would be stitched together and returned to the client, then cached in replacement of the previous subset.

======================================================================

## Installation

```bash
$ npm install stacheql
```

or add `stacheql` to "dependencies" in your `package.json`, then `npm install`.

## Requirements

### Redis

To use StacheQL, you must set up a Redis data store as your cache. Refer to the [documentation](https://redis.io/topics/quickstart) to get started.

StacheQL was written for use with [ioredis](https://github.com/luin/ioredis), a Redis client for Node.js. If you prefer to use a different client, or to configure `ioredis` beyond the `default`, simply make those changes in `stache.js`.

Default configuration in `stache.js`:

```js
const Redis = require("ioredis");
const redis = new Redis();
```

### Express & JSON

StacheQL was written for the [Express](https://expressjs.com/) framework, and its middleware requires that body objects are parsed to JSON. The Express project recommends [body-parser](https://www.npmjs.com/package/body-parser).

For HTTP requests sent to the GraphQL API, StacheQL requires that the request body is sent in JSON, NOT raw GraphQL.

======================================================================

## Setup

```js
const Stache = require("stacheql");
const stache = new Stache(config [, options]);
```

### Sample `config`

```js
const config = {
  cacheExpiration: 120,
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
```

`cacheExpiration`: Time (in seconds) for each query result to persist in the cache.

`staticArgs`: Query parameters in which values must match that of a prior query in order to validate a retrieval from the cache. Under the hood, `staticArgs` are combined to form the keys of the Redis cache. In the `staticArgs` object, the key represents the parameter `name` and the value represents the `type`. Mininum of one required.

`flexArg`: Single query parameter that will determine how many results are returned from the cache. This parameter must be of type `Number`.

`offsetArg`: Single query parameter that allows for an offset in the list of returned query results by a given amount, specifically for superset operations. This parameter must be of type `Number`.

`queryObject`: Name of the query object for your GraphQL API.

`queryTypename`: The `__typename` of that query object.

### Options

A `boolean` value of `false` may be optionally passed as the second argument to disable superset operations. Superset operations combine results from the Redis cache with results from a new HTTP request, thus requiring a smaller response payload from the GraphQL API. This defaults to `true`.

```js
// superset operations ENABLED
const stache = new Stache(config);

// superset operations DISABLED
const stache = new Stache(config, false);
```

======================================================================

## Example Implementation

```js
const stache = new Stache(config);

app.use(bodyParser.json());

app.post(
  "/api",
  stache.check, // StacheQL method
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
        res.locals.body = body; // must assign incoming data to "res.locals.body" and return next()
        return next();
      }
    );
  },
  stache.it // StacheQL method
);
```

### StacheQL Methods

`stache.check`: Evaluates the request body to determine if there is a match on `staticArgs` in the Redis cache. If there is a match, then `flexArg` is used to determine what kind of match: an _exact_ match, a _subset_ match or a _superset_ match. Exact and subset matches immediately return the needed results to the front end, bypassing the HTTP request. If no match or a superset match, the HTTP request is sent for the additional results.

`stache.it`: Handles the incoming data from the HTTP request, stored in `res.locals.body`. For superset matches, the pre-existing subset in the Redis cache is overwritten by the new superset data. Otherwise, a new entry is created.

======================================================================

## Demo App

To see StacheQL in action using Yelp's public GraphQL API, clone this repo and check out the `demo` directory. First, request an API key from [Yelp's Developer Beta](https://www.yelp.com/developers/v3/manage_app) and add a `.env` file to your `demo` directory. In the `.env`, set `ACCESS_TOKEN` equal to your API key. As detailed above, you will also need Redis up and running.

======================================================================

## Issues

If you find an [issue](https://github.com/stacheql/StacheQL/issues), let us know!

# Contributers

[Keith Avila] | [Natalie Klein] | [David Levien] | [Sam Ryoo]

[keith avila]: https://github.com/keithav
[natalie klein]: https://github.com/natalie-klein
[david levien]: https://github.com/dlev01
[sam ryoo]: https://github.com/samryoo
