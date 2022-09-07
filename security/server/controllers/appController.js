
require('dotenv').config();

const SECURITY_API_APP = process.env.SECURITY_API_APP || 'Security Api App';

module.exports = {
    getApiServerInformation: async (req, res) => {
        try {
            console.log('Locating an api server.'.yellow);
            const apiServer = await locate(SECURITY_API_APP);
            console.log(`Retrieved an api server: `.green, apiServer);
            const apiServerInfo = {ipAddress: apiServer.ipAddress, port: apiServer.port, endPoints: apiServer.urls};
            console.log('Sending api server information.')
            res.status(200).send(apiServerInfo);
        } catch (error) {
            console.log(error);
            res.status(400).send('Could not locate the appropriate server.  Please try to reload the page.')
        }    
                                                                                   
     
    }
}