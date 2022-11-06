"use strict";

const urls = {};

module.exports = {

    
    getUserLoginUrls: (req, res) => {
        console.log(urls);
        res.status(200).send(urls);

    },

    setAppUrls: (adminUrl, authUrl, regUrl) => {  
        urls.admin = adminUrl;
        urls.auth = authUrl;
        urls.reg= regUrl;
    }
}