//health check controller
require('dotenv').config();
const { Console } = console;

let appConsole = new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, stderr: process.stderr});

const {group, groupEnd, log} = appConsole;

module.exports = {
    
    test: (req, res) => {
        group('Api healthcheck initiated.')
        res.status(200).send(`Server started successfully.`);
        log('-Api health endpoint reached successfully')
        groupEnd();
        log(`Api Healthcheck completed successfully.`)

    },
    
    kill: (req, res) => {
        group('Kill command recieved.')
        res.status(200).send(`Kill command initiated at ip address: ${process.env.SERVER_IP_ADDRESS}.`);
        log('Killing process');
        groupEnd();
        process.exit();
    }

    

}        

    