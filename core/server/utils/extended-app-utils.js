"use strict";

const { v4 } = require('uuid');

function getModuleName(path, depth=1) {
  !path && throwError('Invalid file name!');
  const levels = path.split('/');
  depth = Math.min(levels.length, depth);
  let result = '';
  for (let level = 1; level <= depth; level++) 
      result = levels[levels.length - level] +  (depth > 1 && level > 1 && '/' || '') +  result;
  return result;
}
const generateUniqueKey = () => {
  return v4();
};

module.exports = { getModuleName, generateUniqueKey }