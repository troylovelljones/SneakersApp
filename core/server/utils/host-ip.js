const os = require('os');
const { throwError } = require('../../validation/validation');

module.exports = (() => {
    const iface = Object.keys(os.networkInterfaces()).filter(iface => iface.startsWith('en'))[0];
    const networkInterfaces =  os.networkInterfaces()[iface];
    !networkInterfaces && throwError('Could not determine network ip address!');
    return networkInterfaces && networkInterfaces.filter(item => item.netmask.startsWith('255'))[0].address
})();