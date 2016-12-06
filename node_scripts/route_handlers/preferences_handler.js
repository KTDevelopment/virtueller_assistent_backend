var database = require('./../database/mySQL');
var error = require('./../helper/error');

var preferencesHandler={};

preferencesHandler.login = function (email, password, callback) {
    database.user.getByEmailAndPassword(email,password,function(err, user){
        if(!err){
            // wenn user valide, dann stehen seine daten im result
            if(user.user_name && user.password){
                delete user.password;
                callback(null,user)
            }else{
                callback(error.getBadRequestError(),null);
            }
        }else{
            callback(err,null);
        }
    })
};

preferencesHandler.register = function (userName, password, email, callback) {
    database.user.save(userName,password,email,function(err, result){
        if(!err){
            callback(null,result)
        } else {
            callback(err,null);
        }
    })
};



module.exports = preferencesHandler;