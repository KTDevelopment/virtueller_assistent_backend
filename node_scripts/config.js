/**
 * Created by Snare on 04.08.16.
 */

"use strict";

var mysql = {
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'virtueller_assistent',
    port: '8889',
    debug: false
};

var fcm ={
    api_key:'AAAAFhFxcMY:APA91bFJ2J4ZAB4yvlmkcrTBVZX1qYK4a7K70FpJlA5o7hCn3Bi9-etCFakQXtJ6SwcUkUatuAbEICCZCE0K-O4A-31pORtVm33Ii3m6FyCFFfvtuvmjHYHQlcIoGf4vEYEH_GyOZegsFaDNa7izS8K4wyFNLaYKFg'
};

var definitions = {

};

module.exports = {
    mysql:mysql,
    fcm:fcm,
    definitions:definitions
};