var express = require('express');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var userHandler = require('./../../route_handlers/user_handler');
var router = express.Router();


router.get('/', function(req, res, next) {
    userHandler.getList(function (err, result) {
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    });
});

router.get('/:user_id_or_user_name', function(req, res, next) {
    //validation is in Handler
    userHandler.getByIdOrName(req.params.user_id_or_user_name,function (err, user) {
        if(!err){
            res.json(user)
        }else{
            helper.sendResponse(res,err)
        }
    });
});

router.delete('/:user_id', function(req, res, next) {
    if(!isNaN(req.params.user_id)){
        userHandler.remove(req.params.user_id,function (err, result) {
            if (!err) {
                res.json(result)
            } else {
                helper.sendResponse(res, err)
            }
        });
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }
});

module.exports = router;
