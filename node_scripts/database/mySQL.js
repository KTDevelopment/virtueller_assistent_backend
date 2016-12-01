//==================== Dependencies =========================================================================================================================================================================================================================================================

var mysql = require('mysql');
var error = require('./../helper/error');
var helper = require('./../helper/helper');
var config = require('./../config');
var exec = require('child_process').exec;

//==================== Konstanten ================================================================================================================================================================================================================================

//TABLE Names
const TABLE_NAME_PROJECT= "project";
const TABLE_NAME_MILESTONE= "milestone";
const TABLE_NAME_DEVICE= "device";
const TABLE_NAME_USER = "user";
const TABLE_NAME_SHARED = "shared";

//TABLE PROJECT COLS
const COL_NAME_PROJECT_ID=TABLE_NAME_PROJECT+"."+"project_id";
const COL_NAME_PROJECT_NAME=TABLE_NAME_PROJECT+"."+"project_name";
const COL_NAME_PROJECT_STARTTIME=TABLE_NAME_PROJECT+"."+"starttime";
const COL_NAME_PROJECT_ENDTIME=TABLE_NAME_PROJECT+"."+"endtime";
const COL_NAME_PROJECT_FK_USER_ID=TABLE_NAME_PROJECT+"."+"fk_user_id";
const COL_NAME_PROJECT_DESCRIPTION=TABLE_NAME_PROJECT+"."+"description";

//TABLE MILESTONE COLS
const COL_NAME_MILESTONE_ID=TABLE_NAME_MILESTONE+"."+"milestone_id";
const COL_NAME_MILESTONE_NAME=TABLE_NAME_MILESTONE+"."+"milestone_name";
const COL_NAME_MILESTONE_DEADLINE=TABLE_NAME_MILESTONE+"."+"deadline";
const COL_NAME_MILESTONE_DESCRIPTION=TABLE_NAME_MILESTONE+"."+"description";
const COL_NAME_MILESTONE_FK_PROJECT=TABLE_NAME_MILESTONE+"."+"fk_project_id";
const COL_NAME_MILESTONE_NOTE=TABLE_NAME_MILESTONE+"."+"note";
const COL_NAME_MILESTONE_ACHIEVED =TABLE_NAME_MILESTONE+"."+"achieved";

//TABLE DEVICE COLS
const COL_NAME_DEVICE_ID=TABLE_NAME_DEVICE+"."+"device_id";
const COL_NAME_DEVICE_REGISTRATION_ID=TABLE_NAME_DEVICE+"."+"registration_id";
const COL_NAME_DEVICE_FK_USER_ID=TABLE_NAME_DEVICE+"."+"fk_user_id";

//TABLE USER COLS
const COL_NAME_USER_ID = TABLE_NAME_USER+"."+"user_id";
const COL_NAME_USER_NAME = TABLE_NAME_USER+"."+"user_name";
const COL_NAME_USER_PASSWORD = TABLE_NAME_USER+"."+"password";

//TABLE SHARED COLS
const COL_NAME_SHARED_FK_USER_ID = TABLE_NAME_SHARED+"."+"fk_user_id";
const COL_NAME_SHARED_FK_PROJECT_ID = TABLE_NAME_SHARED+"."+"fk_project_id";


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
    var queryParams =[project];
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
    executeQuery(query,queryParams,function(err,result){
        if(!err){
            if(result.affectedRows > 0){
                var successJson = {delete:true};
                callback(null,successJson);
            }else {
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    });
}

function updateProject(projectId,projectValues,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_PROJECT+" " +
        "SET " +
        COL_NAME_PROJECT_NAME+" = ?, " +
        COL_NAME_PROJECT_STARTTIME+" = ?, " +
        COL_NAME_PROJECT_ENDTIME+" = ?, " +
        COL_NAME_PROJECT_FK_USER_ID+" = ?, " +
        COL_NAME_PROJECT_DESCRIPTION+" = ? " +
        "WHERE " +
        COL_NAME_PROJECT_ID+" = ?";
    var queryParams =[projectValues.project_name, projectValues.starttime, projectValues.endtime, projectValues.fk_user_id, projectValues.description, projectId];
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

function addUserToProject(userId,projectId,callback){
    var record = {
        fk_user_id:userId,
        fk_project_id:projectId
    };
    var query =
        "INSERT INTO " +
        TABLE_NAME_SHARED + " " +
        "SET ?";
    var queryParams =[record];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            callback(null,{insert:true});
        }else{
            callback(err,null);
        }
    });
}

//---------------- Funktionen für Milestones -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

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
            if(!createdMilestone.note){
                createdMilestone.note = null;
            }
            callback(null,createdMilestone);
        }else{
            callback(err,null);
        }
    });
}

function addNoteToMilestone(projectId, milestoneId, note,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_MILESTONE+" " +
        "SET " +
        COL_NAME_MILESTONE_NOTE+" = ? " +
        "WHERE " +
        COL_NAME_MILESTONE_ID+ " = ? AND " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ? ";
    var queryParams =[note,milestoneId, projectId];
    console.log(query,queryParams);
    executeQuery(query,queryParams,function(err, result){
        if (!err){
            console.log(result);
            if(result.message.Changed = 1){
                var successJson = {add:true};
                callback(null,successJson);
            }else {
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null)
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
    executeQuery(query,queryParams,function(err,result){
        if(!err){
            if(result.affectedRows > 0){
                var successJson = {delete:true};
                callback(null,successJson);
            }else {
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    });
}

function updateMilestone(projectId, milestoneId, milestoneValues,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_MILESTONE+" " +
        "SET " +
        COL_NAME_MILESTONE_NAME+" = ?, " +
        COL_NAME_MILESTONE_DEADLINE+" = ?, " +
        COL_NAME_MILESTONE_DESCRIPTION+" = ?, " +
        COL_NAME_MILESTONE_NOTE+" ?, "+
        COL_NAME_MILESTONE_ACHIEVED+" ? "+
        "WHERE " +
        COL_NAME_MILESTONE_ID+ " = ? AND " +
        COL_NAME_MILESTONE_FK_PROJECT+" = ? ";
    var queryParams =[milestoneValues.name, milestoneValues.deadline, milestoneValues.description, milestoneValues.note, milestoneValues.achieved, milestoneId, projectId];
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

//---------------- Funktionen für user -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

function saveUser(userName,password,callback){
    var user ={
        user_name:userName,
        password:password
    };
    var query =
        "INSERT INTO " +
        TABLE_NAME_USER + " " +
        "SET ? ";
    var queryParams =[user];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            console.log(user);
            var createdUser = user;
            createdUser.user_id = result.insertId;
            callback(null,createdUser);
        }else{
            callback(err,null);
        }
    });
}

function deleteUserById(userId, callback){
    var query =
        "DELETE FROM "+
        TABLE_NAME_USER+" " +
        "WHERE " +
        COL_NAME_USER_ID+" = ?";
    var queryParams =[userId];
    executeQuery(query,queryParams,function(err,result){
        if(!err){
            if(result.affectedRows > 0){
                var successJson = {delete:true};
                callback(null,successJson);
            }else {
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    });
}

function updateUser(userId,userName,callback){
    var query =
        "UPDATE "+
        TABLE_NAME_USER+" " +
        "SET " +
        COL_NAME_USER_NAME+" = ? " +
        "WHERE " +
        COL_NAME_USER_ID+" = ?";
    var queryParams =[userName, userId];
    executeQuery(query,queryParams,function(err, result){
        if (!err){
            var updatedUser={};
            updatedUser.user_name = userName;
            updatedUser.user_id = userId;
            callback(null, updatedUser)
        }else{
            callback(err,null)
        }
    });
}

function getUsers(callback){
    var query = "SELECT * FROM " + TABLE_NAME_USER ;
    executeQuery(query,undefined,callback)
}

function getUserById(userId,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_USER + " " +
        "WHERE " +
        COL_NAME_USER_ID+" = ?" ;
    var queryParams =[userId];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            callback(null,result[0])
        }else{
            callback(err,null);
        }
    });
}

function getUserByNameAndPassword(userName,password,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_USER + " " +
        "WHERE " +
        COL_NAME_USER_NAME+" = ? AND " +
        COL_NAME_USER_PASSWORD+"= ?" ;
    var queryParams =[userName,password];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            if (result.length > 0){
                callback(null,result[0])
            }else{
                callback(null,{})
            }
        }else{
            callback(err,null);
        }
    });
}

function getUserByName(userName,callback){
    var query =
        "SELECT * FROM " +
        TABLE_NAME_USER + " " +
        "WHERE " +
        COL_NAME_USER_NAME+" = ?";
    var queryParams =[userName];
    executeQuery(query,queryParams,function(err, result){
        if(!err){
            if (result.length > 0){
                callback(null,result[0])
            }else{
                callback(null,{})
            }
        }else{
            callback(err,null);
        }
    });
}

function getAllUserIdsRelatedToOneProject(projectId,callback){
    var query = "SELECT * FROM " + TABLE_NAME_USER ;
    var queryParams =[projectId];
    executeQuery(query,queryParams,callback)
}

//---------------- alle Funktionen zu Geräten und RegistartionIds Bestandsdaten -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

/**
 * liefert mitglieder_ids mit zugehöriger registration_id
 * @param userId
 * @param callback
 */
function getRegistrationIdsByUserId(userId, callback){
    var query ="SELECT " +
        COL_NAME_DEVICE_FK_USER_ID+", "+
        COL_NAME_DEVICE_REGISTRATION_ID+" " +
        "FROM " +
        TABLE_NAME_DEVICE+" " +
        "WHERE " +
        COL_NAME_DEVICE_FK_USER_ID+"=? ";
    var queryParams = [userId];
    executeQuery(query,queryParams,callback);
}

function getRegistrationIdsByProjectId(projectId, callback){
    var query = "SELECT " +
        COL_NAME_DEVICE_REGISTRATION_ID+" " +
        "FROM " +
        TABLE_NAME_DEVICE+" " +
        "LEFT JOIN " +
        TABLE_NAME_SHARED+" ON " +
        COL_NAME_DEVICE_FK_USER_ID+"="+COL_NAME_SHARED_FK_USER_ID+" " +
        "LEFT JOIN " +
        TABLE_NAME_PROJECT+" ON " +
        COL_NAME_DEVICE_FK_USER_ID+"="+COL_NAME_PROJECT_FK_USER_ID+" " +
        "Where " +
        COL_NAME_SHARED_FK_PROJECT_ID+"=? OR "+COL_NAME_PROJECT_ID+"=?";
    var queryParams = [projectId,projectId];
    executeQuery(query,queryParams,callback);
}

/**
 * speichert eine registartion_id zu einem Mitglied ab
 * @param newRegistrationId
 * @param userId
 * @param callback
 */
function saveRegistrationId(newRegistrationId,userId,callback){
    var query = "INSERT INTO " +
        TABLE_NAME_DEVICE+" (" +
        COL_NAME_DEVICE_REGISTRATION_ID+"," +
        COL_NAME_DEVICE_FK_USER_ID+") " +
        "VALUES(?,?)";
    var queryParams=[newRegistrationId,userId];
    executeQuery(query,queryParams,function(err,result){
        if(!err){
            if(result.affectedRows > 0){
                var successJson = {insert:true};
                callback(null,successJson);
            }else {
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    })
}

/**
 * leifert alle registartion_ids
 * @param callback
 */
function getRegistrationIds(callback){
    var query="SELECT " +
        COL_NAME_DEVICE_REGISTRATION_ID+" " +
        "FROM "+
        TABLE_NAME_DEVICE;
    executeQuery(query,undefined,callback)
}

/**
 * löscht eine registration_id eines Mitglied
 * @param registrationId
 * @param callback
 */
function deleteRegistrationId(registrationId, callback){
    var query="DELETE FROM " +
        TABLE_NAME_DEVICE+" " +
        "WHERE " +
        COL_NAME_DEVICE_REGISTRATION_ID+"=?";
    var queryparams=[registrationId];
    executeQuery(query,queryparams,callback)
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
        TABLE_NAME_DEVICE+" " +
        "SET "+
        COL_NAME_DEVICE_REGISTRATION_ID+"=? "+
        "WHERE " +
        COL_NAME_DEVICE_REGISTRATION_ID+"=? AND "+
        COL_NAME_DEVICE_FK_USER_ID+"=?";
    var queryparams=[newRegistrationId,oldRegistrationId,mitglied_id];
    executeQuery(query,queryparams,callback)
}

//---------------- Rollback -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------/

/**
 * setzt ein Mitglied
 * @param projectId
 * @param userId
 * @param callback
 */
function rollback(projectId,userId,callback){
    var query="DELETE FROM " +
        TABLE_NAME_SHARED+" " +
        "WHERE "+
        COL_NAME_SHARED_FK_PROJECT_ID+"=? AND "+
        COL_NAME_SHARED_FK_USER_ID+"=?";
    var queryparams=[projectId,userId];
    executeQuery(query,queryparams,callback)
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
    getRegistrationIds:getRegistrationIds,
    getRegistrationIdsByUserId:getRegistrationIdsByUserId,
    getRegistrationIdsByProjectId:getRegistrationIdsByProjectId,
    rollback:rollback,
    updateRegistrationId:updateRegistrationId,
    saveRegistrationId:saveRegistrationId,
    saveProject:saveProject,
    deleteProjectById:deleteProjectById,
    updateProject:updateProject,
    getProjects:getProjects,
    getProjectById:getProjectById,
    addMilestone:addMilestone,
    addNoteToMilestone:addNoteToMilestone,
    deleteMilestoneById:deleteMilestoneById,
    updateMilestone:updateMilestone,
    getMilestones:getMilestones,
    getMilestoneById:getMilestoneById,
    saveUser:saveUser,
    deleteUserById:deleteUserById,
    updateUser:updateUser,
    getUsers:getUsers,
    getUserById:getUserById,
    getUserByNameAndPassword:getUserByNameAndPassword,
    getUserByName:getUserByName,
    addUserToProject:addUserToProject,
    getAllUserIdsRelatedToOneProject:getAllUserIdsRelatedToOneProject
};