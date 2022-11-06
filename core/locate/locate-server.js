"use strict"

const axios = require('axios');

module.exports = (registrationServerUrl) => {
    return async (servername, token) => {
        try {
         
            const response = await axios({ method: 'get', url: registrationServerUrl + `/locate/server?servername=${servername}&token=${token.jwt}`});
            
        return response.data;
        } catch (e) {
            console.log(e);
            console.log(e.stack);
            console.log(`Could not locate ${servername}!`);
        }       
    }
}