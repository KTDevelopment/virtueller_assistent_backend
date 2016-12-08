//==================== Dependencies =========================================================================================================================================================================================================================================================

var fs = require('file-system');
var glob = require('glob');
var config = require('./../config');

var helper = {};

//==================== Hilfsfunktionnen =========================================================================================================================================================================================================================================================

helper.isInArray = function (array,needle) {
    var index = array.indexOf(needle);
    return index > -1;
};

/**
 * überschreibt values von obj1 mit denen von obj2 und fügt aus obj2 die hinzu welche nicht in obj1 vorhanden waren
 * @param obj1
 * @param obj2
 * @returns {{}}
 */
helper.mergeProperties = function (obj1,obj2){
    var obj3 ={};
    for (var attrname in obj1){
        obj3[attrname]=obj1[attrname];
    }
    for (var attrname in obj2){
        obj3[attrname]=obj2[attrname];
    }
    return obj3;
};

/**
 * formatiert ein Array in dem registration_ids stehen so, das nurnoch die ids drin sind, keine bezeichnungen etc
 * @param idArray
 * @returns {*}
 */
helper.formatRegistrationIdArray = function (idArray) {
    if (idArray.length > 0){
        return idArray.map(function (row) {
            return row.registration_id;
        });
    }else{
        return idArray;
    }
};

/**
 * formatiert ein Array in dem user_ids stehen so, das nurnoch die ids drin sind, keine bezeichnungen etc
 * @param idArray
 * @returns {*}
 */
helper.formatUserIdArray = function (idArray) {
    if (idArray.length > 0){
        return idArray.map(function (row) {
            return row.user_id;
        });
    }else{
        return idArray;
    }
};


//==================== SuccesResults inclusive Send Funktion =========================================================================================================================================================================================================================================================


helper.getFCMSuccessJSON = function () {
    return {
        code:200,
        body:{
            status: "success",
            message: "Die Nachricht konnte erfolgreich versendet werden."
        }
    };
};

helper.getMultiStatusResponse = function (responseArray){
    return {
        code: 207,
        body:{
            results: responseArray
        }

    }
};

helper.getRestSuccessResponse = function (){
    return{
        code:200,
        body:{
            status: "success",
            message: "Die Änderung in der Datenbank war erfolgreich"
        }
    }
};

helper.getRollbackNotification = function (){
    return {
        "code": 910,
        body:{
            "status": "Die Änderung in der Datenbank wurde zurückgesetzt"
        }
    }
};

helper.getNoContentResponse = function (){
    return {
        "code": 200,
        body:{}
    };
};

/**
 * senden den übergebenen body, an die übergebene Response
 * @param response
 * @param body
 */
helper.sendResponse = function (response, body){
    response.status(body.code);
    response.json(body.body);
};

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
helper.writeLog = function (kind,info){
    var name = kind+"-Log vom ";
    var timestamp = new Date().getTime();
    var datetime = new Date(timestamp);
    var datumFormatted = datetime.getDate()+"_"+(datetime.getMonth()+1)+"_"+datetime.getFullYear();
    var fileName = name+datumFormatted+".txt";
    var logFilePath = kind+"_log/"+fileName;
    //var logFilePath = "/home/ftpuser/virtueller_assistent/error_log/"+fileName;
    var logText = datetime+","+JSON.stringify(info)+"\n";
    writeToFile(logFilePath,logText)
};

module.exports = helper;
