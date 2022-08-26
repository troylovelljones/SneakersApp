//repository utilities module
const { DataTypes } = require('sequelize');

const modelStatus = {};
module.exports = {
    getPrimaryKeyColumnType: (dbColumnName = 'id') => {
        return {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            field: dbColumnName
        } 
    },
    getStringColumnType: (dbColumnName, size = 255, isUnique = false) => {
        return {
            type: DataTypes.STRING(size),
            allowNull: false,
            field: dbColumnName,
            unique: isUnique 
        }
    },
    getIntegerColumnType: (dbColumnName) => {
        return {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: dbColumnName
        }
    },
    getTimeStampColumnType: (dbColumnName) => {
        return {
            type: DataTypes.DATE,
            allowNulls: false,
            field: dbColumnName
        }
    },
    getDecimalColumnType: (dbColumnName) => {
        return {
            type: DataTypes.DECIMAL,
            allowNull: false,
            field: dbColumnName
        }    
    },
    getDateColumnType: (dbColumnName) => {
        return {
            type: DataTypes.DATE,
            allowNull: true,
            field: dbColumnName
        }
    },
    
    createInsertRecord: (fieldsAndValues, includedProperties) =>{
        console.log(`Creating insert record`.blue);    
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
