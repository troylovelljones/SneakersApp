
const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


const sendInBlueUrl = 'https://api.sendinblue.com/v3/smtp/email';
const emailFilePath = path.resolve(__dirname, '../html/email.html');
emailHtml = fs.readFileSync(emailFilePath, 'utf8');
console.log(emailHtml);

class SiteRegistrationEmail extends EventEmitter {

    send(username, email) {
      console.log('Sending message to submit email.')
      this.emit('registration', {username: username, email: email});
    }
}

const createPayload = (parameters) => {
  return {
    sender : {
      email :'yoursneakercollection@gmail.com',
      name :'YourSneakerCollection',
      
    },
    subject: 'Welcome to MySneakerCollection.com', //this is the default subject line
    htmlContent: emailHtml,
    messageVersions: [
      {
        to: [
          {
            email: parameters.email,
            name: 'User: ' + parameters.username
          } 
        ], 
        subject: 'Welcome to MySneakerCollection.com', //customized per message version
        params: {
          //these are variables within the email template
          //for the sneakers campaign in sendinblue
          username: parameters.username, 
          email: parameters.email 
        }
      }
    ]
  }
}
  
  const sendConfirmationEmail = async (params) => {
    const payload = createPayload(params);
    console.log('Sending confirmation email.')
    try {
      const result = await axios.post(sendInBlueUrl, payload, {
        headers: {
          'accept':'application/json',
          'api-key': process.env.EMAIL_API_KEY,
          'content-type': 'application/json'
        }});
        console.log('Result: ', result);
      return result;
    }
    
    catch (e) {
      console.log('Error sending email!'.red)
      console.log(e);     
    }
  
  }

const siteRegistrationEmail = new SiteRegistrationEmail();
siteRegistrationEmail.on('registration', sendConfirmationEmail);

module.exports = siteRegistrationEmail;

