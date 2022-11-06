"use strict";

const requestCounter = { requestCount: 0 };

const requestCount = (req, res, next) => {
    requestCounter.requestCount++;
    next();
}

const getRequestCount = () => {
    return requestCounter.requestCount;
}

module.exports = { requestCount, getRequestCount };