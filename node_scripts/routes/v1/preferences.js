var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var router = express.Router();

router.post('/login',function(req, res, next){
    var userName = req.body.user_name;
    var password = req.body.password;
    database.getUserByNameAndPassword(userName,password,function(err,user){
        if(!err){
            // wenn user valide, dann stehen seine daten im result
            if(user.user_name && user.password){
                res.json({login:true})
            }else{
                res.json({login:false})
            }
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.post('/register', function(req, res, next) {
    var userName = req.body.user_name;
    var password = req.body.password;
    if(userName && password){
        database.saveUser(userName,password,function(err,result){
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