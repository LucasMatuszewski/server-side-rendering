# Server Side Rendering

## ReactDOM
method to render content from react

### 1. render ()
to render content for a browser (traditional React SPA)
Creates instances of a bunch of components and mount them to a DOM node

### 2. renderToString()
Renders a bunch of components one time and produces a string out of all the resulting HTML.
We can use this string to serve it from a server.

## SSR in React is slow...
To make it 70% faster we can fallow this article from Walmart:
https://medium.com/walmartlabs/using-electrode-to-improve-react-server-side-render-performance-by-up-to-70-e43f9494eb8b


# Server configuration:

1. We make an Express server and require React and ReactDOM in it to render Strings/HTML on a server side and send it to a user.

So we will have 2 Express servers (API and Render server) and React app on a client side.

2. We use renderToString(<Component />) with JSX component as an argument.

3. But Node.js don't know what JSX <Component /> is... so we have to make some tool setup and compile JSX with Webpack and Babel to common JS bundle.js file. Like with traditional React app.

4. Create webpack config file: server/webpack.server.js and add new script in package.json to use webpack:
> "dev:build:server": "webpack --config webpack.server.js"

5. Run our script to build a build/bundle.js file and run this file:
> node build/bundle.js

6. on localhost:3000 we will see our Apps HTML code rendered on a server side! (no JS on a client)

7. But it require us to manualy rebuild bundle and restart server every time we change something.

We can add "--watch" to our script to automatically rebuild on file changes:
> "dev:build:server": "webpack --config webpack.server.js --watch"

And use Nodemon to restart a server. Install it on --dev and add new script to package.json:
> "nodemon --watch build --exec \"node build/bundle.js\""
It will watch for changes only in /build directory.
(we can use "nodemon --ignore client/" if we want to ignore files inside /client directory)
By default it will start main file from package.json but with --exec we tell nodemon to run build/bundle.js


## SSR vs Universal JS vs Isomotphic JS

**Server Side Rendering** - generate HTML on the server and send it to browser

**Universal JavaScript** - the same code runs on the server and the browser

**Isomorphic JS** - --||-- quite the same as universal JS.

Now, on Server, we use ES5 Modules (require()) and ES6 (import ... from ...) on client.
So it's not Universal/Isomorphic JS (not the same code for browser and for server).

Node prefer ES5 syntax. But we use Webpack already. So we can use ES6 on a server too. Webpack will change it to ES5. We will change it in our server/index.js file.


# Client configuration:

## renderToString() renders plain HTML without JS
If we use some JS in our <Home /> component, like:
```html
<button onClick={() => console.log('Hello')}>Press me!</button>
```
it won't be rendered. RenderToString will send to browser raw HTML:
<button>Press me!</button>

We have to ship down JS content after we ship HTML with SSR. So we need Client React App bundle.

Webpack will create 2 bundles. One for Server App and one for Client App:

1. Create new webpack.client.js file with configuration for a Client.
It's very similar to server configuration so we can copy code and change it.
Target will be browser (default), entry point will be /client/client.js (new file) and output folder will be /public (new folder).

2. Add new script to our package.json to run webpack with this new Client configuration:
> "dev:build:client": "webpack --config webpack.client.js --watch"

3. Add client public/bundle.js to Express SSR server/src/index.js as static directory:
> app.use(express.static('public'));

4. In server/src/index.js in the main route add HTML template with our public/bundle.js included (we don't need to use "/public/" because we have just set it as a static directory, so Express will look there)

5. Browser will first load build/bundle.js (our SSR plain HTML) and after this it will load public/bundle.js (traditional React App) and re-render our App, binding event handlers and updating rendered parts which have changed.
React won't replace HTML code rendered on a server (source code will look the same), but buttons with JS functions will work now.
**hydration** is a name of this process.

6. On Client.js in place of:
```js
ReactDOM.render(<Home />, document.querySelector('#root'))
```
we will use:
```js
ReactDOM.hydrate(<Home />, document.querySelector('#root'))
```


### WebPack and Package.json REFACTOR

1. Make one Babel conf file (webpack.base.js) and import it to Webpack config files.
> Isomorphic JS use the same code style on a server and on client.
> So we should have the same Babel configuration for both.

We will use **WebPack Merge** library for this.


2. Use **npm-run-all** to run 3 scripts in one console.
Add new script to package.json:
> "dev": "npm-run-all --parallel dev:*",

It will run all script which names starts with "dev:" (but don't use multiple ":" in a script name)

**NOTE**
**Concurrently** works IMHO better, because it add [0] number of script on a beginning of each line.
In npm-run-all we don't see which script generate which line.


3. Webpack include in a bundle all dependencies we use in our App. So if we import React or React-dom, webpack will add all code of this libraries to our bundle, making them big.
We want to include React etc. on a Client (bundle we send to a browser).
But we don't need all this code to be included to a Server bundle, because our app have access to this libraries directly on a server. They don't need to be included to a bundle.

We can ignore this libraries in webpack.server.js to make building faster.
We need to require **webpack-node-externals** library to do this.
> // Tell webpack to not add to a bundle any external files from node_modules:
> externals: [webpackNodeExternals()]

It reduced Bundle.js size from 700kB to 4,6kB !!!


## RENDERER refactor:

Our HTML template code and Server Rendered Components will take a lot of place:
```js
app.get('/', (req, res) => {
  const content = renderToString(<Home />); //plain HTML code

  const html = `
    <html>
    <head></head>
      <body>
        <div id="root">${content}</div>
        <script src="bundle.js"></script>
      </body>
    </html>
  `;
});
```

So it's good idea to keep it in separate file. We will cut it from server/src/index.js and put to:
/server/src/helpers/renderer.js

Now in index.js we import this new function in place of importing React etc., and we have only this:
```js
app.get('/', (req, res) => {
  res.send(renderer());
});
```


# ROUTING - Express and React Router

Express will get request from a browser and pass it to React (without any routing, catch all *).
React Router will send response (Server Rendered HTML and bundle.js)

## Traditional React App with Express Server:
1. Request from a browser goes to Express router `app.get('*', ...)
2. Express send a index.html static file (always the same) with link to a bundle.js with React App
3. React App boots up, React **BrowserRouter** looks at URL and renders content relative to URL

## SSR React App with Express Server:
With SSR we use **StaticRouter** on Express Server, and BrowserRouter on a Client (hydrated on a browser)
https://reacttraining.com/react-router/web/api/StaticRouter

1. We will create client/Routes.js file with Component which will map routes. One set of routes.
2. renderer.js use Routes.js with StaticRouter to send index.js and HTML specific to a route
3. client.js use Routes.js to generate a Bundle.js to send to a browser with BrowserRouter



# REDUX with SSR - 4 Challenges:
* Redux needs different configuration and stores on a browser and on a server
* Authentication needs to be handled on server (not only a browser)
* Detect when all initial data load action creators are completed on a server
* Need state rehydration on the browser

Server send initial state with static html, and we have to rehydrate it on browser bundle booting

1. Create a store in Client.js and provide it with thunk middleware to our client App

2. For a Server create new file helpers/createStore.js and create a Store in it.

3. We will NOT import it directly to renderer.js
We need to do this in index.js to detect when all initial data load action creators are completed.
On a server we start to work with a store before we renderToString our App.

4. After some logic done for a store in index.js we can provide a store in renderer.js file.

5. Create /client/actions/index.js for our action creators. Add FETCH_USERS action.

6. Create /client/reducers/userReducer.js for our reducers.

7. Create /client/reducers/index.js to combine all reducers

8. Import reducers/index.js to client/client.js and helpers/createStore.js


## Components - async/await and babel polyfill

1. Create a new component to get users list: components/UsersList.js and add a new route /users

2. When we go to /users route we see error: **regeneratorRuntime is not defined**
When we use async/await (in client/actions/index.js) Babel assume that we have regeneratorRuntime in our environment. But on Server env we don't have it.

3. To fix it we go to import **babel-polyfill** in src/index.js and client/client.js
https://babeljs.io/docs/en/babel-polyfill

4. Now we get List of users rendered, BUT ONLY ON A CLIENT (hydration). It's not from SSR !

This is because renderer.js don't await for data fetching. It renders HTML immediately and send it, without data from action FETCH_USERS.

## Data loading to components before SSRendering

To solve a problem and have complete HTML string from SSR, we will follow most popular SSR approach, and use a little function inside each component, which will wait for response from API:

1. Basing on URL we know what components would have to render (thanks to React-Router-Config library)
2. We call a 'loadData' method in each component, it will wait for response from API
3. After completion of all requests we render data with collected data and send it to a browser.

This approach requires a lot of extra code.