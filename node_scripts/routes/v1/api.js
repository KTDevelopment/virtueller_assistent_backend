var express = require('express');
var database = require('./../../database/mySQL');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('virtueller assistent - api/v1 \n welcome to version 1 of the RESTful API \n use /projects access all projects \n ...');
});

module.exports = router;
