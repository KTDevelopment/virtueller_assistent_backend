var express = require('express');
var database = require('./../../database/mySQL');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
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

router.get('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    if(!isNaN(projectId)){
        database.getProjectById(projectId,function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }
});

router.put('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var project = req.body.project;
    if(projectId == undefined || projectId == 0){
        database.saveProject(project,function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else {
        if (!isNaN(projectId)) {
            database.updateProject(project, function (err, result) {
                if (!err) {
                    res.json(result)
                } else {
                    helper.sendResponse(res, err)
                }
            })
        } else {
            helper.sendResponse(res, error.getBadRequestError())
        }
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

router.put('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var milestone = req.body.milestone;
    if(milestoneId == undefined || milestoneId == 0){
        database.saveMilestone(project,function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else {
        if (!isNaN(milestoneId)) {
            database.updateMilestone(milestone, function (err, result) {
                if (!err) {
                    res.json(result)
                } else {
                    helper.sendResponse(res, err)
                }
            })
        } else {
            helper.sendResponse(res, error.getBadRequestError())
        }
    }
});

router.delete('/:project_id/milestones/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    if (!isNaN(milestoneId)) {
        database.deleteMilestoneById(projectId, function (err, result) {
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
    database.getMilestones(function(err,result){
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })
});


/*TODO implemet
 ein meilenstein zum projekt hinzufügen -- put -- /:project_id/milestones/:milestone_id -- 0 oder undef hinzufügen, sonst updaten, milestone im body
 ein meilenstein vom projekt löschen -- delete -- /:project_id/milestones/:milestone_id
 ein meilenstein vom projekt aktualisieren -- siehe hinzufügen
 alle meilensteine eines projektes ausgeben -- get -- /:project_id/milestones

 */


module.exports = router;