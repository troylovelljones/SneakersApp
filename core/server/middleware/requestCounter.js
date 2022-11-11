"use strict";

const requestCounter = { requestCount: 0 };

const requestCount = (req, res, next) => {
    requestCounter.requestCount++;
    next();
}

const getRequestCount = () => {
    const count = requestCounter.requestCount;
    requestCounter.requestCount = 0;
    return count;
}

module.exports = { requestCount, getRequestCount };