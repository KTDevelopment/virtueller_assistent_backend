var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var fcm = require('./../../communication/FCM');
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
    database.saveProject(project,function(err,result){
        if(!err){
            res.json(result)
        } else {
            helper.sendResponse(res,err)
        }
    })
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