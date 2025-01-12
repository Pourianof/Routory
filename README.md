# Routory

A simple library for routing.
It designed to get used in context other than HTTP routing.
For example i used it to make a connection channel for an Electron app between renderer and main processes.
**_Totally inspired by [Express.js](https://expressjs.com/)_**

# API

Its api is much like Express.js

## Routory

The [Routory] class is the main entry for using routering features.

```js
import Routory from 'routory';

const router = new Routory();
```

## Methods

Just like Express.js, the main 5 HTTP methods(GET, POST, PUT, PATCH, DELETE) got mirrored as method members of Routory class.
So you can register your handlers for intented Methods.

```js
router.get(
  (req, res, next) => {
    // code for handling
    next(); // for executing next handler callback
  },
  (req, res, next) => {
    // code for handling
  },
);
```

You can also define path for each of these methods. It mean the handlers get executed only if the requested path get match with specified path.

```js
router.get('/a/b/c', (req, res, next) => {
  // It get executed only if the specified path is a sub-path of requested path(req.relativePath)
  // like: /a/b/c or /a/b/c/d/e or ...
});
```

### Routory.use

Also there is another handlers registerer method named `use`. Handlers which registered by this method, get executed regardless of requests HTTP-Method.

```js
router.use((req, res, next) => {
  // handle request
});

router.use('/a/b', (req, res, next) => {
  // handle request if requested path is match witch this path
});
```

### Routory.route

With `route` method you can delegate handling a scope of paths to another router. Actually it create new router-type handler and register it to the its router object(the router which `route` method get called).

```js
const eRouter = router.route('/e');
eRouter.get(...).post(...);
```

In this example we delegate each request which recieved from main router and requested the "e" path, to new router named "eRouter".

### Routory.handleErrorGlobally

This method can be used for registering callback handlers for handling the errors which might throw during the routers callbacks executing. It provide some central handling point for exceptions.

```js
router.handleErrorGlobally((err, req, res, next) => {
  // handle it
  next(); // invoke the next callback which registered after this one
});
```

# Routers as a scope

One of the main features of Express.js is the capability of defining routers object for handling specifis paths(scope of router) and then connect them to make a singleton.
For doing that in Routory you can use the `use` method and specify a desired path as a key for entering to that scope.
For example i have a router for handling my api:

```js
// api/index.js
import Routory from 'routory';
// API router
const apiRouter = new Routory();
```

Then i want to use a seperate router for handling requests about my `users` resources. So in another file i define and export the router:

```js
// api/users.js
import Routoury from 'routory';
const usersRouter = new Routory();
...
export default usersRouter;
```

Then back to my `api/index.js` file and import the `usersRouter` and attach it to my api router:

```js
// api/index.js
import usersRouter from './users';
...
apiRouter.use('/users', usersRouter); // Delegate the requests about users to the [usersRouter] router handler
```
