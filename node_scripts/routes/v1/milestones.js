var express = require('express');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var milestoneHandler = require('./../../route_handlers/milestone_handler');
var router = express.Router();


//Milestone

router.post('/:milestone_id/note',function (req, res, next) {
    var milestoneId = req.params.milestone_id ;
    var note = req.body.note;
    var callingUser = req.callingUser;

    if(note && !isNaN(milestoneId)){
        milestoneHandler.addNote(milestoneId,note,callingUser,function (err, result) {
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

router.post('/:milestone_id/achieve',function (req, res, next) {
    var milestoneId = req.params.milestone_id;
    var achieve = req.body.achieve;
    var callingUser = req.callingUser;

    if(achieve && !isNaN(milestoneId)){
        milestoneHandler.achieve(milestoneId,achieve,callingUser,function (err, result) {
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

router.put('/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var milestoneValues = {
        milestone_name:req.body.milestone_name,
        deadline:req.body.deadline,
        description:req.body.description,
        achieved:req.body.achieved,
        note:req.body.note
    };

    var callingUser = req.callingUser;
    if(milestoneHandler.validateMilestoneValues(milestoneValues) && !isNaN(milestoneId)){
        milestoneHandler.update(milestoneId,milestoneValues,callingUser,function (err, result) {
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

router.delete('/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var callingUser = req.callingUser;
    if(!isNaN(milestoneId)){
        milestoneHandler.remove(milestoneId, callingUser, function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        });
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }
});

router.get('/:milestone_id', function(req, res, next) {
    var milestoneId = req.params.milestone_id;
    var callingUser = req.callingUser;

    if(!isNaN(milestoneId)){
        milestoneHandler.getById(milestoneId, callingUser, function(err,result){
            if(!err){
                res.json(result)
            }else{
                helper.sendResponse(res,err)
            }
        });
    }else{
        helper.sendResponse(res,error.getBadRequestError())
    }
});

module.exports = router;