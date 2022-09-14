
const SECURITY_APP = 'security/login';
module.exports =  {
        
        redirectToSecurityApp: (req, res) => {            
        console.log(`Redirecting to ${SECURITY_APP}.`);
        res.redirect(301, SECURITY_APP);
        
    }
}