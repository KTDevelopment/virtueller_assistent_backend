var express = require('express');
//var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var error = require('./node_scripts/helper/error');
var helper = require('./node_scripts/helper/helper');
var database = require('./node_scripts/database/mySQL');


var base = require('./node_scripts/routes/base');
var api = require('./node_scripts/routes/api');
var apiV1 = require('./node_scripts/routes/v1/api');
var preferences = require('./node_scripts/routes/v1/preferences');
var users = require('./node_scripts/routes/v1/users');
var registration_ids = require('./node_scripts/routes/v1/registration_ids');
var projects = require('./node_scripts/routes/v1/projects');
var milestones = require('./node_scripts/routes/v1/milestones');

var auth = function (req, res, next) {
    var auth;
    // check whether an autorization header was send
    if (req.headers.authorization) {
        // only accepting basic auth, so:
        // * cut the starting "Basic " from the header
        // * decode the base64 encoded username:password
        // * split the string at the colon
        // -> should result in an array
        auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
        var email = auth[0];
        var password = auth[1];
    }
    if(auth && email && password){
        database.user.getByEmailAndPassword(email,password,function(err, user){
            if(!err){
                // wenn user valide, dann stehen seine daten im result
                if(user.email == email && user.password == password){
                    req.callingUser = {
                        user_id:user.user_id,
                        user_name:user.user_name
                    };
                    next()
                }else{
                    helper.sendResponse(res,error.getUnauthorizedError());
                }
            }else{
                helper.sendResponse(res,error.getUnauthorizedError());
            }
        });
    }else{
        helper.sendResponse(res,error.getUnauthorizedError());
    }
};

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/',base);
app.use('/api',api);
app.use('/api/v1', apiV1);
app.use('/api/v1/preferences',preferences);
app.use('/api/v1/secured',auth);
app.use('/api/v1/secured/users', users);
app.use('/api/v1/secured/registration_ids', registration_ids);
app.use('/api/v1/secured/projects', projects);
app.use('/api/v1/secured/milestones', milestones);

// catch 404 and forward to error handler
app.use('*',function(req, res, next) {

  helper.sendResponse(res,error.getNotFoundError());
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
