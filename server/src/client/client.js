// Startup point for a Client App (traditional React App, rendered on a browser after SSR HTML)
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
// import Home from './components/Home'; // it's imported in Routes. We don't need it here any more.
import { BrowserRouter } from 'react-router-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk'; // for asynchronous actions
import { Provider } from 'react-redux';
import Routes from './Routes'; // separate file with routes (same for Client and SSR)
import reducers from './reducers';

// Create store with empty initial state and apply thunk as middleware:
const store = createStore(reducers, {}, applyMiddleware(thunk));

// .render() for traditional React App. .hydrate() for SSR
// ReactDOM.render(<Home />, document.querySelector('#root'));
ReactDOM.hydrate(
  <Provider store={store}>
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  </Provider>,
  document.querySelector('#root')
);
