//==================== Dependencies =========================================================================================================================================================================================================================================================

var fs = require('file-system');
var glob = require('glob');
var config = require('./../config');

//==================== Hilfsfunktionnen =========================================================================================================================================================================================================================================================

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

function isInArray(array,needle) {
    var index = array.indexOf(needle);
    return index > -1;
}

/**
 * löscht Duplicate aus einem Array, JSON.stringify kann als key verwendet werden
 * @param a
 * @param key
 * @returns {*}
 */
function uniqBy(a, key) {
    var seen = {};
    return a.filter(function(item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}

/**
 * überschreibt values von obj1 mit denen von obj2 und fügt aus obj2 die hinzu welche nicht in obj1 vorhanden waren
 * @param obj1
 * @param obj2
 * @returns {{}}
 */
function mergeProperties(obj1,obj2){
    var obj3 ={};
    for (var attrname in obj1){
        obj3[attrname]=obj1[attrname];
    }
    for (var attrname in obj2){
        obj3[attrname]=obj2[attrname];
    }
    return obj3;
}

/**
 * formatiert ein Array in dem registration_ids stehen so, das nurnoch die ids drin sind, keine bezeichnungen etc
 * @param idArray
 * @returns {*}
 */
function formateRegistrationIdArray(idArray) {
    if (idArray.length > 0){
        return idArray.map(function (row) {
            return row.registration_id;
        });
    }else{
        return idArray;
    }
}

//==================== SuccesResults inclusive Send Funktion =========================================================================================================================================================================================================================================================


function getFCMSuccessJSON(fcmResult) {
    return {
        code:200,
        body:{
            status: "success",
            results: fcmResult
        }
    };
}

function getMultiStatusResponse(responseArray){
    return {
        code: 207,
        body:{
            results: responseArray
        }

    }
}

function getRestSuccessResponse(){
    return{
        code:200,
        body:{
            status: "success",
            message: "Die Änderung in der Datenbank war erfolgreich"
        }
    }
}

function getRollbackNotification(){
    return {
        "code": 910,
        body:{
            "status": "Die Änderung in der Datenbank wurde zurückgesetzt"
        }
    }
}

function getNoContentResponse(){
    return {
        "code": 200,
        body:{
            "status": "No Content"
        }
    };
}

/**
 * senden den übergebenen body, an die übergebene Response
 * @param response
 * @param body
 */
function sendResponse(response, body){
    response.status(body.code);
    response.json(body.body);
}

//==================== File Funktionen =========================================================================================================================================================================================================================================================

/**
 * schreibt ein File
 * @param filePath
 * @param logtext
 */
function writeToFile(filePath,logtext){
    fs.appendFile(filePath,logtext,function(err,result){
        if (err){
            console.log("Fehler beim Logschreiben",err)
        }
    });
}

/** allgemeine Funktion zum Logschreiben
 * @param kind
 * @param info
 */
function writeLog(kind,info){
    var name = kind+"-Log vom ";
    var timestamp = new Date().getTime();
    var datetime = new Date(timestamp);
    var datumFormatted = datetime.getDate()+"_"+(datetime.getMonth()+1)+"_"+datetime.getFullYear();
    var fileName = name+datumFormatted+".txt";
    var logFilePath = kind+"_log/"+fileName;
    var logText = datetime+","+JSON.stringify(info)+"\n";
    writeToFile(logFilePath,logText)
}



module.exports = {
    isEmptyObject: isEmptyObject,
    isInArray:isInArray,
    sendResponse:sendResponse,
    getFCMSuccessJSON:getFCMSuccessJSON,
    formateRegistrationIdArray:formateRegistrationIdArray,
    writeToFile:writeToFile,
    uniqBy:uniqBy,
    getMultiStatusResponse:getMultiStatusResponse,
    getRestSuccessResponse:getRestSuccessResponse,
    mergeProperties:mergeProperties,
    writeLog:writeLog,
    getRollbackNotification:getRollbackNotification,
    getNoContentResponse:getNoContentResponse
};
