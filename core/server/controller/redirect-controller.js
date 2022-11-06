

module.exports =  {
        
        redirect: (appUrl) => 
            (req, res) => {            
                console.log(`Redirecting to ${appUrl}.`);
                res.redirect(301, appUrl);
        
            }
}