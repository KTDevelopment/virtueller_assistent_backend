var express = require('express');
var database = require('./../../database/mySQL');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.send('respond with all users');
});

module.exports = router;
