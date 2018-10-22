// ES5:
// const express = require('express');
// const React = require('react');
// const renderToString = require('react-dom/server').renderToString;
// const Home = require('./client/components/Home').default;

// ES6 (webpack will change it to ES5 in build/bundle.js):
import 'babel-polyfill';
import express from 'express';
import renderer from './helpers/renderer';
import createStore from './helpers/createStore';

const app = express();

app.use(express.static('public'));

app.get('*', (req, res) => {
  const store = createStore();

  // Some logic to initialize and load data into the store

  res.send(renderer(req, store));
  //pass req to use req.url inside renderer StaticRouter as location={req.url}
});

app.listen(3000, () => {
  console.log('Server listening on: http://localhost:3000');
});
