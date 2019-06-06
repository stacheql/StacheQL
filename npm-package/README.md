![stacheql](./demo/src/assets/logo.png)

## StacheQL is a **_fast, lightweight_** server-side Redis caching tool for GraphQL.

`StacheQL` offers exact, subset, and superset query retrieval based on query parameters - a feature that no other GraphQL library offers. With minimal impact to existing applications, you can customize `StacheQL` to suit your app's needs simply by updating the configuration options.

Designed to use a Redis cache, `StacheQL` normalizes queries, evaluates query parameters to determine exact, subset, or superset matches, makes API/database requests as necessary, denormalizes any results returned from the Redis cache, and returns data to your application's frontend.

# Why use StacheQL?

### _StacheQL allows application's to more efficiently utilize cached data whenever possible, decreasing expensive database and API requests._

Every cache offers retrieval of exact matches, `StacheQL` offers:

1. _Subset query retrieval:_ retrieval of a subset of a larger query existing in the cache (ie. retrieving 5 of the top italian restaurants from the cache using a previously cached list of the top 10 italian restaurants, without ever needing to make an API request).

2. _Superset query retrieval:_ retrieval of a larger query than what is currently cached after retrieving what can be utilized from the cache (ie. a query for the top 15 italian restaurants after previously caching a list of the top 10 italian restaurants would result in returning the 10 items from the cache, and the remaining 5 would be retrieved from the API).

# Installation

Install the module from the command line using npm:

```bash
npm install stacheql
```

or by adding `stacheql` to your dependencies in your `package.json` file.

# Getting Started

To get started using `StacheQL` to cache your GraphQL query results:

1. Import `StacheQL` from your node modules.

2. Define a configuration object containing the `cacheExpiration` for your specific application queries (in seconds), the `uniqueVariables` object containing the query parameters from your application that need to remain the same in order for another query to be a subset or superset of a cached query, the `offset` parameter specific to your GraphQL API that allows you to skip API items you already have cached, and the `limit` parameter that will indicate the quantity of query results to be retrieved.

3. Insert `stache.check` middleware, `stache.it` middleware, in StacheQL formatted POST request.

### Basic Setup

```js
const Stache = require("stacheql");

const config = {
  cacheExpiration: 120, // seconds
  uniqueVariables: {
    term: String,
    location: Number,
    radius: Number,
  },
  offset: "offset",
  limit: "limit",
};

const stache = new Stache(config);
```

### Configuration Object Details

```js
const config = {
  cacheExpiration: // time it takes for each cached query to expire (in seconds)
  uniqueVariables: { // for our demo app, the 'term', the 'location', and the 'radius' parameters need to match between queries for them to be considered for subset or superset retrievals
    term: String, // our demo app used the 'term' parameter which is always of type String
    location: Number, // our demo app used the 'location' parameter which is always of type Number
    radius: Number, // our demo app used the 'radius' parameter which is always of type Numer
  },
  offset: 'offset', // for our demo app's API, the 'offset' method was called 'offset'
  limit: 'limit' // for our demo app, the 'limit' parameter was called 'limit'
}
```

### Middleware Insertion & POST Request Formatting

Use the example below to insert the required middleware and slightly alter the typical POST request format.

1. Insert `stache.check` immediately prior to request body. This will check to see whether or not the query being made is a subset, superset, or exact match of a cached query and then fetch from the cache or API/database accordingly.

2. Wrap request body in 'if' statement with `res.locals.httpRequest` conditional with 'else' statement returning `next()`.

3. Insert `res.locals.body` in callback function after request body in order to persist request parameters.

4. Insert `stache.it` middleware immediately after POST request. This will check to see whether not the query was a superset match of a cached query or a new query requiring an API/database request and then prepare it to be returned to the frontend accordingly.

```js
app.post(
  "/api",
  stache.check, //inserted middleware
  (req, res, next) => {
    if (res.locals.httpRequest) {
      // inserted 'if' statement
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
          res.locals.body = body; // inserted variable
          return next();
        }
      );
    } else {
      // inserted 'else' statement
      return next();
    }
  },
  stache.it // inserted middleware
);
```

# Using StacheQL

After completing the above steps `StacheQL` will automatically evaluate and cache all of your application's queries as they pass through the server, allowing API/database requests as required.

## Caching Query Results

After queries are recieved by the server, they are:

1. Evaluated for exact, subset, or superset matches existing in the cache.

2. If `StacheQL` algorithms detect an exact or subset match, results are denormalized and returned directly from the cache.

3. If `StacheQL` algorithms detect a superset query match, the cached match (which is a subset of the larger query being made) is combined with the results retrieved from the subsequent API/database request (which is only made for the remaining number of items not retrieved from the cache, ie. a query for 15 with 10 results already in the cache would have only 5 retrieved from the API). The additional items retrieved from the API/database are then normalized, formatted, and concated onto the results that were already in the cache.

4. If `StacheQL` algorithms determine no matches available in the cache, the API/database request is made for the entire query, and the results are then normalized and cached.

5. Retrieved data is denormalized and sent to the frontend.

Note: Redis cache can be accessed and examined at any time using the command line.

# Issues

If you find an [issue](https://github.com/stacheql/StacheQL/issues) let us know!

# Contributers

[Keith Avila] | [Natalie Klein] | [David Levien] | [Sam Ryoo]

[keith avila]: https://github.com/keithav
[natalie klein]: https://github.com/natalie-klein
[david levien]: https://github.com/dlev01
[sam ryoo]: https://github.com/samryoo
