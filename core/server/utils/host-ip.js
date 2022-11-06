const os = require('os');

module.exports = (() => {
    const iface = Object.keys(os.networkInterfaces()).filter(iface => iface.startsWith('en'))[0];
    return os.networkInterfaces()[iface].filter(item => item.netmask.startsWith('255'))[0].address
})();