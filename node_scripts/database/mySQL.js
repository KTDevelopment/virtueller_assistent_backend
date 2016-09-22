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
const COL_NAME_MILESTONE_DEADLINE=TABLE_NAME_MILESTONE+"."+"deadline";
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
        "SET ? ";
    var queryParams =[project,project];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            var createdProject = project;
            createdProject.project_id = result.insertId;
            callback(null,createdProject);
        }else{
            callback(err,null);
        }
    });
}

function deleteProjectById(projectId, callback){
    var query =
        "DELETE FROM "+
        TABLE_NAME_PROJECT+" " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?";
    var queryParams =[projectId];
    executeQuery(query,queryParams,callback);
}

function updateProject(projectId,projectValues,callback){
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
    var queryParams =[projectValues.project_name, projectValues.starttime, projectValues.endtime, projectValues.editor_name, projectValues.lecturer_name, projectValues.description, projectId];
    executeQuery(query,queryParams,function(err, result){
        if (!err){
            var updatedProject = projectValues;
            updatedProject.project_id = projectId;
            callback(null, updatedProject)
        }else{
            callback(err,null)
        }
    });
}

function getProjects(callback){
    var query = "SELECT * FROM " + TABLE_NAME_PROJECT ;
    executeQuery(query,undefined,callback)
}

function getProjectById(projectId,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_PROJECT + " " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?" ;
    var queryParams =[projectId];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            callback(null,result[0])
        }else{
            callback(err,null);
        }
    });
}

function addMilestone(milestone,callback){
    if(milestone.achieved){
        delete milestone.achieved;
    }
    var query =
        "INSERT INTO " +
        TABLE_NAME_MILESTONE + " " +
        "SET ?";
    var queryParams =[milestone];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            var createdMilestone = milestone;
            createdMilestone.milestone_id = result.insertId;
            createdMilestone.achieved = 0;
            callback(null,createdMilestone);
        }else{
            callback(err,null);
        }
    });
}

function deleteMilestoneById(projectId, milestoneId,callback){
    var query =
        "DELETE FROM "+
        TABLE_NAME_MILESTONE+" " +
        "WHERE " +
        COL_NAME_MILESTONE_ID+" = ? AND " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ?";
    var queryParams =[milestoneId,projectId];
    executeQuery(query,queryParams,callback);
}

function updateMilestone(projectId, milestoneId, milestoneValues,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_MILESTONE+" " +
        "SET " +
        COL_NAME_MILESTONE_NAME+" = ?, " +
        COL_NAME_MILESTONE_DEADLINE+" = ?, " +
        COL_NAME_MILESTONE_DESCRIPTION+" = ? " +
        "WHERE " +
        COL_NAME_MILESTONE_ID+ " = ? AND " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ? ";
    var queryParams =[milestoneValues.name, milestoneValues.deadline, milestoneValues.description, milestoneId, projectId];
    executeQuery(query,queryParams,function(err, result){
        if (!err){
            var updatedMilestone = milestoneValues;
            updatedMilestone.fk_project_id = projectId;
            updatedMilestone.milestone_id = milestoneId;
            callback(null, updatedMilestone)
        }else{
            callback(err,null)
        }
    });
}

function getMilestones(projectId, callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_MILESTONE + " " +
        "WHERE " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ?" ;
    var queryParams =[projectId];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            callback(null,result)
        }else{
            callback(err,null);
        }
    });
}

function getMilestoneById(projectId, milestoneId, callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_MILESTONE + " " +
        "WHERE " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ? " +
        "AND " +
        COL_NAME_MILESTONE_ID+" = ?" ;
    var queryParams =[projectId,milestoneId];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            callback(null,result[0])
        }else{
            callback(err,null);
        }
    });
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
    executeQuery(query,queryParams,callback);
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
    executeObjectQuery(query,queryparams,callback)
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
    executeObjectQuery(query,queryparams,callback)
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
    executeObjectQuery(query,queryparams,callback)
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
    executeObjectQuery(query,queryparams,callback)
}

//==================================================================================== Standard Array und Object Getter ================================================================================================================================================================

/**
 * Führt die Query aus und gibt das ergebnis zurück, entweder ein Object oder ein Array, abhängig von der Query
 * gibt beim Error null als result
 * @param query SQL Query
 * @param queryParams SQL Query-Parameters
 * @param callback Callback to deliver (error,result)
 */
function executeQuery(query, queryParams, callback){
    createDatabseConnection(function (err, connection) {
        if (!err){
            connection.query(query,queryParams,function(err, result){
                if (!err){
                    callback(null,result);
                }else{
                    switch (err.errno){
                        case 1062: // duplicate entry of unique key
                            callback(error.getBadRequestError(),null);
                            break;
                        case 1452: // now referenced row for FK
                            callback(error.getBadRequestError(),null);
                            break;
                        case 1054: // unknown column
                            callback(error.getBadRequestError(),null);
                            break;
                        default:
                            error.writeErrorLog("executeObjectQuery",{error:err, query:query, queryParams:queryParams});
                            callback(error.getInternalServerError(),null);
                            break;
                    }
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
    getMilestones:getMilestones,
    getMilestoneById:getMilestoneById
};