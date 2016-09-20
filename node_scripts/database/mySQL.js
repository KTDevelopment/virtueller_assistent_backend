//==================== Dependencies =========================================================================================================================================================================================================================================================

var mysql = require('mysql');
var error = require('./../helper/error');
var helper = require('./../helper/helper');
var config = require('./../config');
var exec = require('child_process').exec;

//==================== Konstanten ================================================================================================================================================================================================================================

//TABLE Names
const TABLE_NAME_PROJECT="project";
const TABLE_NAME_MILESTONE="milestone";

//TABLE PROJECT COLS
const COL_NAME_PROJECT_ID=TABLE_NAME_PROJECT+"."+"project_id";
const COL_NAME_PROJECT_NAME=TABLE_NAME_PROJECT+"."+"project_name";
const COL_NAME_PROJECT_STARTTIME=TABLE_NAME_PROJECT+"."+"starttime";
const COL_NAME_PROJECT_ENDTIME=TABLE_NAME_PROJECT+"."+"endtime";
const COL_NAME_PROJECT_EDITOR_NAME=TABLE_NAME_PROJECT+"."+"editor_name";
const COL_NAME_PROJECT_LECTURER_NAME=TABLE_NAME_PROJECT+"."+"lecturer_name";
const COL_NAME_PROJECT_DESCRIPTION=TABLE_NAME_PROJECT+"."+"description";

//TABLE MILESTONE COLS
const COL_NAME_MILESTONE_ID=TABLE_NAME_MILESTONE+"."+"milestone_id";
const COL_NAME_MILESTONE_NAME=TABLE_NAME_MILESTONE+"."+"name";
const COL_NAME_MILESTONE_DEADLINE=TABLE_NAME_MILESTONE+"."+"desline";
const COL_NAME_MILESTONE_DESCRIPTION=TABLE_NAME_MILESTONE+"."+"description";
const COL_NAME_MILESTONE_FK_PROJECT=TABLE_NAME_MILESTONE+"."+"fk_project_id";

//=============== ConnectionPool und Connection-Vergabe =====================================================================================================================================================================================================================================

/**
 * erstellt den ConnectionPool
 */
var pool = mysql.createPool({
    connectionLimit: config.mysql.connectionLimit,
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port,
    debug: config.mysql.debug
});

/**
 * erstellt einen Datenbankverbindung oder gibt einen Fehler zurück und schreibt diesen Fehler ins Error Log
 * @param callback
 */
function createDatabseConnection(callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            if (connection) {
                connection.release();
            }
            callback(error.getInternalServerError(),null);
            error.writeErrorLog("createDatabaseConnection",err);
        }else{
            callback(null,connection);
        }
    });
}

//================ Queries und Funktionen ====================================================================================================================================================================================================================================

//---------------- Funktionen für Projekte -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

function saveProject(project,callback){
    var query =
        "INSERT INTO " +
        TABLE_NAME_PROJECT + " " +
        "SET ?";
    var queryParams =[project];
    getObjectFromQuery(query,queryParams,callback);
}

function deleteProjectById(projectId, callback){
    var query =
        "DELETE FROM "+
        TABLE_NAME_PROJECT+" " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?";
    var queryParams =[projectId];
    getObjectFromQuery(query,queryParams,callback);
}

function updateProject(project,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_PROJECT+" " +
        "SET " +
        COL_NAME_PROJECT_NAME+" = ?, " +
        COL_NAME_PROJECT_STARTTIME+" = ?, " +
        COL_NAME_PROJECT_ENDTIME+" = ?, " +
        COL_NAME_PROJECT_EDITOR_NAME+" = ?, " +
        COL_NAME_PROJECT_LECTURER_NAME+" = ?, " +
        COL_NAME_PROJECT_DESCRIPTION+" = ? " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?";
    var queryParams =[project.project_name, project.starttime, project.endtime, project.editor_name, project.lecturer_name, project.description, project.project_id];
    getObjectFromQuery(query,queryParams,callback);
}

function getProjects(callback){
    var query = "SELECT * FROM " + TABLE_NAME_PROJECT ;
    getArrayFromQuery(query,undefined,callback)
}

function getProjectById(projectId,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_PROJECT + " " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?" ;
    var queryParams =[projectId];
    getObjectFromQuery(query,queryParams,callback);
}

function addMilestone(milestone,callback){
    var query =
        "INSERT INTO " +
        TABLE_NAME_MILESTONE + " " +
        "SET ?";
    var queryParams =[milestone];
    getObjectFromQuery(query,queryParams,callback);
}

function deleteMilestoneById(milestoneId,callback){
    var query =
        "DELETE FROM "+
        TABLE_NAME_MILESTONE+" " +
        "WHERE " +
        COL_NAME_MILESTONE_ID+" = ?";
    var queryParams =[milestoneId];
    getObjectFromQuery(query,queryParams,callback);
}

function updateMilestone(milestone,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_MILESTONE+" " +
        "SET " +
        COL_NAME_MILESTONE_NAME+" = ?, " +
        COL_NAME_MILESTONE_DEADLINE+" = ?, " +
        COL_NAME_MILESTONE_DESCRIPTION+" = ?, " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ?, " +
        "WHERE " +
        COL_NAME_MILESTONE_ID+ " = ?";
    var queryParams =[milestone.name, milestone.deadline, milestone.description, milestone.fk_project_id, milestone.milestone_id];
    getObjectFromQuery(query,queryParams,callback);
}

function getAllMilestonesByProjectId(projectId,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_MILESTONE + " " +
        "WHERE " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ?" ;
    var queryParams =[projectId];
    getArrayFromQuery(query,queryParams,callback);
}





//---------------- alle Funktionen zu Geräten und RegistartionIds Bestandsdaten -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

/**
 * liefert mitglieder_ids mit zugehöriger registration_id
 * @param mitgliedId
 * @param callback
 */
function getRegistrationIdsByMitgliedId(mitgliedId, callback){
    var query ="SELECT " +
        COL_NAME_GERAET_FK_MITGLIED_ID+", "+
        COL_NAME_GERAET_REGISTRATION_ID+" " +
        "FROM " +
        TABLE_NAME_GERAET+" " +
        "WHERE " +
        COL_NAME_GERAET_FK_MITGLIED_ID+"=? ";
    var queryParams = [mitgliedId];
    getArrayFromQuery(query,queryParams,callback);
}

/**
 * speichert eine registartion_id zu einem Mitglied ab
 * @param newRegistrationId
 * @param memberId
 * @param callback
 */
function saveRegistrationId(newRegistrationId,memberId,callback){
    var query = "INSERT INTO " +
        TABLE_NAME_GERAET+" (" +
        COL_NAME_GERAET_REGISTRATION_ID+"," +
        COL_NAME_GERAET_FK_MITGLIED_ID+") " +
        "VALUES(?,?)";
    var queryparams=[newRegistrationId,memberId];
    getObjectFromQuery(query,queryparams,callback)
}

/**
 * leifert alle registartion_ids
 * @param callback
 */
function getRegistrationIds(callback){
    var query="SELECT " +
        COL_NAME_GERAET_REGISTRATION_ID+" " +
        "FROM "+
        TABLE_NAME_GERAET;
    getAnyArrayFromQuery(query,undefined,callback)
}

/**
 * löscht eine registration_id eines Mitglied
 * @param registrationId
 * @param callback
 */
function deleteRegistrationId(registrationId, callback){
    var query="DELETE FROM " +
        TABLE_NAME_GERAET+" " +
        "WHERE " +
        COL_NAME_GERAET_REGISTRATION_ID+"=?";
    var queryparams=[registrationId];
    getObjectFromQuery(query,queryparams,callback)
}

/**
 * tauscht eine alte registartion_id eines Mitglieds mit einer neuen aus
 * @param oldRegistrationId
 * @param newRegistrationId
 * @param mitglied_id
 * @param callback
 */
function updateRegistrationId(oldRegistrationId, newRegistrationId, mitglied_id, callback){
    var query="UPDATE " +
        TABLE_NAME_GERAET+" " +
        "SET "+
        COL_NAME_GERAET_REGISTRATION_ID+"=?"+
        "WHERE " +
        COL_NAME_GERAET_REGISTRATION_ID+"=? AND "+
        COL_NAME_GERAET_FK_MITGLIED_ID+"=?";
    var queryparams=[newRegistrationId,oldRegistrationId,mitglied_id];
    getObjectFromQuery(query,queryparams,callback)
}

//---------------- Rollback -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

/**
 * setzt ein Mitglied
 * @param mitglied_id
 * @param event_id
 * @param oldStatus
 * @param callback
 */
function rollback(mitglied_id,event_id,oldStatus,callback){
    var query= "UPDATE " +
        TABLE_NAME_ANWESENHEIT+" " +
        "SET " +
        COL_NAME_ANWESENHEIT_STATUS+"=? " +
        "WHERE " +
        COL_NAME_ANWESENHEIT_FK_MITGLIED_ID+"=? AND " +
        COL_NAME_ANWESENHEIT_FK_EVENT_ID+"=?";
    var queryparams=[oldStatus,mitglied_id,event_id];
    getObjectFromQuery(query,queryparams,callback)
}

//==================================================================================== Standard Array und Object Getter ================================================================================================================================================================

/**
 * gibt ein JSON-Array zurück
 * gibt beim Error null im JSON-Array
 * @param query SQL Query
 * @param queryParams SQL Query-Parameters
 * @param callback Callback to deliver (error,JSON-Array)
 */
function getArrayFromQuery(query,queryParams,callback){
    createDatabseConnection(function (err, connection) {
        if (!err){
            connection.query(query,queryParams,function(err, result){
                if (!err){
                    callback(null,result);
                }else{
                    error.writeErrorLog("getArrayFromQuery",{error:err, query:query, queryparams:queryparams});
                    callback(error.getInternalServerError(),null);
                }
            });
            connection.release();
        }else{
            callback(err,null);
        }
    })
}

/**
 * gibt ein JSON-Object zurück, sollte nur aufgerufen werdenm wenn auch ein Object gewünscht ist, da nur das erste Object des Result-Array zurückgegeben wird
 * @param query auszuführenden Query
 * @param queryparams Parameter falls '?' vergeben wurden
 * @param callback liefert err und result
 */
function getObjectFromQueryThatsReturnsArray(query, queryparams, callback){
    createDatabseConnection(function (err, connection) {
        if (!err){
            connection.query(query,queryparams,function(err, result){
                if (!err){
                    if (!helper.isEmptyObject(result)){
                        callback(null,result[0]);
                    }else{
                        callback(null,{});
                    }
                }else{
                    error.writeErrorLog("getObjectFromQueryThatsReturnsArray",{error:err, query:query, queryparams:queryparams});
                    callback(error.getInternalServerError(),null);
                }
            });
            connection.release();
        }else{
            callback(err,null);
        }
    })
}

/**
 * gibt jede positive antwort von mysql im JSON-Object weiter
 * @param query
 * @param queryparams
 * @param callback
 */
function getObjectFromQuery(query, queryparams, callback){
    createDatabseConnection(function (err, connection) {
        if (!err){
            connection.query(query,queryparams,function(err, result){
                if (!err){
                    callback(null,result);
                }else{
                    error.writeErrorLog("getObjectFromQuery",{error:err, query:query, queryparams:queryparams});
                    callback(error.getInternalServerError(),null);
                }
            });
            connection.release();
        }else{
            callback(err,null);
        }
    })
}

//==================================================================================== Export ================================================================================================================================================================

module.exports = {
    deleteRegistrationId:deleteRegistrationId,
    rollback:rollback,
    updateRegistrationId:updateRegistrationId,
    saveRegistrationId:saveRegistrationId,
    saveProject:saveProject,
    deleteProjectById:deleteProjectById,
    updateProject:updateProject,
    getProjects:getProjects,
    getProjectById:getProjectById,
    addMilestone:addMilestone,
    deleteMilestoneById:deleteMilestoneById,
    updateMilestone:updateMilestone,
    getAllMilestonesByProjectId:getAllMilestonesByProjectId
};