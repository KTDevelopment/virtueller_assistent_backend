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

// // Registration ID
//
// router.post('/:user_id/registration_ids', function(req, res, next) {
//     var userId = req.params.user_id;
//     var newRegistrationId = req.body.registration_id;
//
//     function getAvailableRegistrationIds(callback){
//         if (!isNaN(userId)){
//             database.user.getListByUserId(userId,function(err, result){
//                 if(!err) {
//                     callback(null,result);
//                 } else {
//                     callback(err,null);
//                 }
//             });
//         }else{
//             callback(error.getBadRequestError(),null);
//         }
//     }
//
//     function insertNewIdIfValid(availableRegistratinIds,callback){
//         if (isNewRegistrationIdValid(newRegistrationId,availableRegistratinIds)) {
//             if (!isNaN(userId)){
//                 database.registrationId.save(newRegistrationId, userId, function (err, result) {
//                     if(!err) {
//                         callback(null, result);
//                     } else {
//                         callback(err,null);
//                     }
//                 });
//             }else{
//                 callback(error.getBadRequestError(),null);
//             }
//         }else{
//             //No Content und kein error, da es kein Fehler vom Client war die Id zu senden
//             callback(null,helper.getNoContentResponse());
//         }
//     }
//
//     async.waterfall([getAvailableRegistrationIds,insertNewIdIfValid],function (err, result){
//         if (!err){
//             res.json(result)
//         }else{
//             helper.sendResponse(res,err);
//         }
//     });
// });
//
// /**
//  * liefert true wenn newRegistrationId nicht im Array vorhanden ist
//  * @param newRegistrationId
//  * @param availableRegistratinIds
//  * @returns {boolean}
//  */
// function isNewRegistrationIdValid(newRegistrationId, availableRegistratinIds) {
//     // return false wenn neue_id ist in availableIds
//     var formattedArray = helper.formateRegistrationIdArray(availableRegistratinIds);
//     return !helper.isInArray(formattedArray,newRegistrationId);
// }

module.exports = router;
