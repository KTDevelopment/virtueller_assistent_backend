var database = require('./../database/mySQL');
var helper = require('./../helper/helper');
var async = require('async');

var registrationIdHandler={};

registrationIdHandler.save = function (registrationId, callingUser, callback) {
    var userId = callingUser.user_id;

    function getAvailableRegistrationIds(callback){
        database.registrationId.getListByUserId(userId,function(err, result){
            if(!err) {
                callback(null,result);
            } else {
                callback(err,null);
            }
        });
    }

    async.waterfall([getAvailableRegistrationIds],function (err, availableRegistratinIds){
        if (!isRegistrationIdAlreadySaved(registrationId,availableRegistratinIds)) {
            database.registrationId.save(registrationId, userId, function (err, result) {
                if(!err) {
                    callback(null,result);
                } else {
                    callback(err,null);
                }
            });
        }else{
            //No Content und kein error, da es kein Fehler vom Client war die Id zu senden
            callback(null,helper.getNoContentResponse());
        }
    });
};

/**
 * liefert true wenn newRegistrationId im Array vorhanden ist
 * @param newRegistrationId
 * @param availableRegistratinIds
 * @returns {boolean}
 */
function isRegistrationIdAlreadySaved(newRegistrationId, availableRegistratinIds) {
    // return false wenn neue_id ist in availableIds
    var formattedArray = helper.formateRegistrationIdArray(availableRegistratinIds);
    return helper.isInArray(formattedArray,newRegistrationId);
}

module.exports = registrationIdHandler;