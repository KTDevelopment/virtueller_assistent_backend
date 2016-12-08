var database = require('./../database/mySQL');
var helper = require('./../helper/helper');
var error = require('./../helper/error');
var fcm = require('./../communication/FCM');
var async = require('async');

var projectHandler={};

projectHandler.getListByUser = function (callingUser, callback) {
    var callingUserId = callingUser.user_id;
    database.project.getListByUserId(callingUserId,function(err, result){
        if(!err){
            callback(null,result)
        }else{
            callback(err,null)
        }
    })
};

projectHandler.save = function (projectValues, callingUser, callback) {
    var callingUserName = callingUser.user_name;
    var callingUserId = callingUser.user_id;
    projectValues.fk_user_id = callingUser.user_id;
    database.project.save(projectValues,function(err, savedProject){
        if(!err){
            callback(null,savedProject);
            fcm.projectSaved(savedProject.project_id, callingUserId, callingUserName,function (err, result) {
                // no one to notifie about
            });
        } else {
            callback(err,null)
        }
    });
};

projectHandler.getById = function (projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    userHasAnyRelationToProject(callingUserId, projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.project.getById(projectId,function(err, result){
                    if(!err){
                        callback(null,result)
                    }else{
                        callback(err,null)
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null)
        }
    });
};

projectHandler.update = function (projectValues, projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;
    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.project.update(projectId,projectValues,function(err, result){
                    if(!err){
                        callback(null,result);
                        fcm.projectActualized(projectId,callingUserName,function (err, result) {
                            // no one to notifie about
                        })
                    } else {
                        callback(err,null)
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null)
        }
    });
};

projectHandler.remove = function (projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;

    function getRelatedUserList(callback) {
        database.registrationId.getListByProjectId(projectId,function (err, result) {
            if(!err){
                callback(null, result)
            }else{
                callback(err,null)
            }
        })
    }

    async.waterfall([getRelatedUserList],function (err, userList) {
        if(!err){
            userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
                if (!err){
                    if(boolean){
                        database.project.remove(projectId, function (err, result) {
                            if (!err) {
                                callback(null,result);
                                fcm.projectDeleted(projectId, userList, callingUserName,function (err, result) {});// no one to notifie about
                            } else {
                                callback(err,null)
                            }
                        })
                    }else{
                        callback(error.getForbiddenError(),null);
                    }
                }else{
                    callback(err,null)
                }
            });
        }else{
            callback(err,null)
        }

    })

};

projectHandler.invite = function (projectId, collaboratorName, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    var callingUserName = callingUser.user_name;

    function getCollaborator(callback){
        database.user.getByName(collaboratorName,function(err, user){
            if(!err){
                callback(null,user)
            }else{
                callback(err,null)
            }
        })
    }

    function getProject(user, callback) {
        database.project.getById(projectId,function (err, project) {
            if(!err){
                callback(null,user,project)
            }else{
                callback(err,null,null)
            }
        })
    }

    async.waterfall([getCollaborator,getProject],function (err, collaborator, project){
        if (!err){
            var collaboratorId = collaborator.user_id;
            var projectOwnerId = project.fk_user_id;
            if(collaboratorId && projectOwnerId && collaboratorId != projectOwnerId){
                userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
                    if(!err){
                        if(boolean){
                            fcm.projectInvitationReceived(projectId,collaboratorId,callingUserName,function (err, result) {
                                if(!err){
                                    callback(null,result);
                                }else{
                                    callback(null,err);
                                }
                            });
                        }else{
                            callback(error.getForbiddenError(),null);
                        }
                    }else{
                        callback(err,null)
                    }
                });
            }else{
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

projectHandler.respond = function (projectId, hostName, status, callingUser, callback) {
    //TODO da die ProjectId vom Client geliefert wird, kann er einfach einem Projekt zusagen, obwohl er nie eingeladen wurde, muss in der weiteren Entwicklung angepasst werden
    var callingUserName = callingUser.user_name;
    var callingUserId = callingUser.user_id;

    function getCollaborator(callback){
        database.user.getByName(hostName,function(err, host){
            if(!err){
                callback(null,host)
            }else{
                callback(err,null)
            }
        })
    }

    async.waterfall([getCollaborator],function (err, host){
        if (!err){
            var hostId = host.user_id;
            if(hostId){
                if(status){
                    database.project.addUser(hostId,projectId,function (err, result) {
                        if(!err){
                            callback(null,result);
                            fcm.projectInvitationResponded(projectId, hostId, callingUserName, status, function (err, result) {
                                // no one to notifie about
                            });
                            fcm.projectSaved(projectId, callingUserId,callingUserName,function (err, result) {
                                // no one to notifie about
                            });
                        }else{
                            callback(err,null)
                        }
                    });
                }else{
                    fcm.projectInvitationResponded(projectId, hostId, callingUserName, status, function (err, result) {
                        // no one to notifie about
                    });
                }
            }else{
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    });
};

projectHandler.leave = function (projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    userHasRelationButIsNotOwnerFromProject(callingUserId,projectId,function (err, boolean) {
        if(!err){
            if(boolean){
                database.project.deleteUser(callingUserId,projectId,function(err, result){
                    if(!err){
                        callback(null,result)
                    }else{
                        callback(err,null)
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null)
        }
    });
};

projectHandler.getMilestones = function (projectId, callingUser, callback) {
    var callingUserId = callingUser.user_id;
    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.milestone.getListByProjectId(projectId,function(err, result){
                    if(!err){
                        callback(null,result)
                    }else{
                        callback(err,null)
                    }
                })
            }else{
                callback(error.getForbiddenError(),null);
            }
        }else{
            callback(err,null)
        }
    });
};

function userHasAnyRelationToProject(userId, projectId, callback) {
    database.project.getAllRelatedUserIds(projectId,function (err, relatedUserIds) {
        if(!err){
            var formattedArray = helper.formatUserIdArray(relatedUserIds);
            if (helper.isInArray(formattedArray,userId)){
                callback(null,true)
            }else{
                callback(null,false)
            }
        }else{
            callback(err,null)
        }
    })
}

function userHasRelationButIsNotOwnerFromProject(userId, projectId, callback) {
    database.project.getAllSharedUserIds(projectId,function (err, relatedUserIds) {
        if(!err){
            var formattedArray = helper.formatUserIdArray(relatedUserIds);
            if (helper.isInArray(formattedArray,userId)){
                callback(null,true)
            }else{
                callback(null,false)
            }
        }else{
            callback(err,null)
        }
    })
}

projectHandler.validateProjectValues = function (projectValues) {
    var name = projectValues.project_name;
    var starttime = projectValues.starttime;
    var endtime = projectValues.endtime;
    var description = projectValues.description;
    if(projectValues && name && starttime && endtime && description){
        return typeof name == "string" && typeof starttime == "number" && typeof endtime == "number" && typeof description == "string";
    }else{
        return false;
    }
};

module.exports = projectHandler;