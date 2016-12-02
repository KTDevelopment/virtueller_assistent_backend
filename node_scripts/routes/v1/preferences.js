var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var router = express.Router();

router.post('/login',function(req, res, next){
    var email = req.body.email;
    var password = req.body.password;
    if(email && password){
        database.user.getByEmailAndPassword(email,password,function(err, user){
            if(!err){
                // wenn user valide, dann stehen seine daten im result
                if(user.user_name && user.password){
                    delete user.password;
                    res.json(user)
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
    var userName = req.body.user_name;
    var password = req.body.password;
    var email = req.body.email;
    if(userName && password && email){
        database.user.save(userName,password,email,function(err, result){
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