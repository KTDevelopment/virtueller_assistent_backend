var express = require('express');
var database = require('./../database/mySQL');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  database.getUser (askdök, function (err, result) {

  })
  res.send('respond with a resource');
});

module.exports = router;
