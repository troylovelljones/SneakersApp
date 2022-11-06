"use strict"
const colors = require('colors');
const getConnection = require('../mongo-database');
const ENV = require('dotenv').config();


console.log(process.env);

(async() => {
  const db = await getConnection();
  console.log(db);
  await db.modelNames().forEach(name => console.log(name));
  db && console.log('\n\nSUCCESS\n\n'.green.bold)
})()
 