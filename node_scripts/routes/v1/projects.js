var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var fcm = require('./../../communication/FCM');
var async = require('async');
var router = express.Router();


router.get('/', function(req, res, next) {
    database.getProjects(function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.post('/', function(req, res, next) {
    var project = req.body.project;
    var userName = req.body.user_name;

    function getUser(callback){
        database.getUserByName(userName,function(err,user){
            if(!err){
                // wenn user valide, dann stehen seine daten im result sonst ist es ein leeres object
                if(user.user_name && user.password){
                    callback(null,user)
                }else{
                    callback(error.getBadRequestError(),null);
                }
            }else{
                callback(err,null);
            }
        });
    }

    async.waterfall([getUser],function (err, user){
        if (!err){
            project.fk_user_id = user.user_id;
            database.saveProject(project,function(err,result){
                if(!err){
                    res.json(result)
                } else {
                    helper.sendResponse(res,err)
                }
            });
        }else{
            helper.sendResponse(res,err);
        }
    });

});

router.get('/:project_id', function(req, res, next) {
    try {
        var projectId = parseInt(req.params.project_id, 10);
    }catch (e){
        helper.sendResponse(res,error.getBadRequestError())
    }

    database.getProjectById(projectId,function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.put('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var project_values = req.body.project;

    if (!isNaN(projectId)){
        database.updateProject(projectId,project_values,function(err,result){
            if(!err){
                res.json(result)
            } else {
                helper.sendResponse(res,err)
            }
        })
    } else {
        helper.sendResponse(res,error.getBadRequestError())
    }

});

router.delete('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    if (!isNaN(projectId)) {
        database.deleteProjectById(projectId, function (err, result) {
            if (!err) {
                res.json(result)
            } else {
                helper.sendResponse(res, err)
            }
        })
    } else {
        helper.sendResponse(res, error.getBadRequestError())
    }
});

router.post('/:project_id/share', function(req, res, next){
    var projectId = req.params.project_id;
    var userName = req.body.user_name;

    function getUser(callback){
        database.getUserByName(userName,function(err,user){
            if(!err){
                callback(null,user)
            }else{
                callback(err,null)
            }
        })
    }

    async.waterfall([getUser],function (err, user){
        if (!err){
            var userId = parseInt(user.user_id);
            console.log(userId);
            if(userId){
                database.addUserToProject(userId,projectId,function(err,result){
                    if(!err){
                        fcm.projectShared(projectId,userId,function(err,result){
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
                helper.sendResponse(res,error.getBadRequestError())
            }
        }else{
            helper.sendResponse(res,err);
        }
    });

    //todo kann nach Absprache gelöscht werden
    // var usersToShare = req.body.users;
    //var userToShare = req.body.user_id;
    //var failures = 0;
    //var success = 0;
    //var list=[];
    //
    //if(usersToShare && userToShare){
    //    helper.sendResponse(res,error.getBadRequestError());
    //}else{
    //    if(usersToShare){
    //        async.forEach(usersToShare,function(userId,callback){
    //            database.addUserToProject(userId,projectId,function(err,result){
    //                if(!err){
    //                    success = success+1;
    //                    list.push({userId:userId,status:"success"});
    //                    callback();
    //                }else{
    //                    failures = failures+1;
    //                    list.push({userId:userId,status:"failure"});
    //                    callback();
    //                }
    //            });
    //        },function(err){
    //            sendAnswer()
    //        });
    //    }else{
    //        if(userToShare){
    //            database.addUserToProject(userToShare,projectId,function(err,result){
    //                if(!err){
    //                    success = success+1;
    //                    list.push({userId:userToShare,status:"success"});
    //                    sendAnswer()
    //                }else{
    //                    failures = failures+1;
    //                    list.push({userId:userToShare,status:"failure"});
    //                    sendAnswer()
    //                }
    //            });
    //        }else{
    //            helper.sendResponse(res,error.getBadRequestError());
    //        }
    //    }
    //
    //    function sendAnswer(){
    //        var answer = {
    //            failures:failures,
    //            success:success,
    //            result:list
    //        };
    //        res.json(answer)
    //    }
    //
    //}
});

//Milestone

router.post('/:project_id/milestones',function(req,res,next){
    var projectId = parseInt(req.params.project_id, 10);
    var milestone = req.body.milestone;
    if (!isNaN(projectId)){
        var newMilestone = milestone;
        newMilestone.fk_project_id = projectId;
        database.addMilestone(newMilestone,function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else {
        helper.sendResponse(res, error.getBadRequestError())
    }
});

router.put('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = parseInt(req.params.project_id, 10);
    var milestoneId = parseInt(req.params.milestone_id, 10);
    var milestoneValues = req.body.milestone;
    if (!isNaN(milestoneId) && !isNaN(projectId)) {
        database.updateMilestone(projectId,milestoneId,milestoneValues, function (err, result) {
            if (!err) {
                res.json(result)
            } else {
                helper.sendResponse(res, err)
            }
        })
    } else {
        helper.sendResponse(res, error.getBadRequestError())
    }
});

router.delete('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var milestoneId = req.params.milestone_id;
    if (!isNaN(milestoneId)) {
        database.deleteMilestoneById(projectId,milestoneId, function (err, result) {
            if (!err) {
                res.json(result)
            } else {
                helper.sendResponse(res, err)
            }
        })
    } else {
        helper.sendResponse(res, error.getBadRequestError())
    }
});

router.get('/:project_id/milestones', function(req, res, next) {
    var projectId = req.params.project_id;
    database.getMilestones(projectId,function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

router.get('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var milestoneId = req.params.milestone_id;
    database.getMilestoneById(projectId,milestoneId,function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});

module.exports = router;