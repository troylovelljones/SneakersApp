
const readOnlyFields =  (parentModule) => {
    const metaData = {};
    Object.defineProperty(metaData, "moduleName", {
        value: parentModule.filename
    });
    Object.defineProperty(metaData, "hostIp", {
        value: '192.168.200.1'
    });
    metaData.mood = parentModule.filename + ' is sad.';
    return metaData;
}

const parentModuleA = readOnlyFields({filename: 'Troy'});
const parentModuleB = readOnlyFields({filename: 'Taylor'});

console.log(parentModuleA.moduleName);
console.log(parentModuleB.moduleName)
parentModuleB.moduleName = 'Fred';
console.log(parentModuleB);




