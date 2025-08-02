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

At update `0.2.0` the HTTP-Methods had removed from the routory class and all they located at a seperate class named HTTPRoutory class.(For more information about this class see [This section](#httproutory))

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
eRouter.methName1(...).methName2(...);
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

### **User-Defined methods**

I tried to make it possible to define arbitrary method names for registering handlers and also extending the router structure by creating sub-routers and attach them to upper routers.
To upcoming with these two problems, I came to the conclusion that it was necessary to write a new class which extending `Routory` class.
The process is straightforward so i suggest two solution:

#### Using code generator

I provided a script which help you to generate the code needed for the class and also it populate the class with intented methods.
The way how you can work with this generator described in **[Code generator](#Bin)**.

#### Extending `Routory` class

Also you can extend the `Routory` class yourself and use that class as your router instead of my classes.
For doing that these is some points you should notice:

1. **Class declaration:**
   When you extending `Routory` class you should pass your class as generic type to `Routory` class. it needed for some methods in `Routory` class to define the return type as your class type.

```js
class YourClassName extends Routory<YourClassName> {
    constructor(){
        super(new YourClassFactory());
    }
    // body
}

class YourClassFactory implements RouterFactory<any, any, YourClassName>{
    create(){
        return new YourClassName();
    }
}
```

Also as you can see, you have to define a factory class which has a `create` method which return your router class(`YourClassName`). And then you must instantiate this factory class and pass it to super class.
You could use a literal object with `create` method too, like: `{ create: ()=> new YourClassName()  }`.

2. **Method definition:**
   At your `YourClassName` class you should:
   If you are using **_Typescript_** then for each method should have:

```ts
methodName(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback[]
): HTTPRoutory;
methodName(...routerHandler: RouteHandlerCallback[]): YourClassName;
methodName(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, "YOUR_MATCHER_STRING");
}
```

And if **_JavaScript_** the you should have:

```js
methodName(p, ...r) {
    return this._delegatingPathParsing(p, r, RequestMethods.GET);
}
```

There is some placeholder in above snnipets:
`YourClassName`: Name for the router class. For example HTTPRoutory, MyRouter or any name you want
`methodName`: Name for methods. For example for HTTPRoutory we have `get`, `post` and so on. You can choose any naem you want.
`"YOUR_MATCHER_STRING"`: This one is important in the way that it gonna to used for parsing the request objects `method` propery, so it must be different from the ones in other methods. For example this string for `HTTPRoutory.get` defined as `"GET"` or for `HTTPRoutory.post` is `"POST"` and other. It could be any string as long as it different from other methods.

## HTTPRoutory

As mentioned above, we moved the HTTP-base method names like get, post, ... from `Routory` class to `HTTPRoutory`.
Just like Express.js, the main 5 HTTP methods(GET, POST, PUT, PATCH, DELETE) got mirrored as method members of `HTTPRoutory` class.
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

# Handle the input requests

For handling the input requests, it should be convert to `RouterMessage` format and then pass to the root router using `.onMessage` method.

```js
function passRequestToRouter(inputRequest) {
  const message = {
    method: inputRequest.desiredMethod,
    url: inputRequest.url,
    data: inputRequest.body,
  };

  router.onMessage(message, {});
}
```

> The message data will be accessible through `RouterRequest.body`

With `onMessage` method the router begin to parse the url parameter and execute the matching handlers and forward the request to sub-routers.

This method provide a request(`RouterRequest`) and respond(`RouterRespond`) objects and then flows them on handlers, means that they forward to next matching handlers(callbacks or sub-routers callbacks) without replacing with new instances.

This method return the instantiated `RouterRespond` object. This object can be used to wait for the response to be ready and thus complete the response process. `RouterRespond` is a Promise-like object with `then` method which could be used in `await` syntax. There are 3 ways to wait for the response data to be provided by the router handlers:

```js
const respond = router.onMessage(message, {});
// 1. with [onRespond]
respond.onRespond((response) => {
  // Format is like :
  // {
  //   status: { code: number, message: string }
  //   data: any
  // }
});

// 2. with [then] method
roespond.then((response) => {
  /* handle */
});

// 3. with [onRespond] method
const response = await respond;
// handle response
```

A `RouterRespond` object moves to "Ready" state when any data get passed to it using `send` or `json` methods. And when it happened, it not possible to recall the `send` or `json` methods and if do so, it will throw an exception.

```js
router.methName('/users', (req, res, next) => {
  res.json([
    // all users
  ]);
});
```

- `json`: It tries to stringify the passed data as json format
- `send`: It expose the data as it raw format

# Path strucure

As indicated before, we can specify paths in some contexts which it cause the request object routed to the correct handlers. We can use some structure in paths which could help to genaralize or parameterize the path.
In this context `path-part` refer to the string between two slash(/) in path. For example in path "/a/b/c/d" the path-parts are: [a, b, c, d]

## Parameters in path

We can define the path-part as parameter. In this case this path-part can match with any string and the matched part will save as parameter to request object. The params in path will save in `params` property of `RouterRequest`.
In Routory, a param is define when the path-part get start with color(:) character. Like "/a/:par1/c", which "par1" will be param and when some input request with path like "/a/some-str/c" get recieved, then a map of "par1" to "some-str" will save in `RouterRequst` object.
For example:

```js
router.methName1(
    '/a/param-1/b'
    (req, res, next)=>{
        // the param is accessible through req.params["param-1"]
        console.log(req.params["param-1"]); // it log : some-value
    }
);

router.onMessage({
    ...
    url: "/a/some-value/c"
}, {})
```

# Context objcet

We can pass a second object to `onMessage` method as **Context object**.
The purpose of this object is to flow an object across with `RouterRequest` object through handlers. Actually it can contains some data or helpers functionalities which can be accessible from all handlers.For example you may wanna make the database wrapper be accessible or some variable data or ..

```js
router.get(somePath, async (req, res, next) => {
  const users = await req.context.db.getUsers(req.body);
});

router.onMessage(message, { db: dbConnection, utils: helperFunctions });
```

# Code generator <a id="Bin"></a>

As mentioned before, we provide some code generator script for generate the code for defining your router classes. Actually this script automate the process defined in [This section](#extending-routory-class).

For using the code generator you could use this syntax

> npx routory [options]

The options are used to providing the configuration for defining class and methods and also the path of output file.
The configurations could be provided in two way: 1- CLI arguments 2- json file
In both ways, you have to provide the following configs.

1. Define the class:

CLI:

> npx routory -c YourClassName

JSON:

```json
{
  "className": "YourClassName"
}
```

2. Define Methods:

CLI:

> npx routory -m methName1:Method_Matcher+methName2:Method_Matcher2+...

The format is obvious. The method name + colo + The matcher string for that method.
Then this could be repeated by plus character.

JSON:

```json
{
  "methods":{
    "methName1": "Method_Matcher1",
    "methName2": "Method_Matcher2",
    ...
  }
}
```

3. Output path:

CLI:

> npx routory -o ./src/myRouter.ts

JSON:

```json
{
  "output": "./src/myRouter.ts"
}
```

## Examples

CLI:

> npx routory -c HTTPRoutory -m get:GET+post:POST+delete:DELETE -o ./src

JSON:

```json
{
  "className": "ExampleHTTPRoutory",
  "methods": {
    "get": "GET",
    "post": "POST",
    "delete": "DELETE",
    "put": "PUT",
    "patch": "PATCH"
  },
  "outFilePath": "./src"
}
```

# Change logs

`0.4.0` Fix the bug which caused same handler executed multiple times in some cases with each request that reach to that handler
