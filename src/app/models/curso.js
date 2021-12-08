const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('curso', {
    id_curso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    descricao: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_depto: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'departamento',
        key: 'id_depto'
      }
    }
  }, {
    sequelize,
    tableName: 'curso',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_curso" },
        ]
      },
      {
        name: "id_depto",
        using: "BTREE",
        fields: [
          { name: "id_depto" },
        ]
      },
    ]
  });
};
