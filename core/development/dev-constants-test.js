const devConstants = require('./dev-constants');
const HOST_IP_ADDRESS = require('../../core/server/utils/host-ip');
const NODE_ENV = 'development';

console.log(NODE_ENV==='development' && (HOST_IP_ADDRESS + devConstants.randomIpTuple()));

