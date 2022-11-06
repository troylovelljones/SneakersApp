'use strict';

const { createTokenAsync } = require('../services/token');
const { encryptPassword } = require('../services/password');
const { getSecrets } = require('./secrets');

const servers = [
  {
    id: '633a67dce78e495ce6088db2',
    password: 'q94ui##SFe23fe764@$xWp69goFZ6mEEx1#ukDf*gbFfhpOJp1'
  }
  /* { 
            id: '192.168.201.6', password: 
                'Uj427vJ1Zmc9xJrZdWxXA5WX8GqkRsrBc50bxQ69' },
        { 
            id: '192.168.201.7', password: 
                'ngdCEK49H19ykVasfvs4BkpFzRhX7zLCvT1KHM2R' },
        {
            id: '192.168.201.8', password: 
                'Dc2b4djt5PD7csJgPaM7gE9En62pXk2ZGD63Dk6j' },
        {
            id: '192.168.201.9', password: 
                '6AocNxjLZHM9FyduAp4yon8vaxiXucwGgbZd9RoD' },
        {
            id: '6342be10548aec600cca9423', password:
                'BR6choPid5pRedaWripOpRlDraF0ug4spUQ9modu'
        }    */
];

(async () => {
  for (const server of servers) {
    const { id, password } = server;
    const accessToken = await createTokenAsync(id, 'Access');
    const accessTokenSecret = accessToken.secret;
    const refreshToken = await createTokenAsync(id, 'Refresh');
    const refreshTokenSecret = refreshToken.secret;
    const encryptedPassword = await encryptPassword(password);
    try {
      const Secrets = await getSecrets();
      console.log('Secrets');
      console.log(accessTokenSecret);
      console.log(refreshTokenSecret);
      console.log(encryptedPassword);
      let result = await Secrets.saveSecret(encryptedPassword, id, 'Password');
      console.log(result);
      result = await Secrets.saveSecret(accessToken.jwt, id, 'Access Token');
      console.log(result);
      result = await Secrets.saveSecret(
        accessTokenSecret,
        id,
        'Access Token Secret'
      );
      console.log(result);
      result = await Secrets.saveSecret(refreshToken.jwt, id, 'Refresh Token');
      console.log(result);
      result = await Secrets.saveSecret(
        refreshTokenSecret,
        id,
        'Refresh Token Secret'
      );
      console.log(result);
      break;
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  }
  process.exit();
})();
