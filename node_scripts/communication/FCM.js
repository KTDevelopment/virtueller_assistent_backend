/**
 * Created by Snare on 16.07.16.
 */

//==================== Dependencies =========================================================================================================================================================================================================================================================

var async = require('async');
var database = require('./../database/mySQL');
var error = require('./../helper/error');
var helper = require('./../helper/helper');
var config = require('./../config');

var fcm = require('node-gcm');
var backoff = require('./backoff.js');

var forExport = {};

//==================== Einstiegsfunktionen für FCM =========================================================================================================================================================================================================================================================

/**
 * einstieg in fcm cycle, für erste funktion (muss noch festgelegt werden
 * @param registerId - optional
 * @param memberId
 * @param callback
 */

forExport.memberActualized = function(registerId,memberId,callback){
    //datenbpaket beschreiben
    var data = {
        'type': '0'
    };


    //DO some fancy stuff to get what you need

    //wenn alles klappt weiter

    var mitgliedArray = [];
    var messageData=getMessageData(data,mitgliedArray);
    sendMessageToFCM(messageData,function(err,result){
        if(!err){
            callback(null,result);
        }else{
            if(err.code==error.getServiceUnavailableError().code){
                callback(err,null);
                var retryAfter = 1000;
                exponentialBackoff(retryAfter,messageData,undefined,undefined,undefined);
            }else{
                callback(err,null);
            }
        }
    });
};

//==================== Funktionen für FCM =========================================================================================================================================================================================================================================================
/**
 * bereitet einen Post an FCM vor, definiert auch was nach dem Post gesehen soll, Error-Handling etc
 * @param messageData
 * @param callback
 */
function sendMessageToFCM(messageData, callback){

    var message = messageData['message'];
    var mitgliedArray = messageData['mitgliedArray'];
    var adressArray = helper.formateRegistrationIdArray(mitgliedArray);

    // Set up the sender with you API key.
    var sender = new fcm.Sender(config.fcm.api_key);
    sender.send(message, { registrationTokens: adressArray }, function (err, response) {
        if(!err) {
            if(response.failure > 0){
                // evaluate Partitial error
                evaluatePartitialOrCompleteError(response,mitgliedArray,function(allFailed){
                    if(allFailed){
                        callback(error.getFCMRequestFailedError(),null);
                    }else{
                        callback(null,response)
                    }
                });
            }else{
                // complete success
                callback(null,response);
            }
        } else {
            if (err.code > 500 && err.code < 600){
                //callback Server ist Busy
                callback(error.getServiceUnavailableError(),null);
            }else {
                // complete error
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
    var message = new fcm.Message({
        data: data
    });
    return {
        message: message,
        mitgliedArray: mitgliedArray
    };
}

/**
 * liefert im callback zurück ob die ANchricht an alle registration_ids fehlgeschlagen ist oder nicht
 * Löscht alle registration_ids, welche von FCM als "NotRegistrated" oder "InvalidRegistration" eingestuft werden
 * erstzt alle registration_ids, für die von FCM eine canonical ID zurück gegeben wird.
 * @param result
 * @param mitgliedArray
 * @param callback
 */
function evaluatePartitialOrCompleteError(result, mitgliedArray, callback) {

    var removableIds=[];
    var retryIds=[];
    var replaceableIds=[];
    var fcmShallGoToPlaner=false;
    var allFailedIds=[];

    evaluateResultForPartitialOrCompleteError(result,mitgliedArray,function(removeableRegistrationIds, retryRegistrationIds, replaceableRegistrationIds, failedRegistrationIds, shallGoToPlaner){
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
        return allFailedIds.length === mitgliedArray.length;
    }
}

/**
 * wertet das Result von FCM aus und gibt entsprechende Arrays im callback zurück
 * @param result
 * @param mitgliedArray
 * @param callback
 */
function evaluateResultForPartitialOrCompleteError(result, mitgliedArray, callback) {

    var removableRegistrationIds=[];
    var retryRegistrationIds=[];
    var replaceableRegistrationIds=[];
    var failedMemberIds=[];

    /** @namespace entry.registration_id */
    /** @namespace entry.fk_mitglied_id */
    mitgliedArray.forEach(function (entry){
        var index = mitgliedArray.indexOf(entry);
        var currentFcmResult = result.results[index];
        if (currentFcmResult.error && (currentFcmResult.error==="NotRegistered" || currentFcmResult.error === "InvalidRegistration")){
            removableRegistrationIds.push(entry.registration_id);
            failedMemberIds.push({mitglied_id:entry.fk_mitglied_id});
        }
        if (currentFcmResult.error && (currentFcmResult.error==="Unavailable" || currentFcmResult.error === "InternalServerError")){// todo nächster Release vielleicht retry bei diesen einbauen, wobei dann auch wieder rollback angepasst werden muss
            retryRegistrationIds.push(entry.registration_id);
            failedMemberIds.push({mitglied_id:entry.fk_mitglied_id});
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
 * @param faildMemberId
 * @param eventId
 * @param oldStatus
 */
function performRollback(faildMemberId, eventId, oldStatus) {

    database.rollback(faildMemberId.mitglied_id, eventId, oldStatus, function (err, result) {
        if (err) {
            error.writeErrorLog("rollback", {
                err: err,
                id: faildMemberId,
                message: "der Status dieser Person konnte für dieses Event: " + eventId + " nicht zu: " + oldStatus + "zurückgesetzt werden"
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

module.exports = forExport;