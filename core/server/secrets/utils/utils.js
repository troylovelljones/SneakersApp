const { encryptPassword } = require('../services/password');

encryptPassword('6d6cb0ef-7ce1-4338-b07e-61b3b58899c9').then(
    encryptedPassword => console.log(encryptedPassword));