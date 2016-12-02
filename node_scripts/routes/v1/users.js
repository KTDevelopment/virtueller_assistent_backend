var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var async = require('async');
var router = express.Router();


router.get('/', function(req, res, next) {
    database.user.getList(function(err, result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.get('/:user_id_or_user_name', function(req, res, next) {
    var isId;

    if(isNaN(req.params.user_id_or_user_name)){
        var userName = req.params.user_id_or_user_name;
        isId = false;
    }else{
        var userId = parseInt(req.params.user_id_or_user_name, 10);
        isId = true;
    }

    if(isId){
        database.user.getById(userId,function(err, user){
            if(!err){
                res.json(user)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        database.user.getByName(userName,function(err, user){
            if(!err){
                if(user.user_name){
                    res.json(user)
                }else{
                    helper.sendResponse(res,error.getBadRequestError());
                }
            }else{
                helper.sendResponse(res,err)
            }
        })
    }

});

router.delete('/:user_id', function(req, res, next) {

    var userId = req.params.user_id;
    if (!isNaN(userId)) {
        database.user.remove(userId, function (err, result) {
            if (!err) {
                res.json(result)
            } else {
                helper.sendResponse(res, err)
            }
        })
    } else {
        helper.sendResponse(res, error.getBadRequestError())
    }
});

module.exports = router;
