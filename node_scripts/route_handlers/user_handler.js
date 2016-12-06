var database = require('./../database/mySQL');
var error = require('./../helper/error');

var userHandler={};

userHandler.getList = function (callback) {
    database.user.getList(function(err, result){
        if(!err){
            callback(null,result);
        }else{
            callback(err,null);
        }
    })
};

userHandler.getByIdOrName = function (user_id_or_user_name, callback) {
    var isId;
    if(isNaN(user_id_or_user_name)){
        var userName = user_id_or_user_name;
        isId = false;
    }else{
        var userId = parseInt(user_id_or_user_name, 10);
        isId = true;
    }

    if(isId){
        database.user.getById(userId,function(err, user){
            if(!err){
                callback(null,user)
            }else{
                callback(err,null)
            }
        })
    }else{
        database.user.getByName(userName,function(err, user){
            if(!err){
                if(user.user_name){
                    callback(null,user)
                }else{
                    callback(error.getBadRequestError(),null)
                }
            }else{
                callback(err,null)
            }
        })
    }
};

userHandler.remove = function (userId, callback){
    database.user.remove(userId, function (err, result) {
        if (!err) {
            callback(null,result)
        } else {
            callback(err,null)
        }
    })
};


module.exports = userHandler;