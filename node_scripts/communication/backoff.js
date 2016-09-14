//==================== Dependencies =========================================================================================================================================================================================================================================================

var backoff = require('backoff');
var error = require('./../helper/error');

//==================== exponential Backoff =========================================================================================================================================================================================================================================================

/**
 * führt ein fibonacci backoff durch, bei dem in gewissen abständen
 * die angegebene Funktion mit den angegebenen parametern ausgeführt wird
 * @param rety_after
 * @param retryTimes
 * @param fkt
 * @param fktParams
 * @param callback
 */
function exponentialBackoff (rety_after, retryTimes, fkt,  fktParams, callback) {
    var call = backoff.call(fkt, fktParams, function(err, res){
        //wird als letzte Funktion aufgerufen, entweder es klappt einmal oder alle Failen
        console.log("Anzahl Versuche vom exponential-Backoff: ",call.getNumRetries());

        if (err){
            callback(err,null);
            error.writeErrorLog("exponentialBackoff",err); //TODO
        }else{
            callback(null, res);
        }

    });

    var fibonaccioptions ={
        randomisationFactor: 0,
        initialDelay: rety_after,
        maxDelay: 100000
    };

    call.retryIf(function(err){return err.code == 504;});
    call.setStrategy(new backoff.FibonacciStrategy(fibonaccioptions));
    call.failAfter(retryTimes);
    call.start();
}

module.exports = {
    exponentialBackoff:exponentialBackoff
};