const path  = require('path');

const { resolve } = path;
const { getValueFromConfigFile, saveValueToConfig } = require('./config-file')(resolve('../core/server/utils/config/','.cfg'));

(async () => {
    const password = await getValueFromConfigFile('PASSWORD');
    console.log('Password',password);
})();
