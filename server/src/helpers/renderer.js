import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom'; //StaticR for SSR, BrowserR for Client
import { Provider } from 'react-redux';
// import Home from '../client/components/Home'; // It is imported in Router.js
import Routes from '../client/Routes';

// {{}} = in JSX to pass empty object we have to use double curly braces. One to open a script, second for object.
// {req.path} comes from index.js as renderer(req)
// location={req.path} set a static route (it won't change for this request) for a path requested by user
// context is required in StaticRouter.

export default (req, store) => {
  // we get req and store from index.js

  // for http://localhost:3000/route/test?variable=data
  // console.log('req.url: ' + req.url); // = /route/test?variable=data
  // console.log('req.path: ' + req.path); // = /route/test

  const content = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.path} context={{}}>
        <Routes />
      </StaticRouter>
    </Provider>
  ); // renders plain HTML code

  return `
    <html>
    <head></head>
      <body>
        <div id="root">${content}</div>
        <script src="bundle.js"></script>
      </body>
    </html>
  `;
};
