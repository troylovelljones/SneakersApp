"use strict";

const colors = require('colors');
const sqlStatementColor = 'cyan';
const sqlOperatorColor = 'green';

const { collection } = require('sneaks-api/models/Sneaker');
const UFID = `:123~CoNsTrAiNt-123`.blue.underline.bold;
const UVID = `:456-VaLuE~456`.blue.underline.bold;
const OPID = `09fpaug-fu9g-9`.yellow.underline.bold;
const ESCAPED_VALUE = UVID; //may need to do more in future to escape data w/special characters
const COMMA = `, `;
const SEMICOLON = `;`
const TABLE = 'TABLE'
const INSERT_STATEMENT = `INSERT INTO `[sqlOperatorColor] + `${TABLE}`[sqlStatementColor] + `( ${UFID} ) ` + `VALUES `[sqlStatementColor]
const UPDATE_STATEMENT = `UPDATE `[sqlStatementColor] + `${TABLE}` + ` SET `[sqlStatementColor]
const SELECT_STATEMENT = `SELECT `[sqlOperatorColor] + `${UFID} ` + `FROM TABLE`[sqlStatementColor];
const DEFAULT_DB_TIMESTAMP = 'LOCALTIMESTAMP'[sqlStatementColor];
//const ROW_DATA = '(' + ESCAPED_VALUE + EOP + `)`;
const ROW_DATA = '(' + UVID  + `)`;
const VALUES = `${UFID}  ${OPID} ${UVID}`;
const WHERE = ` WHERE `[sqlStatementColor];
const AND = ` AND `[sqlStatementColor];
const EQUAL_TO = '='[sqlOperatorColor];
const GREATER_THAN =  {toString: () => '>'[sqlOperatorColor], EQUAL_TO: {VALUE: '>='[sqlOperatorColor]}};
const LESS_THAN =  {toString: () => '<'[sqlOperatorColor], EQUAL_TO: {VALUE: '<='[sqlOperatorColor]}};



const importArgs = process.argv.slice(2);
const test = false;
const showSqlLogInConsole = true;
const TEST = importArgs[0] && importArgs[0].toUpperCase() === 'TEST' || test;

const createDefaultTimeStamps = (timestamps) => { 
    //properties required to include a timestamp in a PostgreSQL record
    timestamps.createdAt = 'created_at'; 
    timestamps.updatedAt = 'updated_at';
    timestamps.dbTimestampFunction = DEFAULT_DB_TIMESTAMP;
}

//remove all unprintable characters from the string
const sanitizeString = (str) => {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
}

//if the value is a string or the option 
//alwaysTreatValueAsString = true then return the string in 'quotes'
//else if the value is not a string return the value
//else if the value is an empty throw an error
const translateValue = (value, alwaysTreatPropertyValueAsString) => {

    const quotIfy = value => `'${value}'`;
    
    TEST && console.log(`Untranslated value:`.underline + ` ${value}`.blue);

    //if value is a string we need to remove unwanted characters
    //and convert to a SQL property
    if ((isNaN(value) && typeof value === 'string') || alwaysTreatPropertyValueAsString) {

        TEST && console.log(`Translate: `.underline + `${value}`.blue + ` as a string.`);
        //remove invalid characters
        const removeList = [`'`,`"`];  //todo - investigate Regular Expression here
        for (const char of value) {
            if (removeList.includes(char)) 
                value = value.replace(char,'');
        }

        if (value) value = quotIfy(value); //can't use the '?' operator becuase of the throw below
        else throw new Error(`Missing value!`.red); 
        
    }
    
    TEST && console.log('Translated value:'.underline + ' ' + (value?.blue || `NULL`.grey.bold.underline.italic));
    return (value || `NULL`)

}

const checkForEmptyRecord = (record) => { if (!record || Object.keys(record).length === 0) throw Error(`Empty insert record!`.red)}



function whereClause (sqlStatement) { 
   
    if (!sqlStatement) throw new Error('SQL statement cannot be empty');

    showSqlLogInConsole && console.log('\nStatement passed to SQL conditional genrerator --> \n'.underline.bold + 
        sqlStatement.green.italic);


    const checkForMissingSQLStatement = () => {
        !sqlStatement && new Error('No SQL statement specified!'.red);
    }

    const checkForMissingWhere = () => {
        sqlStatement+='';
        if (!sqlStatement.includes(WHERE))
        throw new Error('Missing WHERE clause!'.red);
    }

    const checkForImproperSQL = () => {
        if (sqlStatement.includes(AND) && !sqlStatement.includes(WHERE))
            throw new Error('Malformed SQL statement!'.red);

    } 

    const conditionals = { 
        where: (fieldName) => {
            checkForMissingSQLStatement();
            if (sqlStatement.includes(AND))
                throw new Error('Malformed SQL statement!'.red)
            sqlStatement += (WHERE + VALUES).replace(UFID, fieldName);
            return conditionals;
        },

        and: (fieldName) => {
            checkForMissingSQLStatement();
            checkForMissingWhere();
            sqlStatement += (AND + VALUES).replace(UFID, fieldName);
            return conditionals;s;
        },

        isEqualTo: (value) => {
            checkForMissingSQLStatement();
            checkForMissingWhere();
            sqlStatement = sqlStatement.
                replace(UVID, translateValue(value)).
                replace(OPID, EQUAL_TO);
            showSqlLogInConsole && console.log(sqlStatement.magenta);
            return conditionals;
        },

        isGreatherThan: (value) => {
            checkForMissingSQLStatement();
            checkForMissingWhere();
            value = value && translateValue(value) || UVID;
            sqlStatement = sqlStatement.
                replace(OPID, GREATER_THAN);
                replace(UVID, value);
            showSqlLogInConsole && console.log(sqlStatement.magenta);
            return conditionals;
        },

        isLessThan: (value) => {
            checkForMissingSQLStatement();
            checkForMissingWhere();
            value = (value && translateValue(value)) || UVID
            sqlStatement = 
                replace(UVID, value).
                replace(OPID, LESS_THAN);
            showSqlLogInConsole && console.log(sqlStatement.magenta);
            return conditionals;   
        },
        orEqualTo: (value) => {
            checkForMissingSQLStatement();
            checkForMissingWhere();
            sqlStatement = sqlStatement.
                replace(UVID, value);
                sqlStatement = sqlStatement.
                replace(GREATER_THAN, GREATER_THAN.EQUAL_TO).
                replace(LESS_THAN, LESS_THAN.EQUAL_TO);
            showSqlLogInConsole && console.log(sqlStatement.magenta);
            return conditionals;
        },
        
       
        get: () => {
            checkForImproperSQL(); 
             //colors adds unprintable characters to the string.  Must remove before passing to SQL
            return sanitizeString(sqlStatement) +  SEMICOLON
        }
    }   
    
    Object.defineProperty(conditionals, "SQL_STATEMENT", {
        value: sqlStatement,
        writable: false
    });
    
    TEST && console.log('Conditionals object: '.gray);
    console.log(conditionals);
    return conditionals;
};

const includeTimestampsInUpdate = (updateStatement, options) => {
    
    TEST && console.log('Timestamp properties: ');
    TEST && console.log(options?.timestamp);
    if (!options?.timestamps) return false; //nothing to do if no timstamps don't exist
    
    TEST && console.log(`Including defined timestamps`.green);
    const {timestamps} = options;
    const updatedAt = timestamps?.updatedAt;
    const timestampString = UFID + EQUAL_TO + UVID;
    const createDefaultTimestamps = options?.createDefaultTimeStamps;
    
    createDefaultTimestamps && createDefaultTimeStamps(updateStatement, options);
    
    const dbTimestampFunction = timestamps?.dbTimestampFunction || DEFAULT_DB_TIMESTAMP;
    
    updateStatement += timestampString.replace(UFID, updatedAt).
        replace(UVID, dbTimestampFunction);
    !updateStatement && new Error(`SQL Statement is blank!`.red);
    showSqlLogInConsole && console.log('Update statement from includeTimeSTamps...= ' + updateStatement.magenta.bold);  
    return updateStatement;

}

const updateFromProperties = (record, updateStatement, options) => {
    const mappedProperties = options?.mappedProperties;
    Object.keys(record).forEach((property, index) => {
        
        const isLastProperty = index === Object.keys(record).length - 1;
        const updateClause = (UFID + EQUAL_TO + UVID);
       
        updateStatement += (isLastProperty && options?.updatedAt && updateClause) || 
            !isLastProperty && updateClause || ' ';
        const mappedProperty = mappedProperties?.[property] || property;
        const updateValue = + !isLastProperty && (`${translateValue(record[property])}`.blue + `${COMMA}`) || '';
        updateStatement = updateStatement.replace(UFID, mappedProperty).
            replace(UVID, updateValue); 
        
        showSqlLogInConsole && console.log(updateStatement.green);
    });

    !updateStatement && new Error('SQL statement is blank!'.red);
    showSqlLogInConsole && console.log('Update statement from updateFromProps... = '.cyan.underline.italic + updateStatement.magenta.bold);
    
    return includeTimestampsInUpdate(updateStatement, options) || updateStatement;
    
            

}

const updateFromRecord = (record, updateStatement, options) => {
    
    updateStatement = updateFromProperties(record, updateStatement, options);
    !updateStatement && new Error('SQL statement is blank!'.red);
    showSqlLogInConsole && console.log(`Updated statement from updateFrom = `.gray + updateStatement);
    return updateStatement;

}

const createUpdateStatement = (tableName, record, options) => {
    TEST && console.log(`Options passed to createUpdate.. = `.blue.underline.italic);
    TEST && console.log(options);
    let updateStatement = UPDATE_STATEMENT.replace(TABLE, tableName);
    options?.timestamps && options?.createDefaultTimeStamps && createDefaultTimeStamps(options.timestamps);
    updateStatement = updateFromRecord(record, updateStatement, options);
    if (!updateStatement) throw new Error('SQL statement is blank!'.red);
    return whereClause(updateStatement); 

}


const createSelectStatement = (tableName, fieldNames) => {
    
    fieldNames = Array.isArray(fieldNames) && fieldNames || [fieldNames];
    let selectStatement = SELECT_STATEMENT.replace('TABLE', tableName);
    //specifiy select fields e.g. SELECT A, B, C...
    fieldNames.forEach((fieldName, index) =>  {
        const isLastField = index === fieldNames.length - 1;
        const nextFieldPlaceholder = !isLastField && (COMMA + UFID) || '';
        const fieldParam = fieldName.toUpperCase() + nextFieldPlaceholder
        selectStatement = selectStatement.replace(UFID, fieldParam);
        showSqlLogInConsole && console.log(selectStatement.magenta)
    });
    
    showSqlLogInConsole && console.log('Created SQL statement: '.blue + selectStatement?.yellow);
    const theWhereClause =  whereClause(selectStatement);
    TEST && console.log(theWhereClause);
    return theWhereClause;
    
}

const insertFromTimestamps = (insertStatement, timestamps) => {
    
    //<-------------------|helper functions
    const throwError = (message) => {
        throw new Error(message);
    }

    const createDefaultTimestamps = () => {
        timestamps.createdAt =  'created_at';
        timestamps.upatedAt = 'updated_at';
        timestamps.dbTimestampFunction = DEFAULT_DB_TIMESTAMP;
    }
    //<-------------------|end helper functions

    //this function modifies the SQL to include database generated timestamps on insert
    //in the future this can be done automagically by the database server

    console.log('starting insertFromTimestamp... '.yellow + insertStatement);
    
    //create default timestamp fields if serverTimestamps = true && there are no valid fields specified
    timestamps?.defaultTimestampFields && createDefaultTimestamps();

    console.log(timestamps);

    !timestamps?.defaultTimestampFields && (
        timestamps?.createdAt && 
        timestamps?.updatedAt && 
        timestamps?.dbTimestampFunction) && 
        throwError(`Missing timestamps!`.red);

    const dbTimestampFunction = timestamps.dbTimestampFunction; 

    //don't need these properties for the forEach loop, they've served the purpose
    timestamps.defaultTimestampFields && delete timestamps.defaultTimestampFields;
    delete timestamps.dbTimestampFunction;
    
    Object.keys(timestamps).forEach( (property, index) => {
        TEST && console.log('Generating timestamps....'.green);
        TEST && console.log(timestamps);
        const isLastTimestampProperty = index === Object.keys(timestamps).length - 1;      
        //remove non printable characters
        insertStatement = sanitizeString(insertStatement);
       
        const replacementString =
            COMMA + timestamps[property].toUpperCase();
        showSqlLogInConsole && console.log(`Replacement string: `.grey + `${replacementString}`);
        
        //insert the timestamp field into the SQL string
        insertStatement = insertStatement.
            replace(')', replacementString.trim() + ')');
        showSqlLogInConsole && console.log(('Substring: ' + insertStatement.substr(0 , insertStatement.length)).cyan.bold);
        
        //now add the timestamp function to the end of the SQL statement
        const timestampValue = COMMA + dbTimestampFunction + ')';
        showSqlLogInConsole && console.log('Timestamp value: ' + timestampValue.yellow, isLastTimestampProperty);
        
        //final result should look like INSERT INTO (X, Y, Z, CREATED_AT, UPDATED_AT, etc) VALUES (A, B, C, TIMESTAMP_FUNC, TIMESTAMP_FUNC, etc)
        insertStatement = insertStatement.substr(0 , insertStatement.length - 1) + sanitizeString(timestampValue);
     

    });

    showSqlLogInConsole && console.log('after insertFromTimestamps... '.yellow + insertStatement);
    
    return sanitizeString(insertStatement);
}

const insertFromProperties = (record, insertStatement, options) => {
    
    showSqlLogInConsole && console.log('start of insertFromProperties'.yellow, insertStatement);

    
    Object.keys(record).forEach((property, index) => {
        
        let isLastProperty = index === Object.keys(record).length - 1;
        const mappedProperties = options?.mappedProperties;
        //by default the property => mapped property
        //unless an we get an actual mapped property => property mapping
        //in mappedProperties
        let mappedProperty = mappedProperties?.[property] || property;
        if (TEST) {
            console.log(
                `Property = ${property} `.gray + 
                `, Index = ${index}`);
            
        }
        //look for properities in the options object 
        //whose values should be treated as strings 
        //for the purpose of insertion
        
        const treatPropertyValueAsString = options?.treatPropertyValueAsString?.[property];
        //replace UFID and UVID values
        //statement = INSERT INTO TABLE_NAME
        //start with replacing UFID
        const placeholder = (!isLastProperty && COMMA +  UFID) || '';
        insertStatement = insertStatement.
        replace(UFID, `${(mappedProperty + '').
        toUpperCase()}` + placeholder); 
        //if not last record => statement should += (field_name, UFID) VALUES (UVID)
        //otherwise statement should += (fieldName) VALUES (UVID)
        //replace UFID next
        translateValue(record[property], treatPropertyValueAsString) //need to property "quote" strings
        insertStatement = insertStatement.
        replace(UVID, `${translateValue(record[property], treatPropertyValueAsString)}` + 
            ((!isLastProperty && COMMA + UVID) || ''));
        //(field_name, UFID) values (field_value, UVID@))
        showSqlLogInConsole && console.log(`Insert Statement from properties...` + insertStatement.gray);
    

    });
    
    showSqlLogInConsole && console.log('insertFromProperties before insertFromTimestamps... '.magenta + insertStatement);
  
    return (options?.timestamps || options?.timestamps?.createTimestampsByDefault) && insertFromTimestamps(insertStatement, options.timestamps);
    
}

function insertFromObjects(records, insertStatement, options) {
    
    records = Array.isArray(records) ? records: [records];
    records.forEach((record, index) => {
        const isLastRecord = index === records.length - 1;
        let timestamps = options?.timestamps;
        
        timestamps = (
            timestamps?.createTimeStampsByDefault &&  
            {createdAt: 'created_at', updatedAt: 'updated_at'}) || 
            timestamps;
        checkForEmptyRecord(record);
        showSqlLogInConsole && console.log(`insertFromObjects before insertFromProperties... `.yellow, insertStatement);
        insertStatement = insertFromProperties(record, insertStatement, options);
        insertStatement += (!isLastRecord && COMMA + ROW_DATA) || ''; 
        showSqlLogInConsole && console.log('insertFromObjects after insertFromProperties... '.yellow, insertStatement);
        
    }); 
    return sanitizeString(insertStatement) + SEMICOLON;                          
}

const createInsertStatement = (tableName, records, options) => {
    
    let insertStatement = INSERT_STATEMENT.replace(TABLE, tableName) + ROW_DATA;
    showSqlLogInConsole && console.log('constructInsertStatement before insertFromObjects'.yellow, insertStatement.green);
    insertStatement = insertFromObjects(records, insertStatement, options);
    return sanitizeString(insertStatement);

}


module.exports = {createInsertStatement, createSelectStatement, createUpdateStatement};

let testCount = 1;

if (TEST) {

    const timestamps = {createdAt: 'created_at', updatedAt: 'updated_at', 
        dbTimestampFunction: 'LOCALTIMESTAMP'};
    const options = {timestamps};

    console.log(`Test #${testCount++}`.green);
    let insertStatement = createInsertStatement(`users`, [{name: 'Troy', age: 50, address: '5311 Belmonont',
        zip: 75206, religion: 'Catholic', favoriteDrink: 'Dr. Pepper'}], options);
    showSqlLogInConsole && console.log(insertStatement?.white || 'Function failed!'.red);  

    const testArray = [{name: 'Troy', age: 50, address: '5311 Belmonont',
        zip: 75206, religion: 'Catholic', favoriteDrink: 'Dr. Pepper'}, 
        {name: 'Fred', age: 20, address: '11 Travis',
        zip: 75206, religion: 'Jewish', favoriteDrink: 'Coke'}];

    console.log(`Test #${testCount++}`.green);
    insertStatement = createInsertStatement(`drinkers`, testArray, options);
    showSqlLogInConsole && console.log( insertStatement?.white || 'Function failed!'.red);    
    
    const testArray2 = [{name: 'Troy', age: 50, address: '5311 Belmonont',
        zip: 75206, religion: 'Catholic', favoriteDrink: 'Dr. Pepper'}, 
        {name: 'Fred', age: 20, address: '11 Travis',
        zip: 75206, religion: 'Jewish', favoriteDrink: 'Coke'},
        {name: 'Sam', age: 29, address: '11511 Mulholland',
        zip: 75206, religion: 'Mormon', favoriteDrink: 'Sprite'}];

    console.log(`Test #${testCount++}`.green);
    insertStatement = createInsertStatement(`shoe_heads`, testArray2, options);
    showSqlLogInConsole && console.log((insertStatement?.white) || 'Function failed!'.red);  

    const testArray3 = [{name: 'Troy', age: 50, address: '5311 Belmonont',
        zip: 75206, religion: 'Catholic', favoriteDrink: 'Dr. Pepper'}, 
        {name: 'Fred', age: 20, address: '11 Travis',
        zip: 75206, religion: 'Jewish', favoriteDrink: 'Coke'},
        {name: 'Sam', age: 29, address: '11511 Mulholland',
        zip: 75206, religion: 'Mormon', favoriteDrink: 'Sprite'},];

    console.log(`Test #${testCount++}`.green);

    options.mappedProperties = {address: 'home_address', favoriteDrink: 'favorite_drink'};
    options.timestamps.lastLogin = 'last_log_in_at';

    insertStatement = createInsertStatement(`shoe_heads`, testArray3, options,
        );
    showSqlLogInConsole && console.log((insertStatement?.white) || 'Function failed!'.red);  

    let firstSelect = createSelectStatement('sneaker_user',
    ['username','password','last_login_time']);

    console.log(`SQL statement generated: ` + firstSelect.SQL_STATEMENT.green);
    console.log(firstSelect);
    
    firstSelect = firstSelect.where('username').
    isEqualTo('troy1971').get();
    
    showSqlLogInConsole && console.log(firstSelect + '\n');

    const secondSelect = createSelectStatement('sneaker_user',
        ['username','password','last_login_time']).
        where('username').
        isEqualTo('troy1971').
        and('password').
        isEqualTo('3453egdfg@##').get();

    showSqlLogInConsole && console.log(secondSelect + '\n');

    const thirdSelect = createSelectStatement('sneaker_user',
        ['username','password','last_login_time']).
        where('username').
        isEqualTo('troy1971').
        and('password').
        isEqualTo('3453egdfg@##').
        and('last_login_in_time').isEqualTo(new Date()).get();
    
    
    showSqlLogInConsole && console.log(thirdSelect + '\n');


    const updateStatement = createUpdateStatement('users', testArray[0], options).
        where('user_id').isEqualTo(10).get();

    showSqlLogInConsole && console.log(updateStatement);


    

   
        
}
