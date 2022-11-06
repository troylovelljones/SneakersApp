'use strict';

const mongoose = require('mongoose');

const createSecretsSchema = () => {
  const schema = new mongoose.Schema(
    {
      id: {
        type: String,
        required: true,
        unique: true
      },
      accessToken: {
        type: String
      },
      accessTokenSecret: {
        type: String
      },
      refreshToken: {
        type: String
      },
      refreshTokenSecret : {
        type: String
      },
      password: {
        type: String
      },
      lastAccess: {
        type: Date,
        required: true,
        immutable: true,
        default: () => new Date()
      }
    }
  );

  return schema;
};

module.exports = createSecretsSchema;
