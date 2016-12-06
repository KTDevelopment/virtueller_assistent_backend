var express = require('express');
var preferencesHandler = require('./../../route_handlers/preferences_handler');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var router = express.Router();

router.post('/login',function(req, res, next){
    var email = req.body.email;
    var password = req.body.password;
    if(email && password){
        preferencesHandler.login(email,password,function (err, result) {
            if(!err){
                res.json(result)
            } else {
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }

});

router.post('/register', function(req, res, next) {
    var userName = req.body.user_name;
    var password = req.body.password;
    var email = req.body.email;
    if(userName && password && email){
        preferencesHandler.register(userName, password, email,function (err, result) {
            if(!err){
                res.json(result)
            } else {
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError());
    }
});

module.exports = router;