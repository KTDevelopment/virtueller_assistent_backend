//==================== Dependencies =========================================================================================================================================================================================================================================================

var async = require('async');
var database = require('./../database/mySQL');
var error = require('./../helper/error');
var helper = require('./../helper/helper');
var config = require('./../config');

var fcm = require('fcm-node');
var backoff = require('./backoff.js');


//==================== Einstiegsfunktionen für FCM =========================================================================================================================================================================================================================================================

/**
 * einstieg in fcmService cycle, für erste funktion (muss noch festgelegt werden
 * @param projectId
 * @param callback
 */

fcm.projectActualized = function(projectId, callback){
    var data = {
        'type': '0'
    };

    database.getRegistrationIdsByProjectId(projectId,function(err,result){
        if(!err){
            var messageData = getMessageData(data,result);
            sendMessageToFCM(messageData,function(err,result){
                if(!err){
                    callback(null,result);
                }else{
                    callback(err,null);
                }
            });
        }else{
            callback(err,result)
        }
    });
};

fcm.projectShared = function(projectId,userId,callback){
    var data = {
        'type': '1'
    };

    database.getRegistrationIdsByUserId(userId,function(err,result){
        if(!err){
            if(result.length > 0){
                var messageData = getMessageData(data,result);
                sendMessageToFCM(messageData,function(err,result){
                    if(!err){
                        callback(null,result);
                    }else{
                        callback(err,null);
                        performRollback(projectId,userId);
                    }
                });
            }else{
                callback(error.getBadRequestError(),null);
                performRollback(projectId,userId);
            }
        }else{
            callback(err,result);
            performRollback(projectId,userId);
        }
    })
};



//==================== Funktionen für FCM =========================================================================================================================================================================================================================================================
/**
 * bereitet einen Post an FCM vor, definiert auch was nach dem Post gesehen soll, Error-Handling etc
 * @param messageData
 * @param callback
 */
function
sendMessageToFCM(messageData, callback){

    var message = messageData['message'];
    var mitgliedArray = messageData['mitgliedArray'];

    // Set up the sender with you API key.
    var sender = new fcm(config.fcm.api_key);
    sender.send(message, function (err, response) {
        if(!err) {
            callback(null,response);
        } else {
            try {
                var errorObject = JSON.parse(err);
                // retry wird von fcm-node ausgeführt, falls nötig, todo test mit richtigem fcm key
                evaluatePartitialOrCompleteError(errorObject,mitgliedArray,function(allFailed){
                    if(allFailed){
                        callback(error.getFCMRequestFailedError(),null);
                        error.writeErrorLog("sendMessageToFCM",errorObject);
                    }else{
                        callback(null,response)
                    }
                });
            }catch(e){
                callback(error.getFCMRequestFailedError(),null);
                error.writeErrorLog("sendMessageToFCM",err);
            }
        }
    });
}

//==================== Hilfsfunktionen für FCM =========================================================================================================================================================================================================================================================

/**
 * gibt eine Daten für eine FCM Message in einem JSON-Object zurück
 * @param data
 * @param mitgliedArray
 * @returns {{message: *, mitgliedArray: *}}
 */
function getMessageData(data,mitgliedArray) {
    var message = {
        registration_ids: helper.formateRegistrationIdArray(mitgliedArray),
        data: data
    };
    return {
        message: message,
        mitgliedArray: mitgliedArray
    };
}

/**
 * liefert im callback zurück ob die Nachricht an alle registration_ids fehlgeschlagen ist oder nicht
 * Löscht alle registration_ids, welche von FCM als "NotRegistrated" oder "InvalidRegistration" eingestuft werden
 * erstzt alle registration_ids, für die von FCM eine canonical ID zurück gegeben wird.
 * @param result
 * @param regIdArray
 * @param callback
 */
function evaluatePartitialOrCompleteError(result, regIdArray, callback) {
    var removableIds=[];
    var retryIds=[];
    var replaceableIds=[];
    var fcmShallGoToPlaner=false;
    var allFailedIds=[];

    evaluateResultForPartitialOrCompleteError(result,regIdArray,function(removeableRegistrationIds, retryRegistrationIds, replaceableRegistrationIds, failedRegistrationIds, shallGoToPlaner){
        removableIds = removeableRegistrationIds;
        retryIds = retryRegistrationIds;
        replaceableIds = replaceableRegistrationIds;
        fcmShallGoToPlaner = shallGoToPlaner;
        allFailedIds = failedRegistrationIds;
    });

    callback(isAllMessagesFailed());

    removeTheRemovables(removableIds);

    replaceTheReplaceables(replaceableIds);

    //TODO nächster Release retryThe RetyIds?

    function isAllMessagesFailed() {
        return allFailedIds.length === regIdArray.length;
    }
}

/**
 * wertet das Result von FCM aus und gibt entsprechende Arrays im callback zurück
 * @param result
 * @param regIdArray
 * @param callback
 */
function evaluateResultForPartitialOrCompleteError(result, regIdArray, callback) {

    var removableRegistrationIds=[];
    var retryRegistrationIds=[];
    var replaceableRegistrationIds=[];

    /** @namespace entry.registration_id */
    /** @namespace entry.fk_mitglied_id */
    regIdArray.forEach(function (entry){
        var index = regIdArray.indexOf(entry);
        var currentFcmResult = result.results[index];
        if (currentFcmResult.error && (currentFcmResult.error==="NotRegistered" || currentFcmResult.error === "InvalidRegistration")){
            removableRegistrationIds.push(entry.registration_id);
        }
        if (currentFcmResult.error && (currentFcmResult.error==="Unavailable" || currentFcmResult.error === "InternalServerError")){// todo nächster Release vielleicht retry bei diesen einbauen, wobei dann auch wieder rollback angepasst werden muss
            retryRegistrationIds.push(entry.registration_id);
        }
        if (currentFcmResult.registration_id){
            replaceableRegistrationIds.push({oldId:entry.registration_id,newId:currentFcmResult.registration_id,mitglied_id:entry.fk_mitglied_id});
        }
    });

    var failedRegistrationIds = removableRegistrationIds.concat(retryRegistrationIds);

    callback(removableRegistrationIds,retryRegistrationIds,replaceableRegistrationIds,failedRegistrationIds);
}

//==================== Funktionen nach FCM (rollback, alte registrationIds erneuen, invalide registrationIds löschen) =========================================================================================================================================================================================================================================================

/**
 * fürht einen Rollback aus, die letzte Statusänderung einen Mitglieds soll dadurch wieder rückgängig gemacht werden, falls es nicht benachrichtigt werden kann
 * @param projectId
 * @param userId
 */
function performRollback(projectId, userId) {

    database.rollback(projectId, userId, function (err, result) {
        if (err) {
            error.writeErrorLog("rollback", {
                err: err,
                projectId: projectId,
                userId:userId,
                message: "Der Eintrag bestehend aus userId und projectId konnte nicht gelöscht werden"
            })
        }
    });
}

/**
 * löscht die zu löschenden RegistrationIds, falls diese zum Beispiel ungültig geworden ist, wird in evaluateResultForPartitialOrCompleteError ausgewertet
 * @param removableIds
 */
function removeTheRemovables(removableIds) {
//nicht mehr registrierte registratiom ids löschen
    removableIds.forEach(function (entry) {
        database.deleteRegistrationId(entry, function (err, result) {
            if (err) {
                error.writeErrorLog("deleteRegistrationId", {
                    err: err,
                    id: entry,
                    message: "konnte nicht gelöscht werden"
                })
            }
        })
    });
}

/**
 * ersetzt alte ids die warscheinlich bald auslaufen, wird von FCM gemeldet und in evaluateResultForPartitialOrCompleteError ausgewertet
 * @param replaceableIds
 */
function replaceTheReplaceables(replaceableIds) {
//ersetzbare ids ersetzen
    replaceableIds.forEach(function (entry) {
        database.updateRegistrationId(entry.oldId, entry.newId, entry.mitglied_id, function (err, result) {
            if (err) {
                error.writeErrorLog("updateRegistrationId", {
                    err: err,
                    id: entry,
                    message: "konnte nicht geupdated werden"
                })
            }
        })
    })
}

/**
 * führt ein fibonacci backoff aus, ruft die Fkt "sendMessageToFCM" mehrmals auf und führt falls nötig, ein rollback aus
 * @param retryAfter
 * @param messageData
 * @param executeRollBackForId
 * @param eventId
 * @param oldStatus
 */
function exponentialBackoff(retryAfter, messageData, executeRollBackForId, eventId, oldStatus){
    var retryTimes = 5;
    backoff.exponentialBackoff(retryAfter, retryTimes, sendMessageToFCM, messageData,function(err,result){
        if(!err){
            console.log("Exponential Backoff erfolgreich: ",result);
        }else{
            if (!isNaN(executeRollBackForId) && !isNaN(eventId) && !isNaN(oldStatus)){
                performRollback(executeRollBackForId, eventId, oldStatus);
            }else{
                error.writeErrorLog("sendMessageToFCM",err);
            }
        }
    })
}

module.exports = fcm;