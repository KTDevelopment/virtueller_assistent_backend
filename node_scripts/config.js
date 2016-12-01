/**
 * Created by Snare on 04.08.16.
 */

"use strict";

var mysql = {
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'virtueller_assistent',
    port: '8080',
    debug: false
};

var fcm ={
    api_key:'AAAAdR9Fr1Q:APA91bFEUytNsfb3A30k6BxQ8Q2TdvkwwJry2-M74CVd7Qcxz-OVhQvPyUgcV9V2X48aefBLEOIvMIiww_3MKRTnmZX_rtr72VlmbKBVzQoQzmtakor3H59uYZiAA80FZf29tazf-7e35ENXwcCnHXAo0bta8xVxew'
};

var definitions = {

};

module.exports = {
    mysql:mysql,
    fcm:fcm,
    definitions:definitions
};