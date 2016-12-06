var express = require('express');
var registrationIdHandler = require('./../../route_handlers/registration_id_handler');
var helper = require('./../../helper/helper');
var error = require('./../../helper/error');
var router = express.Router();

router.post('/', function(req, res, next) {
    var registrationId = req.body.registration_id;

    if(registrationId){
        registrationIdHandler.save(registrationId,req.callingUser,function (err, result) {
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


module.exports = router;