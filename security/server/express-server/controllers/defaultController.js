//health check controller

const { Console } = console;

let appConsole = new Console({colorMode: true, groupIndentation: 3,
    stdout: process.stdout, stderr: process.stderr});

const {group, groupEnd, log} = appConsole;

module.exports = {
    
    apiTest: (req, res) => {
        group('Api healthcheck initiated.')
        res.status(200).send(`Server started successfully.`);
        log('-Api health endpoint reached successfully')
        groupEnd();
        log(`Api Healthcheck completed successfully.`)

    }    

}        

    