//repository utilities module
const { DataTypes } = require('sequelize');

const modelStatus = {};
module.exports = {
    
    createInsertRecord: (fieldsAndValues, includedProperties, logProgressToConsole = false) =>{
        logProgressToConsole && console.log(`Creating insert record`.blue);    
        const insertRecord = {};
        for (property in fieldsAndValues) {
            if (!includedProperties.includes(property)) {
                //console.log(`Skipping property: ${property}`.yellow);
                continue;   
            }
            console.log(`Including property: ${property}`.magenta);
            insertRecord[property] = fieldsAndValues[property];
        }
        insertRecord && 'id' in insertRecord && 
            new Error('Insert record has a primary key specified!'.red)
        
        if (Object.keys(insertRecord) <= 1) {
            console.log(fieldsAndValues, includedProperties, insertRecord);
            throw new Error('Invalid insert record'.red);
        }
        
        return insertRecord;
    },
    
    createUpdateRecord: (databaseRecord, apiRecord) => {
        const updateRecord = {};
            //if the record we found does
            //not contain values for the fields
            //update from the ETL
        console.log(`Creating update record`);       
        for (const property in databaseRecord)                
                updateRecord[property] = apiRecord[property];  
        console.log(updateRecord);   
        //update record must have the id    
        updateRecord && !('id' in updateRecord) && 
            new Error('Cannot create an update record without a primary key!'); 
        return (Object.keys(updateRecord).length != 0 && updateRecord) || null; //return the created update record or null
    }


}
