const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
const sslRedirect = require('./sslRedirect');

const app = express();
 
// connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error);
  });

//Redirect to ssl
app.use(sslRedirect());

// enable CORS
app.use(cors());

// Template engine
app.set('view engine', 'ejs');

// parse incoming request bodies
app.use(bodyParser.json());

// // serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// use the routes defined in routes.js
app.use('/', routes);


module.exports = app;
