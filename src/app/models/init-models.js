const { DataTypes } = require('sequelize');
const Sequelize = require('sequelize');
const _avaliacao_pedido = require('./avaliacao_pedido');
const _centro_custos = require('./centro_custos');
const _curso = require('./curso');
const _departamento = require('./departamento');
const _det_pedido = require('./det_pedido');
const _modo_envio = require('./modo_envio');
const _pedido = require('./pedido');
const _resettoken = require('./resettoken');
const _servicoCapaAcabamento = require('./servicoCapaAcabamento');
const _servicoCopiaTamanho = require('./servicoCopiaTamanho');
const _servico_pedido = require('./servico_pedido');
const _tipo_usuario = require('./tipo_usuario');
const _user_roles = require('./user_roles');
const _usuario = require('./usuario');

const config = require('../.config/db.config.json');

sequelize = new Sequelize(
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
  }
);

function initModels(sequelize) {
  const avaliacao_pedido = _avaliacao_pedido(sequelize, DataTypes);
  const centro_custos = _centro_custos(sequelize, DataTypes);
  const curso = _curso(sequelize, DataTypes);
  const departamento = _departamento(sequelize, DataTypes);
  const det_pedido = _det_pedido(sequelize, DataTypes);
  const modo_envio = _modo_envio(sequelize, DataTypes);
  const pedido = _pedido(sequelize, DataTypes);
  const resettoken = _resettoken(sequelize, DataTypes);
  const servicoCapaAcabamento = _servicoCapaAcabamento(sequelize, DataTypes);
  const servicoCopiaTamanho = _servicoCopiaTamanho(sequelize, DataTypes);
  const servico_pedido = _servico_pedido(sequelize, DataTypes);
  const tipo_usuario = _tipo_usuario(sequelize, DataTypes);
  const user_roles = _user_roles(sequelize, DataTypes);
  const usuario = _usuario(sequelize, DataTypes);

  tipo_usuario.belongsToMany(usuario, {
    as: 'userId_usuarios',
    through: user_roles,
    foreignKey: 'roleId',
    otherKey: 'userId',
  });
  usuario.belongsToMany(tipo_usuario, {
    as: 'roles',
    through: user_roles,
    foreignKey: 'userId',
    otherKey: 'roleId',
  });
  pedido.belongsTo(avaliacao_pedido, {
    as: 'id_avaliacao_pedido_avaliacao_pedido',
    foreignKey: 'id_avaliacao_pedido',
  });
  avaliacao_pedido.hasMany(pedido, {
    as: 'pedidos',
    foreignKey: 'id_avaliacao_pedido',
  });
  det_pedido.belongsTo(centro_custos, {
    as: 'id_centro_custos_centro_custo',
    foreignKey: 'id_centro_custos',
  });
  centro_custos.hasMany(det_pedido, {
    as: 'det_pedidos',
    foreignKey: 'id_centro_custos',
  });
  det_pedido.belongsTo(curso, { as: 'id_curso_curso', foreignKey: 'id_curso' });
  curso.hasMany(det_pedido, { as: 'det_pedidos', foreignKey: 'id_curso' });
  curso.belongsTo(departamento, {
    as: 'id_depto_departamento',
    foreignKey: 'id_depto',
  });
  departamento.hasMany(curso, { as: 'cursos', foreignKey: 'id_depto' });
  usuario.belongsTo(departamento, {
    as: 'id_depto_departamento',
    foreignKey: 'depto',
  });
  departamento.hasMany(usuario, { as: 'usuarios', foreignKey: 'depto' });
  pedido.belongsTo(modo_envio, {
    as: 'id_modo_envio_modo_envio',
    foreignKey: 'id_modo_envio',
  });
  modo_envio.hasMany(pedido, { as: 'pedidos', foreignKey: 'id_modo_envio' });
  det_pedido.belongsTo(pedido, {
    as: 'id_pedido_pedido',
    foreignKey: 'id_pedido',
  });
  pedido.hasMany(det_pedido, { as: 'det_pedidos', foreignKey: 'id_pedido' });
  servico_pedido.belongsTo(pedido, { as: 'pedido', foreignKey: 'pedidoId' });
  pedido.hasMany(servico_pedido, {
    as: 'servico_pedidos',
    foreignKey: 'pedidoId',
  });
  servico_pedido.belongsTo(servicoCapaAcabamento, {
    as: 'servicoCA_servicoCapaAcabamento',
    foreignKey: 'servicoCA',
  });
  servicoCapaAcabamento.hasMany(servico_pedido, {
    as: 'servico_pedidos',
    foreignKey: 'servicoCA',
  });
  servico_pedido.belongsTo(servicoCopiaTamanho, {
    as: 'servicoCT_servicoCopiaTamanho',
    foreignKey: 'servicoCT',
  });
  servicoCopiaTamanho.hasMany(servico_pedido, {
    as: 'servico_pedidos',
    foreignKey: 'servicoCT',
  });
  user_roles.belongsTo(tipo_usuario, { as: 'role', foreignKey: 'roleId' });
  tipo_usuario.hasMany(user_roles, { as: 'user_roles', foreignKey: 'roleId' });
  pedido.belongsTo(usuario, { as: 'nif_usuario', foreignKey: 'nif' });
  usuario.hasMany(pedido, { as: 'pedidos', foreignKey: 'nif' });
  user_roles.belongsTo(usuario, { as: 'user', foreignKey: 'userId' });
  usuario.hasMany(user_roles, { as: 'user_roles', foreignKey: 'userId' });

  return {
    avaliacao_pedido,
    centro_custos,
    curso,
    departamento,
    det_pedido,
    modo_envio,
    pedido,
    resettoken,
    servicoCapaAcabamento,
    servicoCopiaTamanho,
    servico_pedido,
    tipo_usuario,
    user_roles,
    usuario,
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
