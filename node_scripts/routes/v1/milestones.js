var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var fcm = require('./../../communication/FCM');
var async = require('async');
var router = express.Router();


//Milestone

router.post('/',function(req,res,next){
    var projectId = req.body.project_id;
    var milestone = req.body.milestone;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProjectByProjectId(callingUserId,projectId,function (err, boolean) {
        if (!err){
            if(boolean){
                if(milestone && milestone.milestone_name && milestone.deadline && milestone.description){
                    milestone.fk_project_id = projectId;
                    database.milestone.add(milestone,function(err, createdMilestone){
                        if(!err){
                            fcm.milestoneAdd(projectId,createdMilestone.milestone_id,sharingUserName,function (err, result) {
                                var answer;
                                if(!err){
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                    helper.sendResponse(res,answer);
                                }else{
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                    helper.sendResponse(res,answer);
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

router.post('/milestones/:milestone_id/note',function (req, res, next) {
    var milestoneId = parseInt(req.params.milestone_id, 10);
    var note = req.body.note;

    var callingUserName = req.callingUserName;
    var callingUserId = req.callingUserId;


    userHasAnyRelationToProjectByMilestoneId(callingUserId,milestoneId,function (err, boolean,projectId) {
        if(!err){
            if(boolean){
                database.milestone.addNote(projectId,milestoneId,note, function (err, result) {
                    if (!err) {
                        fcm.milestoneNoteAdd(projectId,milestoneId,callingUserName,function(err,result){
                            var answer;
                            if(!err){
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                helper.sendResponse(res,answer);
                            }else{
                                answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                helper.sendResponse(res,answer);
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



});

router.put('/milestones/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var milestoneValues = req.body.milestone;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProjectByMilestoneId(callingUserId,milestoneId,function (err, boolean,projectId) {
        if (!err){
            if(boolean){
                if (!isNaN(milestoneId)) {
                    database.milestone.update(milestoneId,milestoneValues, function (err, updatedMilestone) {
                        if (!err) {
                            fcm.milestoneActualized(projectId,updatedMilestone.milestone_id,sharingUserName,function (err, result) {
                                var answer;
                                if(!err){
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                    helper.sendResponse(res,answer);
                                }else{
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                    helper.sendResponse(res,answer);
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

router.delete('/milestones/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var callingUserId = req.callingUserId;
    var sharingUserName = req.callingUserName;

    userHasAnyRelationToProjectByMilestoneId(callingUserId,milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                if (!isNaN(milestoneId)) {
                    database.milestone.remove(milestoneId, function (err, result) {
                        if (!err) {
                            fcm.milestoneDeleted(projectId,milestoneId,sharingUserName,function (err, result) {
                                var answer;
                                if(!err){
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),result]);
                                    helper.sendResponse(res,answer);
                                }else{
                                    answer = helper.getMultiStatusResponse([helper.getRestSuccessResponse(),err]);
                                    helper.sendResponse(res,answer);
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

router.get('/milestones/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var callingUserId = req.callingUserId;

    userHasAnyRelationToProjectByMilestoneId(callingUserId,milestoneId,function (err, boolean, projectId) {
        if (!err){
            if(boolean){
                if(!isNaN(milestoneId)){
                    database.milestone.getById(milestoneId,function(err, result){
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

function userHasAnyRelationToProjectByMilestoneId(userId, milestoneId, callback) {

    function getProject(user, callback) {
        database.project.getByMilestoneId(milestoneId,function (err, project) {
            if(!err){
                callback(null,user,project)
            }else{
                callback(err,null,null)
            }
        })
    }

    async.waterfall([getProject],function (err, project){
        if (!err){
            if (project && !isNaN(userId)) {
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

function userHasAnyRelationToProjectByProjectId(userId, projectId, callback) {

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