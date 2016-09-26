var express = require('express');
var database = require('./../database/mySQL');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('virtueller assistent Backend \n use /api to access api');
});

module.exports = router;