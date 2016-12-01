//==================== Dependencies =========================================================================================================================================================================================================================================================

var helper = require('./helper');

//==================== Error Getter =========================================================================================================================================================================================================================================================

//TODO errors anpassen, sollten status:statuscode message:errormessage haben

function getBadRequestError(){
    return {"code": 400, body:{"status": "Bad Request"}};
}

function getNotFoundError(){
    return {"code": 404, body:{"status": "Not Found"}};
}

function getPartitialOrCompleteFCMFailError(){
    return {"code": 902, body:{"status": "One Or More Messages Failed"}};
}

function getFCMRequestFailedError(){
    return {"code": 903, body:{"status": "FCM Request failed"}};
}

function getInternalServerError(){
    return {"code": 500, body:{"status": "Internal Server Error"}};
}

function getServiceUnavailableError(){
    return {"code": 503, body:{"status": "Service is unavailable"}};
}

function getForbiddenError(){
    return {"code": 403, body:{"status": "Forbidden"}};
}

function getUnauthorizedError(){
    return {"code": 401, body:{"status": "Unauthorized"}}
}

/**
 * generiert ein Error JSON-Object
 * @returns JSON-Object
 * @param failedMemberIds
 */
function getFCMErrorJSON(failedMemberIds) {
    //noinspection JSValidateTypes
    return {
        code:getPartitialOrCompleteFCMFailError().code,
        body:helper.mergeProperties(getPartitialOrCompleteFCMFailError().body,{failed_for: failedMemberIds})
    };
}

//==================== Write Error Log =========================================================================================================================================================================================================================================================

/**
 * schriebt einen Error_log vom Aktuellen Tag
 * @param aufrufendeFunktion
 * @param err
 */
function writeErrorLog(aufrufendeFunktion, err){
    var info = {aufrufendeFunktion:aufrufendeFunktion,err:err};
    helper.writeLog("error",info);
}

module.exports = {
    getBadRequestError: getBadRequestError,
    getInternalServerError:getInternalServerError,
    getForbiddenError:getForbiddenError,
    writeErrorLog:writeErrorLog,
    getFCMErrorJSON:getFCMErrorJSON,
    getServiceUnavailableError:getServiceUnavailableError,
    getPartitialOrCompleteFCMFailError:getPartitialOrCompleteFCMFailError,
    getFCMRequestFailedError:getFCMRequestFailedError,
    getNotFoundError:getNotFoundError,
    getUnauthorizedError:getUnauthorizedError
};