'use strict';
//cookie middleware tester
module.exports = function test(req, res, next) {
    console.log('called');
    next(); // <-- important!
};

