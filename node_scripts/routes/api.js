var express = require('express');
var database = require('./../database/mySQL');
var router = express.Router();


router.get('/', function(req, res, next) {
    res.send('virtueller assistent -- api \n use /v1 to access version 1 of the api');
});

module.exports = router;