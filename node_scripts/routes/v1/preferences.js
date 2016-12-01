var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var router = express.Router();

router.post('/login',function(req, res, next){
    console.log("drin login");
    var userName = req.body.user_name;
    var password = req.body.password;
    if(userName && password){
        database.user.getByNameAndPassword(userName,password,function(err, user){
            if(!err){
                // wenn user valide, dann stehen seine daten im result
                if(user.user_name && user.password){
                    res.json({login:true})
                }else{
                    helper.sendResponse(res,error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }

});

router.post('/register', function(req, res, next) {
    console.log("drin register");
    var userName = req.body.user_name;
    var password = req.body.password;
    if(userName && password){
        database.user.save(userName,password,function(err, result){
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

module.exports = router;