
var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var async = require('async');
var router = express.Router();

router.post('/', function(req, res, next) {
    var userId = req.callingUserId;
    var newRegistrationId = req.body.registration_id;

    function getAvailableRegistrationIds(callback){
        if (!isNaN(userId)){
            database.registrationId.getListByUserId(userId,function(err, result){
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

    async.waterfall([getAvailableRegistrationIds],function (err, availableRegistratinIds){
        if (isNewRegistrationIdValid(newRegistrationId,availableRegistratinIds)) {
            database.registrationId.save(newRegistrationId, userId, function (err, result) {
                if(!err) {
                    res.json(result);
                } else {
                    helper.sendResponse(res,err);
                }
            });
        }else{
            //No Content und kein error, da es kein Fehler vom Client war die Id zu senden
            helper.sendResponse(res,helper.getNoContentResponse());
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