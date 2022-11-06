//generate a server passowrd for the registered servers
const {hash} = require('bcrypt');
const secret = process.argv[2];
(async() => {console.log(await hash(secret, 12))})();



