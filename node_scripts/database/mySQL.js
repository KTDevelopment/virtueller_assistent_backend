/**
 * Created by Snare on 16.07.16.
 */

//==================== Dependencies =========================================================================================================================================================================================================================================================

var mysql = require('mysql');
var error = require('./../helper/error');
var helper = require('./../helper/helper');
var config = require('./../config');
var exec = require('child_process').exec;

//==================== Konstanten ================================================================================================================================================================================================================================

//TABLE Names
const TABLE_NAME_EVENT="Event";
const TABLE_NAME_ANWESENHEIT="Anwesenheit";
const TABLE_NAME_MITGLIED="Mitglied";
const TABLE_NAME_REGISTER="Register";
const TABLE_NAME_GERAET="Geraet";

//TABLE EVENT COLS
const COL_NAME_EVENT_ID=TABLE_NAME_EVENT+"."+"event_id";
const COL_NAME_EVENT_WPID=TABLE_NAME_EVENT+"."+"wpid";
const COL_NAME_EVENT_DTSTART=TABLE_NAME_EVENT+"."+"dtstart";
const COL_NAME_EVENT_DTEND=TABLE_NAME_EVENT+"."+"dtend";
const COL_NAME_EVENT_SUMMARY=TABLE_NAME_EVENT+"."+"summary";
const COL_NAME_EVENT_DESCRIPTION=TABLE_NAME_EVENT+"."+"description";
const COL_NAME_EVENT_EVENTNAME=TABLE_NAME_EVENT+"."+"eventname";
const COL_NAME_EVENT_LOCATION=TABLE_NAME_EVENT+"."+"location";
const COL_NAME_EVENT_ADRESS=TABLE_NAME_EVENT+"."+"adress";
const COL_NAME_EVENT_POSTCODE=TABLE_NAME_EVENT+"."+"postcode";
const COL_NAME_EVENT_TOWN=TABLE_NAME_EVENT+"."+"town";
const COL_NAME_EVENT_KLEIDUNG=TABLE_NAME_EVENT+"."+"kleidung";
const COL_NAME_EVENT_TEILNEHMER=TABLE_NAME_EVENT+"."+"teilnehmer";
const COL_NAME_EVENT_KATEGORIE=TABLE_NAME_EVENT+"."+"kategorie";
const COL_NAME_EVENT_LONGITUDE=TABLE_NAME_EVENT+"."+"longitude";
const COL_NAME_EVENT_LATITUDE=TABLE_NAME_EVENT+"."+"latitude";
const COL_NAME_EVENT_VERSION=TABLE_NAME_EVENT+"."+"version";

//TABLE MITGLIED COLS
const COL_NAME_MITGLIED_ID=TABLE_NAME_MITGLIED+"."+"mitglied_id";
const COL_NAME_MITGLIED_VORNAME=TABLE_NAME_MITGLIED+"."+"vorname";
const COL_NAME_MITGLIED_NACHNAME=TABLE_NAME_MITGLIED+"."+"nachname";
const COL_NAME_MITGLIED_ANZAHL_AUFTRITTE=TABLE_NAME_MITGLIED+"."+"anzahl_auftritte";
const COL_NAME_MITGLIED_FK_REGISTER_ID=TABLE_NAME_MITGLIED+"."+"fk_register_id";
const COL_NAME_MITGLIED_ROLE=TABLE_NAME_MITGLIED+"."+"role";
const COL_NAME_MITGLIED_WEB_ROLE=TABLE_NAME_MITGLIED+"."+"web_role";
const COL_NAME_MITGLIED_EMAIL=TABLE_NAME_MITGLIED+"."+"email";
const COL_NAME_MITGLIED_IS_DELETED=TABLE_NAME_MITGLIED+"."+"isDeleted";
const COL_NAME_MITGLIED_VERSION=TABLE_NAME_MITGLIED+"."+"version";

//TABLE REGISTER COLS
const COL_NAME_REGISTER_ID=TABLE_NAME_REGISTER+"."+"register_id";
const COL_NAME_REGISTER_NAME=TABLE_NAME_REGISTER+"."+"register_name";

//TABLE ANWESENHEIT COLS
const COL_NAME_ANWESENHEIT_FK_MITGLIED_ID=TABLE_NAME_ANWESENHEIT+"."+"fk_mitglied_id";
const COL_NAME_ANWESENHEIT_FK_EVENT_ID=TABLE_NAME_ANWESENHEIT+"."+"fk_event_id";
const COL_NAME_ANWESENHEIT_STATUS=TABLE_NAME_ANWESENHEIT+"."+"status";

//TABLE GERAETE COLS
const COL_NAME_GERAET_ID=TABLE_NAME_GERAET+"."+"geraet_id";
const COL_NAME_GERAET_REGISTRATION_ID=TABLE_NAME_GERAET+"."+"registration_id";
const COL_NAME_GERAET_FK_MITGLIED_ID=TABLE_NAME_GERAET+"."+"fk_mitglied_id";

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
 * gibt ein JSON-Array zurück, wenn das result der DB nicht leer ist
 * gibt beim Error null im JSON-Array
 * @param query SQL Query
 * @param queryparams SQL Query Parameters
 * @param callback Callback to deliver (error,JSON-Array)
 */
function getArrayFromQuery(query,queryparams,callback){
    createDatabseConnection(function (err, connection) {
        if (!err){
            connection.query(query,queryparams,function(err, result){
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
    saveRegistrationId:saveRegistrationId
};