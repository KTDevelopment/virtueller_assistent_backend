var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var async = require('async');
var router = express.Router();


router.get('/', function(req, res, next) {
    database.getUsers(function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.post('/', function(req, res, next) {
    var user = req.body.user;
    database.saveUser(user,function(err,result){
        if(!err){
            res.json(result)
        } else {
            helper.sendResponse(res,err)
        }
    })
});

router.put('/:user_id', function(req, res, next) {
    var userId = req.params.user_id;
    var user_name = req.body.user_name;
    if (!isNaN(userId)){
        database.updateProject(userId,user_name,function(err,result){
            if(!err){
                res.json(result)
            } else {
                helper.sendResponse(res,err)
            }
        })
    } else {
        helper.sendResponse(res,error.getBadRequestError())
    }
});

router.get('/:user_id', function(req, res, next) {
    try {
        var userId = parseInt(req.params.user_id, 10);
    }catch (e){
        helper.sendResponse(res,error.getBadRequestError())
    }
    database.getUserById(userId,function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.delete('/:user_id', function(req, res, next) {
    var userId = req.params.user_id;
    if (!isNaN(userId)) {
        database.deleteProjectById(userId, function (err, result) {
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

// Registration ID

router.post('/:user_id/registration_ids', function(req, res, next) {
    var userId = req.params.user_id;
    var newRegistrationId = req.body.registration_id;

    function getAvailableRegistrationIds(callback){
        if (!isNaN(userId)){
            database.getRegistrationIdsByUserId(userId,function(err,result){
                if(!err) {
                    callback(null,result);
                } else {
                    callback(err,null);
                }
            });
        }else{
            callback(error.getBadRequestError(),null);
        }
    }

    function insertNewIdIfValid(availableRegistratinIds,callback){
        if (isNewRegistrationIdValid(newRegistrationId,availableRegistratinIds)) {
            if (!isNaN(userId)){
                database.saveRegistrationId(newRegistrationId,userId, function (err, result) {
                    if(!err) {
                        callback(null, result);
                    } else {
                        callback(err,null);
                    }
                });
            }else{
                callback(error.getBadRequestError(),null);
            }
        }else{
            //No Content und kein error, da es kein Fehler vom Client war die Id zu senden
            callback(null,helper.getNoContentResponse());
        }
    }

    async.waterfall([getAvailableRegistrationIds,insertNewIdIfValid],function (err, result){
        if (!err){
            helper.sendResponse(res,result);
        }else{
            helper.sendResponse(res,err);
        }
    });
});


/**
 * liefert true wenn newRegistrationId nicht im Array vorhanden ist
 * @param newRegistrationId
 * @param availableRegistratinIds
 * @returns {boolean}
 */
function isNewRegistrationIdValid(newRegistrationId, availableRegistratinIds) {
    // return false wenn neue_id ist in availableIds
    var formattedArray = helper.formateRegistrationIdArray(availableRegistratinIds);
    return !helper.isInArray(formattedArray,newRegistrationId);
}

module.exports = router;
