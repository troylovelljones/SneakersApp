const { verify, sign } = require('jsonwebtoken');

const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNDBlZDVhNTQ4YWVjNjAwY2NhOGZkNSIsInRva2VuVHlwZSI6IkFjY2VzcyBUb2tlbiIsImV4cGlyYXRpb24iOnsiZXhwaXJlc0luIjoiMW0ifSwiaWF0IjoxNjY1NTA5NTY4LCJleHAiOjE2NjU1MDk2Mjh9.8URVnZMPuoyi8kSjuElbtcyJjDMdluPUjoPssZfC6Rg';
let secret =  '676a7744-ddf0-4dfe-aa54-c8d373c421ab';

const { v4 } = require('uuid');

const uuidSecret = v4();

const data = { message: 'Hello World' }

let token = sign(data, uuidSecret);
console.log(token);
console.log(uuidSecret);

const payload =  verify(token, uuidSecret);
console.log(payload);

const { authenticateTokenAsync, createTokenAsync } = require('../../secrets-management/token');

( async() => {
    const { jwt, secret } = await createTokenAsync(10, 'Access Token');
    const payload = await authenticateTokenAsync(jwt, secret);
    console.log(payload);



})();

