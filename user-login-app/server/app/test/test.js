
const ipAddress = '192.168.201.445';
const tempArray = ipAddress.split('.').length > 3 && ipAddress.split('.');
tempArray.pop();
const translatedIpAddress = tempArray.join('.');
console.log(translatedIpAddress);