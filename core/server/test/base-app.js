
const express = require('express');

const createApp =  () => {
    const app = express();
    return app;
}

//define a function gotcha, that takes app as a paramter
const gotcha = (app) => {
    app.gotcha();
}

module.exports = gotcha