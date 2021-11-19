const config = require('../.config/db.config.json');

const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
    dialectOptions: {
      useUTC: config.development.dialectOptions.useUTC, // for reading from database
      dateStrings: config.development.dialectOptions.dateStrings,
      typeCast: config.development.dialectOptions.typeCast,
    },
    timezone: config.development.timezone, // for writing to database
  },
);
const fs = require('fs');
const path = require('path');

const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
const db = {};

fs.readdirSync(__dirname)
  .filter(
    (file) => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js',
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.ROLES = ['user', 'admin'];

module.exports = db;
