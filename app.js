var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var db = require('./models/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


// async IIFE - Test database connection
(async () => {
  await db.sequelize.sync();
  try {
    await db.sequelize.authenticate();
    console.log('Connection to the database successful!');
  } catch (error) {
    console.error('Error connecting to the database: ', error);
  }
}) ();


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use(function(err, req, res, next) {
  let resStatus, errType, message, view;

  if (err.status === 404) {
    resStatus = err.status;
    errType = 'Page Not Found'
    message = "Sorry! We couldn't find the page you were looking for.";
    view = 'page-not-found';
  } else {
    resStatus = 500;
    errType = 'Server Error';
    message = 'Sorry! There was an unexpected error on the server.';
    view = 'error';
  }

  res.status(resStatus).render(view, { errType, message });
});

module.exports = app;
