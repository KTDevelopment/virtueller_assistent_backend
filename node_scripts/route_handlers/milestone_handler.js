var database = require('./../database/mySQL');
var helper = require('./../helper/helper');
var error = require('./../helper/error');
var fcm = require('./../communication/FCM');
var async = require('async');

var milestoneHandler={};

milestoneHandler.getById = function (milestoneId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    userHasAnyRelationToMilestone(callingUserId,milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                database.milestone.getById(milestoneId,function(err, result){
                    if(!err){
                        callback(null,result)
                    }else{
                        callback(err,null);
                    }
                })
            }else{
                callback(error.getForbiddenError(),null)
            }
        }else{
            callback(err,null);
        }
    });
};

milestoneHandler.remove = function (milestoneId, callingUser, callback){
    var callingUserId = callingUser.user_id;
    var sharingUserName = callingUser.user_name;
    userHasAnyRelationToMilestone(callingUserId,milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                database.milestone.remove(milestoneId, function (err, result) {
                    if (!err) {
                        callback(null,result);
                        fcm.milestoneDeleted(projectId,milestoneId,sharingUserName,function (err, result) {
                            // no one to notifie about
                        });
                    } else {
                        callback(err,null);
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

milestoneHandler.update = function (milestoneId, milestoneValues,  callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var sharingUserName = callingUser.user_name;
    userHasAnyRelationToMilestone(callingUserId, milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                database.milestone.update(milestoneId, milestoneValues, function (err, updatedMilestone) {
                    if (!err) {
                        callback(null,updatedMilestone);
                        fcm.milestoneActualized(projectId,updatedMilestone.milestone_id,sharingUserName,function (err, result) {
                            // no one to notifie about
                        });
                    } else {
                        callback(err,null);
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

milestoneHandler.addNote = function (milestoneId, note, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;
    userHasAnyRelationToMilestone(callingUserId,milestoneId,function (err, boolean, projectId) {
        if(!err){
            if(boolean){
                database.milestone.addNote(milestoneId, note, function (err, result) {
                    if (!err) {
                        callback(null,result);
                        fcm.milestoneNoteAdd(projectId,milestoneId,callingUserName,function(err,result){
                            // no one to notifie about
                        })
                    } else {
                        callback(err,null);
                    }
                });
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

milestoneHandler.achieve = function (milestoneId, achieve, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;
    userHasAnyRelationToMilestone(callingUserId, milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                database.milestone.achieve(milestoneId, achieve, function (err, result) {
                    if (!err) {
                        callback(null,result);
                        fcm.milestoneAchieved(projectId,milestoneId,callingUserName,function (err, result) {
                            // no one to notifie about
                        });
                    } else {
                        callback(err,null);
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

milestoneHandler.add = function (milestoneValues, projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;
    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                milestoneValues.fk_project_id = projectId;
                database.milestone.add(milestoneValues,function(err, createdMilestone){
                    if(!err){
                        callback(null,createdMilestone);
                        fcm.milestoneAdd(projectId,createdMilestone.milestone_id,callingUserName,function (err, result) {
                            // no one to notifie about
                        });
                    }else{
                        callback(err,null);
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

function userHasAnyRelationToMilestone(userId, milestoneId, callback) {

    function getProject(callback) {
        database.project.getByMilestoneId(milestoneId,function (err, project) {
            if(!err){
                callback(null,project)
            }else{
                callback(err,null,null)
            }
        })
    }

    async.waterfall([getProject],function (err, project){
        if (!err){
            if (project) {
                database.project.getAllRelatedUserIds(project.project_id,callback,function (err, relatedUserIds) {
                    if(!err){
                        if (helper.isInArray(relatedUserIds,userId)){
                            callback(null,true,project.project_id)
                        }else{
                            callback(null,false)
                        }
                    }else{
                        callback(err,null)
                    }
                })
            } else {
                callback(error.getBadRequestError(),null)
            }
        }else{
            callback(err,null);
        }
    });
}

function userHasAnyRelationToProject(userId, projectId, callback) {
    database.project.getAllRelatedUserIds(projectId,callback,function (err, relatedUserIds) {
        if(!err){
            if (helper.isInArray(relatedUserIds,userId)){
                callback(null,true)
            }else{
                callback(null,false)
            }
        }else{
            callback(err,null)
        }
    })
}

milestoneHandler.validateMilestoneValues = function (milestoneValues) {
    var name = milestoneValues.milestone_name;
    var deadline = milestoneValues.deadline;
    var description = milestoneValues.description;
    var note = milestoneValues.note;
    if( name && deadline && description){
        if(typeof name == "string" && typeof deadline == "number" && typeof description == "string"){
            if(note){
                return typeof note == "string";
            }else{
                return true;
            }
        }else{
            return false;
        }
    }else{
        return false;
    }
};

module.exports = milestoneHandler;