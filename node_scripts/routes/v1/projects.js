var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var fcm = require('./../../communication/FCM');
var async = require('async');
var router = express.Router();


router.get('/', function(req, res, next) {
    var callingUserId = req.callingUserId;
    database.project.getListByUserId(callingUserId,function(err, result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.post('/', function(req, res, next) {
    var project = req.body.project;

    if(project && project.project_name && project.starttime && project.endtime && project.description){
        project.fk_user_id = req.callingUserId;
        database.project.save(project,function(err, result){
            if(!err){
                res.json(result)
            } else {
                helper.sendResponse(res,err)
            }
        });
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }

});

router.get('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUserId = req.callingUserId;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.project.getById(projectId,function(err, result){
                    if(!err){
                        res.json(result)
                    }else{
                        helper.sendResponse(res,err)
                    }
                })
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

router.put('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var project_values = req.body.project;
    var callingUserId = req.callingUserId;
    var callingUserName = req.callingUserName;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if(project_values.project_name && project_values.starttime && project_values.endtime && project_values.description){
                    database.project.update(projectId,project_values,function(err, result){
                        if(!err){
                            fcm.projectActualized(projectId,callingUserName,function (err, result) {
                                if(!err){
                                    res.json(result);
                                }else{
                                    helper.sendResponse(res,err)
                                }
                            })
                        } else {
                            helper.sendResponse(res,err)
                        }
                    })
                }else{
                    helper.sendResponse(res,error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

/**
 * löscht ein Projekt mittels der Projekt_Id
 */
router.delete('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUserId = req.callingUserId;
    var callingUserName = req.callingUserName;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.project.remove(projectId, function (err, result) {
                    if (!err) {
                        fcm.projectDeleted(projectId,callingUserName,function (err, result) {
                            if(!err){
                                res.json(result)
                            }else{
                                helper.sendResponse(res, err)
                            }
                        });
                    } else {
                        helper.sendResponse(res, err)
                    }
                })
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });

});

/**
 * fügt ein User zu einem Projekt hinzu.
 * Bedingungen:
 *          neuer User != Owner des Projektes
 *          neuer User hat Registration_Id
 */
router.post('/:project_id/share', function(req, res, next){
    var projectId = req.params.project_id;
    var userName = req.body.user_name;

    var sharingUserName = req.callingUserName;
    var callingUserId = req.callingUserId;

    function getUser(callback){
        database.user.getByName(userName,function(err, user){
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

    async.waterfall([getUser,getProject],function (err, user, project){
        if (!err){
            var userId = user.user_id;
            var projectOwnerId = project.fk_user_id;
            if(userId && projectOwnerId && userId != projectOwnerId){
                userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
                    if(!err){
                        if(boolean){
                            database.project.addUser(userId,projectId,function(err, result){
                                if(!err){
                                    fcm.projectShared(projectId,userId,sharingUserName,function(err,result){
                                        if(!err){
                                            res.json(result);
                                        }else{
                                            helper.sendResponse(res,err);
                                        }
                                    })
                                }else{
                                    helper.sendResponse(res,err);
                                }
                            })
                        }else{
                            helper.sendResponse(res,error.getForbiddenError());
                        }
                    }else{
                        helper.sendResponse(res,err);
                    }
                });
            }else{
                helper.sendResponse(res,error.getBadRequestError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

router.post('/:project_id/leave',function (req, res, next) {
    var projectId = req.params.project_id;
    var callingUserId = req.callingUserId;

    userHasRelationButIsNotOwnerFromProject(callingUserId,projectId,function (err, boolean) {
        if(!err){
            if(boolean){
                database.project.deleteUser(callingUserId,projectId,function(err, result){
                    if(!err){
                        if(!err){
                            res.json(result);
                        }else{
                            helper.sendResponse(res,err);
                        }
                    }else{
                        helper.sendResponse(res,err);
                    }
                })
            }else{
                helper.sendResponse(res,error.getForbiddenError());
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

//Milestone

router.post('/:project_id/milestones',function(req,res,next){
    var projectId = req.params.project_id;
    var milestone = req.body.milestone;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if(milestone && milestone.milestone_name && milestone.deadline && milestone.description){
                    milestone.fk_project_id = projectId;
                    database.milestone.add(milestone,function(err, createdMilestone){
                        if(!err){
                            fcm.milestoneAdd(projectId,createdMilestone.milestone_id,sharingUserName,function (err, result) {
                                if(!err){
                                    res.json(result)
                                }else{
                                    helper.sendResponse(res,err)
                                }
                            });
                        }else{
                            helper.sendResponse(res,err)
                        }
                    })
                }else{
                    helper.sendResponse(res,error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });

});

router.post('/:project_id/milestones/:milestone_id/note',function (req, res, next) {

    var projectId = parseInt(req.params.project_id, 10);
    var milestoneId = parseInt(req.params.milestone_id, 10);
    var note = req.body.note;

    var callingUserName = req.callingUserName;
    var callingUserId = req.callingUserId;

    function getProjekt(callback) {
        if(!isNaN(projectId)){
            database.project.getById(projectId,function (err, project) {
                if(!err){
                    callback(null,project)
                }else{
                    callback(err,null)
                }
            })
        }
    }

    async.waterfall([getProjekt],function (err, project){
        if (!err){
            // if User gehört zum Projekt
            userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
                if(!err){
                    if(boolean){
                        database.milestone.addNote(projectId,milestoneId,note, function (err, result) {
                            if (!err) {
                                fcm.milestoneNoteAdd(projectId,milestoneId,callingUserName,function(err,result){
                                    if(!err){
                                        res.json(result);
                                    }else{
                                        helper.sendResponse(res,err);
                                    }
                                })
                            } else {
                                helper.sendResponse(res, err)
                            }
                        });
                    }else{
                        helper.sendResponse(res, error.getForbiddenError())
                    }
                }else{
                    helper.sendResponse(res, err)
                }
            });

        }else{
            helper.sendResponse(res,err);
        }
    });


});

router.put('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var milestoneId = req.params.milestone_id;
    var milestoneValues = req.body.milestone;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if (!isNaN(milestoneId)) {
                    database.milestone.update(projectId,milestoneId,milestoneValues, function (err, updatedMilestone) {
                        if (!err) {
                            fcm.milestoneActualized(projectId,updatedMilestone.milestone_id,sharingUserName,function (err, result) {
                                if(!err){
                                    res.json(result)
                                }else{
                                    helper.sendResponse(res,err)
                                }
                            });
                        } else {
                            helper.sendResponse(res, err)
                        }
                    })
                } else {
                    helper.sendResponse(res, error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

router.delete('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var milestoneId = req.params.milestone_id;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if (!isNaN(milestoneId)) {
                    database.milestone.remove(projectId,milestoneId, function (err, result) {
                        if (!err) {
                            fcm.milestoneDeleted(projectId,milestoneId,sharingUserName,function (err, result) {
                                if(!err){
                                    res.json(result)
                                }else{
                                    helper.sendResponse(res,err)
                                }
                            });
                        } else {
                            helper.sendResponse(res, err)
                        }
                    })
                } else {
                    helper.sendResponse(res, error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });
});

router.get('/:project_id/milestones', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUserId = req.callingUserId;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                database.milestone.getListByProjectId(projectId,function(err, result){
                    if(!err){
                        res.json(result)
                    }else{
                        helper.sendResponse(res,err)
                    }
                })
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });


});

router.get('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var milestoneId = req.params.milestone_id;
    var callingUserId = req.callingUserId;

    userHasAnyRelationToProject(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if(!isNaN(milestoneId)){
                    database.milestone.getById(projectId,milestoneId,function(err, result){
                        if(!err){
                            res.json(result)
                        }else{
                            helper.sendResponse(res,err)
                        }
                    })
                }else{
                    helper.sendResponse(res,error.getBadRequestError())
                }
            }else{
                helper.sendResponse(res,error.getForbiddenError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });


});

function userHasAnyRelationToProject(userId, projectId, callback) {
    if (!isNaN(projectId) && !isNaN(userId)) {
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
    } else {
        callback(error.getBadRequestError(),null)
    }
}

function userHasRelationButIsNotOwnerFromProject(userId, projectId, callback) {
    if (!isNaN(projectId) && !isNaN(userId)) {
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
    } else {
        callback(error.getBadRequestError(),null)
    }
}

module.exports = router;