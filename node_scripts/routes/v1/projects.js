var express = require('express');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var milestoneHandler = require('./../../route_handlers/milestone_handler');
var projectHandler = require('./../../route_handlers/project_handler');
var router = express.Router();


router.get('/', function(req, res, next) {
    var callingUser = req.callingUser;
    projectHandler.getListByUser(callingUser, function (err, result) {
        if(!err){
            res.json(result)
        }else{
            helper.sendResponse(res,err)
        }
    })

});

router.post('/', function(req, res, next) {
    var projectValues = {
        project_name:req.body.project_name,
        starttime:req.body.starttime,
        endtime:req.body.endtime,
        description:req.body.description
    };

    var callingUser = req.callingUser;
    if(projectHandler.validateProjectValues(projectValues)){
        projectHandler.save(projectValues, callingUser, function (err, result) {
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

router.get('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUser = req.callingUser;

    if(!isNaN(projectId)){
        projectHandler.getById(projectId,callingUser, function (err, result) {
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError());
    }
});

router.put('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var projectValues ={
        project_name:req.body.project_name,
        starttime:req.body.starttime,
        endtime:req.body.endtime,
        description:req.body.description
    };
    var callingUser = req.callingUser;

    if(projectHandler.validateProjectValues(projectValues) && !isNaN(projectId)){
        projectHandler.update(projectValues, projectId, callingUser, function (err, result) {
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError());
    }


});

router.delete('/:project_id', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUser = req.callingUser;
    if(!isNaN(projectId)){
        projectHandler.remove(projectId, callingUser, function (err, result) {
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError());
    }
});

/**
 * fügt ein User zu einem Projekt hinzu.
 * Bedingungen:
 *          neuer User != Owner des Projektes
 *          neuer User hat Registration_Id
 */
router.post('/:project_id/invite', function(req, res, next){
    var projectId = req.params.project_id;
    var userName = req.body.user_name;
    var callingUser = req.callingUser;

    if(userName && !isNaN(projectId)){
        projectHandler.invite(projectId, userName, callingUser, function (err, result) {
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

router.post('/:project_id/leave',function (req, res, next) {
    var projectId = req.params.project_id;
    var callingUser = req.callingUser;

    if(!isNaN(projectId)){
        projectHandler.leave(projectId, callingUser, function (err, result) {
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

//Milestones

router.post('/:project_id/milestones',function(req,res,next){
    var projectId = req.params.project_id;
    var milestoneValues = {
        milestone_name:req.body.milestone_name,
        deadline:req.body.deadline,
        description:req.body.description,
        achieved:0,
        note:req.body.note
    };
    var callingUser = req.callingUser;

    if(milestoneHandler.validateMilestoneValues(milestoneValues) && !isNaN(projectId)){
        milestoneHandler.add(milestoneValues,projectId,callingUser,function (err, result) {
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

router.get('/:project_id/milestones', function(req, res, next) {
    var projectId = req.params.project_id;
    var callingUser = req.callingUser;

    if(!isNaN(projectId)){
        projectHandler.getMilestones(projectId,callingUser, function (err, result) {
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        })
    }else{
        helper.sendResponse(res,error.getBadRequestError());
    }
});

module.exports = router;