/**
 * Created by Snare on 04.08.16.
 */

"use strict";

var mysql = {
    connectionLimit: 100,
    host: 'localhost',
    user: '',
    password: '',
    database: '',
    port: '',
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