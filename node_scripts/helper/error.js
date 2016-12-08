//==================== Dependencies =========================================================================================================================================================================================================================================================

var helper = require('./helper');

var error = {};

//==================== Error Getter =========================================================================================================================================================================================================================================================

//TODO errors anpassen, sollten status:statuscode message:errormessage haben

error.getBadRequestError = function (){
    return {"code": 400, body:{"status": "Bad Request"}};
};

error.getNotFoundError = function (){
    return {"code": 404, body:{"status": "Not Found"}};
};

error.getFCMRequestFailedError = function (){
    return {"code": 903, body:{"status": "FCM Request failed"}};
};

error.getInternalServerError = function (){
    return {"code": 500, body:{"status": "Internal Server Error"}};
};

error.getForbiddenError = function (){
    return {"code": 403, body:{"status": "Forbidden"}};
};

error.getUnauthorizedError = function (){
    return {"code": 401, body:{"status": "Unauthorized"}}
};

//==================== Write Error Log =========================================================================================================================================================================================================================================================

/**
 * schriebt einen Error_log vom Aktuellen Tag
 * @param aufrufendeFunktion
 * @param err
 */
error.writeErrorLog = function (aufrufendeFunktion, err){
    var info = {aufrufendeFunktion:aufrufendeFunktion,err:err};
    helper.writeLog("error",info);
};

module.exports = error;