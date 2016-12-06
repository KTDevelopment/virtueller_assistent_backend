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
    projectValues.fk_user_id = callingUser.user_id;
    database.project.save(projectValues,function(err, result){
        if(!err){
            callback(null,result)
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
                        fcm.projectActualized(projectId,callingUserName,function (err, result) {
                            var answer;
                            if(!err){
                                console.log("kein fehler hier ist das result: ",result);
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                callback(null,answer);
                            }else{
                                console.log("fehler : ",err);
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                callback(null,answer);
                            }
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
    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.project.remove(projectId, function (err, result) {
                    if (!err) {
                        fcm.projectDeleted(projectId,callingUserName,function (err, result) {
                            var answer;
                            if(!err){
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                callback(null,answer);
                            }else{
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                callback(null,answer);
                            }
                        });
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

projectHandler.share = function (projectId, collaboratorName, callingUser, callback) {
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
                            database.project.addUser(collaboratorId,projectId,function(err, result){
                                if(!err){
                                    fcm.projectShared(projectId,collaboratorId,callingUserName,function (err, result) {
                                        var answer;
                                        if(!err){
                                            answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                            callback(null,answer);
                                        }else{
                                            answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                            callback(null,answer);
                                        }
                                    });
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

function userHasRelationButIsNotOwnerFromProject(userId, projectId, callback) {
    database.project.getAllSharedUserIds(projectId,callback,function (err, relatedUserIds) {
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

module.exports = projectHandler;