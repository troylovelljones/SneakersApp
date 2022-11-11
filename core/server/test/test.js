"use strict";

//const createApp = require('../test/base-app')
//const app = createApp;

//try to call gotcha
//app.gotcha(); //this code will not run

/*
TypeError: app.gotcha is not a function
    at Object.<anonymous> (/Users/troyjones/Documents/GitHub/SneakersApp/core/server/test/test.js:5:5)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1159:10)
    at Module.load (node:internal/modules/cjs/loader:981:32)
    at Function.Module._load (node:internal/modules/cjs/loader:822:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:77:12)
    at node:internal/main/run_main_module:17:47
*/

let x;

console.log(x++);