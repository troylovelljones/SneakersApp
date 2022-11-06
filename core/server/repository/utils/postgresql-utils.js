'use strict';

//Node modules
const colors = require('colors');
//debug colors
const sqlStatementColor = 'cyan';
const sqlOperatorColor = 'green';
const sqlKeywordColor = 'blue';

//sql replacement values
const UFID = `:123~CoNsTrAiNt-123`.blue.underline.bold;
const UVID = `:456-VaLuE~456`.blue.underline.bold;
const OPID = `09fpaug-fu9g-9`.yellow.underline.bold;
const STOP_REPLACING = '';

//postgreSql teminator and separator characters
const COMMA = `, `;
const SEMICOLON = `;`;
//postgreSql dialect - basic statment structure and keywords
const TABLE = `TABLE`[sqlKeywordColor];
const SELECT = `SELECT`[sqlKeywordColor];
const INSERT = `INSERT`[sqlKeywordColor];
const UPDATE = `UPDATE`[sqlKeywordColor];
const DELETE = `DLETE`[sqlKeywordColor];
const DISTINCT = `DISTINCT `[sqlKeywordColor];
const SET = ` SET `[sqlKeywordColor];
const FROM = `FROM`[sqlKeywordColor];
const VALUES = ` VALUES `[sqlKeywordColor];
const INTO = 'INTO'[sqlKeywordColor];
const INSERT_STATEMENT_FIELDS = `${INSERT} ${INTO} ${TABLE} (${UFID}) `;
const INSERT_STATEMENT = INSERT_STATEMENT_FIELDS + VALUES;
const UPDATE_STATEMENT = `${UPDATE} ${TABLE} ${SET} `;
const SELECT_STATEMENT = `${SELECT} ${UFID} ${FROM} ${TABLE}`[
  sqlStatementColor
];
const DELETE_STATEMENT = `${DELETE} ${UFID} ${FROM} ${TABLE}`;
const ROW_DATA = '(' + UVID + `)`;
const INNER_JOIN = ' INNER JOIN '[sqlKeywordColor];
const LEFT_JOIN = ' LEFT JOIN '[sqlKeywordColor];
const RIGHT_JOIN = ' RIGHT JOIN '[sqlKeywordColor];
const ON = ' ON '[sqlKeywordColor];
const COMPARISON = `${UFID} ${OPID} ${UVID}`;
const WHERE = ` WHERE `[sqlKeywordColor];
const LIKE = ` LIKE `[sqlKeywordColor];
const AND = ` AND `[sqlKeywordColor];
const RETURNING = ' RETURNING '[sqlKeywordColor];

//OPIDs - comparions operations that can be done in SQL
const EQUAL_TO = '='[sqlOperatorColor];
const GREATER_THAN = {
  toString: () => '>'[sqlOperatorColor],
  EQUAL_TO: { VALUE: '>='[sqlOperatorColor] }
};
const LESS_THAN = {
  toString: () => '<'[sqlOperatorColor],
  EQUAL_TO: { VALUE: '<='[sqlOperatorColor] }
};

//result set keyword modifiers
const LIMIT = (value) => ` LIMIT ` + `${value}`;
LIMIT.toString = () => 'LIMIT'[sqlKeywordColor];
const GROUP_BY = ` GROUP BY `[sqlKeywordColor] + `${UFID} `;
const ORDER_BY = `ORDER BY `[sqlKeywordColor] + `${UFID}`;
const ASCENDING = ` ASC`[sqlKeywordColor];
const DESCENDING = ` DESC`[sqlKeywordColor];

//Supported PostgreSql Database Functions
const DEFAULT_DB_TIMESTAMP = 'LOCALTIMESTAMP'[sqlKeywordColor];

//debugging values
const importArgs = process.argv.slice(2);
const test = false;
const TEST = (importArgs[0] && importArgs[0].toUpperCase() === 'TEST') || test;

const { sanitizeString } = require('../../../validation/validation');
const { log: logInfo, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
module.getModuleLoggingMetaData = getModuleLoggingMetaData;

const addReturningStatement = (sqlStatement, field) => {
  sqlStatement = sqlStatement.replace(';', RETURNING + field + ';');
  return sqlStatement;
};

const createDefaultTimeStamps = (timestamps) => {
  //properties required to include a timestamp in a PostgreSQL record
  timestamps.createdAt = 'created_at';
  timestamps.updatedAt = 'updated_at';
  timestamps.dbTimestampFunction = DEFAULT_DB_TIMESTAMP;
};

const createUpdatedAtTimestamp = (timestamps) => {
  timestamps.updatedAt = !timestamps.updatedAt
    ? 'updated_at'
    : timestamps.updatedAt;
};

//if the value is a string or the option
//alwaysTreatValueAsString = true then return the string in 'quotes'
//else if the value is not a string return the value
//else if the value is an empty throw an error
const translateValue = (value, alwaysTreatPropertyValueAsString) => {
  const quotIfy = (value) => `'${value}'`;
  logInfo(`Untranslated value:`.underline + ` ${value}`.blue);
  //if value is a string we need to remove unwanted characters
  //and convert to a SQL property
  if (
    (isNaN(value) && typeof value === 'string') ||
    alwaysTreatPropertyValueAsString
  ) {
    logInfo(`Translate: `.underline + `${value}`.blue + ` as a string.`);
    //remove invalid characters
    const removeList = [`'`, `"`]; //todo - investigate Regular Expression here
    for (const char of value) {
      if (removeList.includes(char)) value = value.replace(char, '');
    }
    if (value) value = quotIfy(value);
    //can't use the '?' operator becuase of the throw below
    else throw new Error(`Missing value!`.red);
  }
  logInfo(
    'Translated value:'.underline +
      ' ' +
      (value?.blue || `NULL`.grey.bold.underline.italic)
  );
  return value || `NULL`;
};

const checkForEmptyRecord = (record) => {
  if (!record || Object.keys(record).length === 0)
    throw Error(`Empty insert record!`.red);
};

const throwError = (message) => {
  throw new Error(message.red);
};

const includeTimestampsInUpdate = (updateStatement, options) => {
  logInfo('Timestamp properties: ');
  logInfo(options?.timestamp);
  if (!options?.timestamps) return false; //nothing to do if no timstamps don't exist
  logInfo(`Including defined timestamps`.green);
  const { timestamps } = options;
  const updatedAt = timestamps?.updatedAt;
  const timestampString = UFID + EQUAL_TO + UVID;
  const createDefaultTimestamps = options?.createDefaultTimeStamps;
  createDefaultTimestamps && createDefaultTimeStamps(updateStatement, options);
  const dbTimestampFunction =
    timestamps?.dbTimestampFunction || DEFAULT_DB_TIMESTAMP;
  updateStatement += timestampString
    .replace(UFID, updatedAt)
    .replace(UVID, dbTimestampFunction);
  !updateStatement && new Error(`SQL Statement is blank!`.red);
  logInfo(
    'Update statement from includeTimeSTamps...= ' +
      updateStatement.magenta.bold
  );
  return updateStatement;
};

const updateFromProperties = (record, updateStatement, options) => {
  const mappedProperties = options?.mappedProperties;
  Object.keys(record).forEach((property, index) => {
    const isLastProperty = index === Object.keys(record).length - 1;
    const updateClause = UFID + EQUAL_TO + UVID;

    updateStatement +=
      (isLastProperty && options?.updatedAt && updateClause) ||
      (!isLastProperty && updateClause) ||
      ' ';
    const mappedProperty = mappedProperties?.[property] || property;
    const updateValue =
      (+!isLastProperty &&
        `${translateValue(record[property])}`.blue + `${COMMA}`) ||
      '';
    updateStatement = updateStatement
      .replace(UFID, mappedProperty)
      .replace(UVID, updateValue);

    logInfo(updateStatement.green);
  });
  !updateStatement && new Error('SQL statement is blank!'.red);
  logInfo(
    'Update statement from updateFromProps... = '.cyan.underline.italic +
      updateStatement.magenta.bold
  );
  return includeTimestampsInUpdate(updateStatement, options) || updateStatement;
};

const updateFromRecord = (record, updateStatement, options) => {
  updateStatement = updateFromProperties(record, updateStatement, options);
  !updateStatement && new Error('SQL statement is blank!'.red);
  logInfo(`Updated statement from updateFrom = `.gray + updateStatement);
  return updateStatement;
};

const groupByFields = [];
const selectFields = [];
const orderByFields = [];

function whereClause(sqlStatement) {
  let savedSqlStatement = sqlStatement;
  !sqlStatement && throwError('SQL statement cannot be empty');
  logInfo(
    '\nStatement passed to SQL conditional genrerator --> \n'.underline.bold +
      sqlStatement.green.italic
  );

  const checkForMissingSQLStatement = () => {
    !sqlStatement && throwError('No SQL statement specified!'.red);
  };

  const checkForInvalidKeywords = (keywords) => {
    keywords = (Array.isArray(keywords) && keywords) || [keywords];

    return {
      before: (operation) => {
        for (const keyword of keywords)
          sqlStatement.includes(keyword) &&
            throwError(
              `${operation} cannot directly follow an AND, WHERE, ORDER BY, GROUP BY, or LIMIT statement!`
            );
      }
    };
  };

  const checkForMissingKeywords = (keywords) => {
    for (const keyword of keywords)
      !sqlStatement.includes(keyword) &&
        throwError(`Missing ${keyword} statement!`);
  };

  const checkForImproperSQL = () => {
    sqlStatement.includes(AND) &&
      !sqlStatement.includes(WHERE) &&
      throwError('Malformed SQL statement!'.red);
  };

  const checkForUndefinedValues = () => {
    //all occurences of undefined must be quoted as 'undefined'
    sqlStatement.includes('undefined') &&
      !sqlStatement.includes(`'undefined'`) &&
      throwError('Invalid SQL Statement!'.red);
  };

  const validateConditional = () => {
    //need to add more checks to this function
    checkForMissingSQLStatement();
    checkForMissingKeywords([WHERE]);
  };

  const checkForDuplicateGroupBy = (fields) => {
    logInfo(`Logging inside of duplicate checking `.yellow);
    logInfo(fields);
    if (!sqlStatement.includes(GROUP_BY)) return;
    for (const field of fields) {
      logInfo(`Checking ` + field.blue);
      sqlStatement.indexOf(field, sqlStatement.indexOf(GROUP_BY)) > 0 &&
        throwError(field + ' already included in group by');
    }
  };

  const conditionals = {
    innerJoin: (tablename) => {
      checkForInvalidKeywords([WHERE, AND, LIMIT, GROUP_BY, ORDER_BY]).before(
        INNER_JOIN
      );
      sqlStatement += INNER_JOIN + tablename;
      return conditionals;
    },
    leftJoin: (tablename) => {
      checkForInvalidKeywords([WHERE, AND, LIMIT, GROUP_BY, ORDER_BY]).before(
        LEFT_JOIN
      );
      sqlStatement += LEFT_JOIN + tablename;
      return conditionals;
    },
    rightJoin: (tablename) => {
      checkForInvalidKeywords([WHERE, AND, LIMIT, GROUP_BY, ORDER_BY]).before(
        LEFT_JOIN
      );
      sqlStatement += LEFT_JOIN + tablename;
      return conditionals;
    },
    on(fieldFromTableA, fieldFromTableB) {
      sqlStatement += ON + COMPARISON.replace(OPID, EQUAL_TO);
      sqlStatement = sqlStatement.replace(UFID, fieldFromTableA);
      sqlStatement = sqlStatement.replace(UVID, fieldFromTableB);
      return conditionals;
    },
    where: (fieldName) => {
      checkForMissingSQLStatement();
      checkForInvalidKeywords([AND, WHERE]).before(WHERE);
      sqlStatement =
        savedSqlStatement + (WHERE + COMPARISON).replace(UFID, fieldName);
      return conditionals;
    },

    isEqualTo: (value) => {
      //need to clean up validateConditionals
      validateConditional();
      sqlStatement = sqlStatement
        .replace(UVID, translateValue(value))
        .replace(OPID, EQUAL_TO);
      logInfo(sqlStatement.magenta);
      return conditionals;
    },
    isEqualToField: (field) => {
      //need to clean up validateConditionals
      validateConditional();
      sqlStatement = sqlStatement.replace(UVID, field).replace(OPID, EQUAL_TO);
      logInfo(sqlStatement.magenta);
      return conditionals;
    },

    isGreatherThan: (value) => {
      //need to clean up validateConditionals
      validateConditional();
      value = (value && translateValue(value)) || UVID;
      sqlStatement = sqlStatement.replace(OPID, GREATER_THAN);
      replace(UVID, value);
      logInfo(sqlStatement.magenta);
      return conditionals;
    },

    isLessThan: (value) => {
      //need to clean up validateConditional
      validateConditional();
      value = (value && translateValue(value)) || UVID;
      sqlStatement = replace(UVID, value).replace(OPID, LESS_THAN);
      logInfo(sqlStatement.magenta);
      return conditionals;
    },
    orEqualTo: (value) => {
      //need to clean up validateConditionals
      //checkForMissingKeywords is duplicating validateConditionals
      validateConditional();
      checkForMissingKeywords([WHERE]);
      sqlStatement = sqlStatement.replace(UVID, value);
      sqlStatement = sqlStatement
        .replace(GREATER_THAN, GREATER_THAN.EQUAL_TO)
        .replace(LESS_THAN, LESS_THAN.EQUAL_TO);
      logInfo(sqlStatement.magenta);
      return conditionals;
    },
    isLike: (value) => {
      //need to clean up validateConditionals
      //checkForMissingeKeywords is duplicating validateConditionals
      validateConditional();
      checkForMissingKeywords([WHERE, SELECT]);
      sqlStatement = sqlStatement
        .replace(OPID, LIKE)
        .replace(UVID, translateValue(value));
      logInfo(sqlStatement.magenta);
      return conditionals;
    },

    and: (fieldName) => {
      //need to clean up validateConditionals
      validateConditional();
      sqlStatement += (AND + COMPARISON).replace(UFID, fieldName);
      return conditionals;
    },

    groupBy: (fields) => {
      //too much code in this method.  Need to refactor
      fields = Array.isArray(fields) ? fields : [fields];
      Array.isArray(fields)
        ? logInfo('Got an array of fields.')
        : logInfo('Got a single field.');
      checkForDuplicateGroupBy(fields);
      Array.isArray(fields)
        ? logInfo('still dealing with an array')
        : logInfo('not an array');
      logInfo(`Examining the sql in group by statement: ` + sqlStatement);
      sqlStatement.includes(GROUP_BY) ||
        (sqlStatement.includes(ORDER_BY) &&
          throwError(
            'Cannot have multiple GROUP BY statements and GROUP BY must precedure ORDER BY'
          ));
      sqlStatement = sqlStatement + GROUP_BY;
      //clear the group by field by setting array length to 0;
      groupByFields.length = 0;
      fields.forEach((field, index) => {
        logInfo(`Adding ${field}`.blue + ` to group by clause`);
        groupByFields.push(field);
        const isLastField = index === fields.length - 1;
        sqlStatement =
          (!isLastField && sqlStatement.replace(UFID, field + COMMA + UFID)) ||
          sqlStatement.replace(UFID, field);
      });
      logInfo('Select fields: ');
      logInfo(selectFields);
      logInfo('Group by fields: ');
      logInfo(selectFields);
      !JSON.stringify(selectFields) == JSON.stringify(groupByFields) &&
        throwError(
          'Every field in the select clause must appear in the group by clause.'
        );
      return conditionals;
    },

    orderBy: (fields) => {
      //too much code in this method.  Need to refactor
      //duplicates group by in many ways
      fields = Array.isArray(fields) ? fields : [fields];
      Array.isArray(fields)
        ? logInfo('Got an array of fields.')
        : logInfo('Got a single field.');
      checkForDuplicateGroupBy(fields);
      logInfo(`Examining the sql in order by statement: ` + sqlStatement);
      sqlStatement.includes(ORDER_BY) &&
        throwError('Cannot have multiple ORDER BY statements');
      sqlStatement = sqlStatement + ORDER_BY;
      //clear the order by field by setting array length to 0;
      orderByFields.length = 0;
      fields.forEach((field, index) => {
        logInfo(`Adding ${field}`.blue + ` to order by clause`);
        orderByFields.push(field);
        const isLastField = index === fields.length - 1;
        sqlStatement =
          (!isLastField && sqlStatement.replace(UFID, field + COMMA + UFID)) ||
          sqlStatement.replace(UFID, field);
      });
      logInfo('Select fields: ');
      logInfo(selectFields);
      logInfo('Group by fields: ');
      logInfo(groupByFields);
      logInfo('Group by fields: ');
      logInfo(groupByFields);
      return conditionals;
    },
    descending: () => {
      checkForImproperSQL();
      sqlStatement += DESCENDING;
    },

    limit: (value) => {
      //need more validation in this method
      if (value < 1) return conditionals;
      logInfo(sqlStatement);
      !sqlStatement ||
        (!sqlStatement.includes(SELECT) && throwError('Invalid use of LIMIT!'));
      //limit has to be the last modifier in the sql select statement, it can be easily replaced
      logInfo('Removing Limit: ');
      logInfo('postion of the word limit: ' + sqlStatement.indexOf(LIMIT) - 1);
      logInfo(sqlStatement.substr(0, sqlStatement.indexOf(LIMIT)));
      sqlStatement = !sqlStatement.includes(LIMIT)
        ? sqlStatement + LIMIT(value)
        : sqlStatement.substr(0, sqlStatement.indexOf(LIMIT) - 1) +
          LIMIT(value);
      return conditionals;
    },

    //returns the original select statement before any qualifiers are added e.g. where, and or, equal, group by limit, etc.
    get: () => {
      checkForImproperSQL();
      checkForUndefinedValues();
      //colors adds unprintable characters to the string.  Must remove before passing to SQL
      return sanitizeString(sqlStatement) + SEMICOLON;
    },

    reset: () => {
      sqlStatement = sanitizeString(savedSqlStatement);
      return conditionals;
    },

    save: () => {
      savedSqlStatement = sqlStatement;
      return conditionals;
    }
  };
  Object.defineProperty(conditionals, 'SQL_STATEMENT', {
    value: sqlStatement,
    writable: false
  });
  logInfo('Conditionals object: '.gray);
  logInfo(conditionals);
  return conditionals;
}

const createSelect = (options) => {
  return options?.distinct
    ? SELECT_STATEMENT.replace(SELECT, SELECT + DISTINCT)
    : SELECT_STATEMENT;
};

const replaceTablenames = (tablenames, selectStatement) => {
  selectStatement = SELECT_STATEMENT;
  tablenames.forEach((tablename, index) => {
    const isLastTable = index === tablenames.length - 1;
    logInfo(`Adding table `.blue + `${tablename}`.magenta);
    selectStatement = !isLastTable
      ? selectStatement.replace(TABLE, tablename + COMMA + TABLE)
      : logInfo(`Added last table to select`) &&
        selectStatement.replace(TABLE, tablename);

    logInfo(selectStatement.green);
  });
  logInfo(
    `Select statement after adding tables `.blue + `${selectStatement}`.magenta
  );
  return selectStatement;
};

const replaceFields = (fieldnames, sqlStatement) => {
  //specifiy select fields e.g. SELECT A, B, C...
  fieldnames.forEach((fieldname, index) => {
    const isLastField = index === fieldnames.length - 1;
    const nextFieldPlaceholder = (!isLastField && COMMA + UFID) || '';
    const fieldParam = fieldname.toUpperCase() + nextFieldPlaceholder;
    sqlStatement = sqlStatement.replace(UFID, fieldParam);
    selectFields.push(fieldname);
    logInfo(`Added field `.blue + `${fieldname}`.yellow);
  });
  logInfo(`Select statement after field replacement: `.blue);
  logInfo(sqlStatement.magenta);
  return sqlStatement;
};

const insert_timestamp_field = (sqlInsertStatement, field) => {
  //this function modifies the SQL to include database generated timestamps on insert
  //in the future this can be done automagically by the database server
  const REPLACEMENT_IDENTIFIER = '@';
  logInfo('starting insertFromTimestamp... '.yellow + sqlInsertStatement);
  //set up field replacement capability using '@' character
  //the first ) in the string is aways where we want to do replace
  sqlInsertStatement = sqlInsertStatement.replace(
    ')',
    REPLACEMENT_IDENTIFIER + ')'
  );
  logInfo(sqlInsertStatement.grey);
  //add the timestamp field into the SQL string
  //the @ is used to identify where the timestamp fields
  //should be inserted into the sql string
  sqlInsertStatement = sqlInsertStatement.replace(
    REPLACEMENT_IDENTIFIER,
    COMMA + field.toUpperCase()
  );
  logInfo(sqlInsertStatement.grey);
  if (!sqlInsertStatement)
    throwError('Insert statement returned from insertTimeField is null!');
  return sqlInsertStatement;
};

//called from record_fieldsOrValues_to_insertStatement
const insert_db_time_function = (
  sqlInsertStatement,
  fields,
  dbTimeFunction
) => {
  !dbTimeFunction && throwError('Missing timestamp function!');
  logInfo('Generating timestamps....'.green);
  logInfo(`Database duration function: `.grey + `${dbTimeFunction}`);
  logInfo(
    (
      'Insert Substring up to last character: ' +
      sqlInsertStatement.substr(0, sqlInsertStatement.length - 1)
    ).cyan.bold
  );
  //now add the timestamp function to the end of the SQL statement
  const timestampValue = COMMA + dbTimeFunction + ')';
  logInfo('Timestamp value: ' + timestampValue.yellow, dbTimeFunction);
  //final result should look like INSERT INTO (X, Y, Z, CREATED_AT, UPDATED_AT, etc) VALUES (A, B, C, TIMESTAMP_FUNC, TIMESTAMP_FUNC, etc)
  for (const field in fields)
    sqlInsertStatement =
      sqlInsertStatement.substr(0, sqlInsertStatement.length - 1) +
      COMMA +
      sanitizeString(dbTimeFunction) +
      ')';
  return (
    sqlInsertStatement ||
    throwError('Insert statement in DbTimeFunction is null')
  );
};

//called from createSqlInsertStatement
const insert_timestamp_fields = (sqlInsertStatement, timestamps) => {
  const create_default_timestamps = () => {
    timestamps.fields = { created_at: 'created_at', updatedAt: 'updated_at' };
    timestamps.dbTimeFunction = DEFAULT_DB_TIMESTAMP;
  };
  logInfo('Creating timestamp fields...'.green);
  const createDefaultTS =
    timestamps?.includeDefaultTimestampFields === true &&
    create_default_timestamps();
  !createDefaultTS &&
    !timestamps?.fields &&
    throwError('Missing timestamp fields!');
  //looping over timestamp field values to insert into sql insert
  Object.keys(timestamps.fields).forEach((property, index) => {
    logInfo('Timestamp property: ' + timestamps.fields[property]);
    sqlInsertStatement = insert_timestamp_field(
      sqlInsertStatement,
      timestamps.fields[property]
    );
  });

  logInfo('after insertTimeStampFields... '.yellow + sqlInsertStatement);
  return (
    sqlInsertStatement ||
    throwError('Insert statement in insertTimestampFields is null')
  );
};

//called from createSqlInsertStatement
const record_fieldsOrValues_to_insertStatement = (
  record,
  sqlInsertStatement,
  options
) => {
  logInfo('start of insertFromRecordProperties'.yellow, sqlInsertStatement);

  Object.keys(record).forEach((property, index) => {
    let isLastProperty = index === Object.keys(record).length - 1;
    const mappedProperties = options?.mappedProperties;
    //by default the property => mapped property
    //unless an we get an actual mapped property => property mapping
    //in mappedProperties
    let mappedProperty = mappedProperties?.[property] || property;
    logInfo(`Property = ${property} `.gray + `, Index = ${index}`);

    //look for properities in the options object
    //whose values should be treated as strings
    //for the purpose of insertion
    const treatPropertyValueAsString =
      options?.treatPropertyValueAsString?.[property];
    logInfo(`Mapped Property: `);
    logInfo(mappedProperty?.yellow);
    //replace UFID and UVID values
    //statement = INSERT INTO TABLE_NAME
    //start with replacing UFID - this is done exactly once per insert statement
    //INSERT INTO TABLE (fieldA, fieldB, fieldC) VAlUES (A,B,C), (D,E,F), (G,H,I)
    let placeholder = (!isLastProperty && COMMA + UFID) || STOP_REPLACING;
    sqlInsertStatement = sqlInsertStatement
      //replace(UFID, `${(mappedProperty + '').
      .replace(UFID, `${mappedProperty.toUpperCase()}` + placeholder);
    logInfo(sqlInsertStatement);
    //if not last record => statement should += (field_name, UFID) VALUES (UVID)
    //otherwise statement should += (fieldName) VALUES (UVID)
    //replace UFID next
    translateValue(record[property], treatPropertyValueAsString); //need to property "quote" strings
    placeholder = (!isLastProperty && COMMA + UVID) || STOP_REPLACING;
    sqlInsertStatement = sqlInsertStatement.replace(
      UVID,
      `${translateValue(record[property], treatPropertyValueAsString)}` +
        placeholder
    );
    //(field_name, UFID) values (field_value, UVID)
    logInfo(`Insert Statement from properties...` + sqlInsertStatement.gray);
  });
  logInfo(
    'insertFromProperties after insertDBTimeFunction... '.magenta +
      sqlInsertStatement
  );

  sqlInsertStatement =
    (options?.timestamps &&
      insert_db_time_function(
        sqlInsertStatement,
        options.timestamps.fields,
        options.timestamps.dbTimeFunction
      )) ||
    sqlInsertStatement;
  return (
    sqlInsertStatement ||
    throwError('Insert statement in propValsTo... is null')
  );
};

//called from createSqlInsertStatement
function records_to_insertStatement(records, sqlInsertStatement, options) {
  const dbTimeFunction = options.timestamps.dbTimeFunction;
  !dbTimeFunction && throwError('Time function is null!');
  records = Array.isArray(records) ? records : [records];
  records.forEach((record, index) => {
    const isLastRecord = index === records.length - 1;
    checkForEmptyRecord(record);
    logInfo(
      `insertFieldsAndValuesFromObjects before insertFromProperties... `.yellow,
      sqlInsertStatement
    );
    sqlInsertStatement = record_fieldsOrValues_to_insertStatement(
      record,
      sqlInsertStatement,
      options
    );
    //add a new row of values if we have another record to process
    sqlInsertStatement += (!isLastRecord && COMMA + ROW_DATA) || '';
    logInfo(
      'insertFieldsAndValuesFromObjects after insertFromProperties... '.yellow,
      sqlInsertStatement
    );
    //dbTimeFunction && insert_db_time_function(sqlInsertStatement, dbTimeFunction);
  });

  return (
    sanitizeString(sqlInsertStatement) + SEMICOLON ||
    throwError(
      'Final version of insert statement in insertFieldsAndValues is null'
    )
  );
}

const createSqlSelectStatement = (tablenames, fieldnames, options) => {
  !tablenames ||
    (!fieldnames &&
      !options?.selectAll === true &&
      throwError('Invalid select!'));
  fieldnames = (Array.isArray(fieldnames) && fieldnames) || [fieldnames];
  if (options?.selectAll) {
    selectStatement = createSelectAllSqlStatement(tablenames);
    return;
  }
  tablenames = (Array.isArray(tablenames) && tablenames) || [tablenames];
  let selectStatement = createSelect(options);
  selectStatement = replaceTablenames(tablenames, selectStatement);
  selectStatement =
    (fieldnames && replaceFields(fieldnames, selectStatement)) ||
    selectStatement;
  logInfo('Created SQL statement: '.blue + selectStatement?.yellow);
  const theWhereClause = whereClause(selectStatement);
  logInfo(theWhereClause);
  return theWhereClause;
};

const createSqlInsertStatement = (tablename, records, options) => {
  let sqlInsertStatement =
    INSERT_STATEMENT.replace(TABLE, tablename) + ROW_DATA;
  //timestamp fields appear once
  sqlInsertStatement = insert_timestamp_fields(
    sqlInsertStatement,
    options?.timestamps
  );
  sqlInsertStatement ||
    throwError('Insert statement after insertTimestampFields is null');
  logInfo(
    `SQL insert statement from inserTimestampFields...${sqlInsertStatement}`
  );
  logInfo(
    'constructInsertStatement before insertFromObjects'.yellow,
    sqlInsertStatement.green
  );
  sqlInsertStatement = records_to_insertStatement(
    records,
    sqlInsertStatement,
    options
  );
  sqlInsertStatement = options?.returning
    ? addReturningStatement(sqlInsertStatement, 'id')
    : sqlStatement;
  return (
    sanitizeString(sqlInsertStatement) ||
    throwError('Insert statement in createSqlInsert... is null!'.red)
  );
};

const createSqlInsertWhereStatement = (
  tablename,
  records,
  select,
  where,
  options
) => {
  let insertStatement = INSERT_STATEMENT_NO_VALUES.replace(TABLE, tablename);
  logInfo(
    'constructInsertWhereStatement before...'.yellow,
    insertStatement.green
  );
  //what is the select statement below doing??
  const selectStatement = createSqlSelectStatement(
    tablename,
    select,
    where,
    options
  );
  insertStatement = insertFieldsFromObjects(records, insertStatement, options);
  return whereClause(insertStatement);
};

const createSqlUpdateStatement = (tableName, record, options) => {
  logInfo(`Options passed to createUpdate.. = `.blue.underline.italic);
  logInfo(options);
  let updateStatement = UPDATE_STATEMENT.replace(TABLE, tableName);
  options?.timestamps &&
    options?.createDefaultTimeStamps &&
    createDefaultTimeStamps(options.timestamps);
  updateStatement = updateFromRecord(record, updateStatement, options);
  if (!updateStatement) throw new Error('SQL statement is blank!'.red);
  return whereClause(updateStatement);
};

//DELETE FIELD_A, FIELDB, FIELDC...FROM TABLE WHERE SOME CONDITIONS ARE MET
const createsqlDeleteStatement = (tableName, fields, options) => {
  logInfo(`Options passed to createDelete... = `.blue.underline.italic);
  logInfo(options);
  let deleteStatement = DELETE_STATEMENT.replace(TABLE, tableName);
  options?.timestamps &&
    options.includeUpdatedAt &&
    createUpdatedAtTimestamp(timestamps);
  deleteStatement = replaceFields(fields, deleteStatement);
};

module.exports = {
  createSqlInsertStatement,
  createSqlSelectStatement,
  createSqlUpdateStatement,
  createSqlInsertWhereStatement,
  getModuleLoggingMetaData
};

let testCount = 1;

if (TEST) {
  const fields = { createdAt: 'created_at', updatedAt: 'updated_at' };
  const timestamps = {
    fields,
    dbTimeFunction: 'LOCALTIMESTAMP',
    createTimeStampsByDefault: false
  };
  const options = { timestamps };

  logInfo(`Test #${testCount++}`.green);
  let insertStatement = createSqlInsertStatement(
    `users`,
    [
      {
        name: 'Troy',
        age: 50,
        address: '5311 Belmonont',
        zip: 75206,
        religion: 'Catholic',
        favoriteDrink: 'Dr. Pepper'
      }
    ],
    options
  );
  logInfo(insertStatement?.white || 'Function failed!'.red);

  const testArray = [
    {
      name: 'Troy',
      age: 50,
      address: '5311 Belmonont',
      zip: 75206,
      religion: 'Catholic',
      favoriteDrink: 'Dr. Pepper'
    },
    {
      name: 'Fred',
      age: 20,
      address: '11 Travis',
      zip: 75206,
      religion: 'Jewish',
      favoriteDrink: 'Coke'
    }
  ];

  logInfo(`Test #${testCount++}`.green);
  insertStatement = createSqlInsertStatement(`drinkers`, testArray, options);
  logInfo(insertStatement?.white || 'Function failed!'.red);

  const testArray2 = [
    {
      name: 'Troy',
      age: 50,
      address: '5311 Belmonont',
      zip: 75206,
      religion: 'Catholic',
      favoriteDrink: 'Dr. Pepper'
    },
    {
      name: 'Fred',
      age: 20,
      address: '11 Travis',
      zip: 75206,
      religion: 'Jewish',
      favoriteDrink: 'Coke'
    },
    {
      name: 'Sam',
      age: 29,
      address: '11511 Mulholland',
      zip: 75206,
      religion: 'Mormon',
      favoriteDrink: 'Sprite'
    }
  ];

  logInfo(`Test #${testCount++}`.green);
  insertStatement = createSqlInsertStatement(`shoe_heads`, testArray2, options);
  logInfo(insertStatement?.white || 'Function failed!'.red);

  const testArray3 = [
    {
      name: 'Troy',
      age: 50,
      address: '5311 Belmonont',
      zip: 75206,
      religion: 'Catholic',
      favoriteDrink: 'Dr. Pepper'
    },
    {
      name: 'Fred',
      age: 20,
      address: '11 Travis',
      zip: 75206,
      religion: 'Jewish',
      favoriteDrink: 'Coke'
    },
    {
      name: 'Sam',
      age: 29,
      address: '11511 Mulholland',
      zip: 75206,
      religion: 'Mormon',
      favoriteDrink: 'Sprite'
    }
  ];

  logInfo(`Test #${testCount++}`.green);
  options.mappedProperties = {
    address: 'home_address',
    favoriteDrink: 'favorite_drink'
  };
  options.timestamps.lastLogin = 'last_log_in_at';
  insertStatement = createSqlInsertStatement(`shoe_heads`, testArray3, options);
  logInfo(insertStatement?.white || 'Function failed!'.red);
  let firstSelect = createSqlSelectStatement('sneaker_user', [
    'username',
    'password',
    'last_login_time'
  ]);
  logInfo(`SQL statement generated: ` + firstSelect.SQL_STATEMENT.green);
  logInfo(firstSelect);
  firstSelect = firstSelect.where('username').isEqualTo('troy1971').get();
  log(firstSelect + '\n');
  const secondSelect = createSqlSelectStatement('sneaker_user', [
    'username',
    'password',
    'last_login_time'
  ])
    .where('username')
    .isEqualTo('troy1971')
    .and('password')
    .isEqualTo('3453egdfg@##')
    .get();
  logInfo(secondSelect + '\n');
  const thirdSelect = createSqlSelectStatement('sneaker_user', [
    'username',
    'password',
    'last_login_time'
  ])
    .where('username')
    .isEqualTo('troy1971')
    .and('password')
    .isEqualTo('3453egdfg@##')
    .and('last_login_in_time')
    .isEqualTo(new Date())
    .get();
  logInfo(thirdSelect + '\n');
  const updateStatement = createSqlUpdateStatement(
    'users',
    testArray[0],
    options
  )
    .where('user_id')
    .isEqualTo(10)
    .get();
  logInfo(updateStatement);
}
