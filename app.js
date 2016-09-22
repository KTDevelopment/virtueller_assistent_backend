var express = require('express');
//var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var error = require('./node_scripts/helper/error');


var base = require('./node_scripts/routes/base');
var api = require('./node_scripts/routes/api');
var apiV1 = require('./node_scripts/routes/v1/api');
var users = require('./node_scripts/routes/v1/users');
var projects = require('./node_scripts/routes/v1/projects');

var app = express();

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/',base);
app.use('/api',api);
app.use('/api/v1', apiV1);
app.use('/api/v1/users', users);
app.use('/api/v1/projects', projects);

// catch 404 and forward to error handler
app.use('*',function(req, res, next) {
  var err = error.getNotFoundError();
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.code || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.code || 500);
  res.send({
    message: err.message,
    error: {}
  });
});


module.exports = app;
