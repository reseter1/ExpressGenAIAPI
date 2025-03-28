'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.CURRENT_ENV || 'development';
const config = require(path.join(__dirname, '/../config/database.config.json'))[env];
const db = {};

const sequelize = config.use_env_variable 
  ? new Sequelize(process.env[config.use_env_variable], { 
      ...config, 
      logging: false,
      pool: {
        max: 20,
        min: 5,
        idle: 10000,
        acquire: 30000
      }
    })
  : new Sequelize(config.database, config.username, config.password, { 
      ...config, 
      logging: false,
      pool: {
        max: 20,
        min: 5,
        idle: 10000,
        acquire: 30000
      }
    });

fs.readdirSync(__dirname)
  .filter(file => (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.endsWith('.js') &&
    !file.endsWith('.test.js')
  ))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;