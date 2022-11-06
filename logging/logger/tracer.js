"use strict";

const { throwError } = require('../../core/validation/validation');
const { updateModuleLoggingMetaData } = require('./logger-manager');
const { generateUniqueKey } = require('../../core/server/utils/extended-app-utils')

module.exports = {
    startTrace: (module) => {
        const traceId = generateUniqueKey();
        module.traceId = traceId;
        updateModuleLoggingMetaData(module, { traceId });
        return module.traceId;
    },

    stopTrace: (module, traceId) => {
        traceId !== module.traceId && throwError('Critical tracing error!');
        updateModuleLoggingMetaData(module, {traceId: null});
    }
}