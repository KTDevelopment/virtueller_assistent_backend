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
    api_key:''
};

var definitions = {

};

module.exports = {
    mysql:mysql,
    fcm:fcm,
    definitions:definitions
};