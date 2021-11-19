// Inicializando as models e as recebendo
const { initModels } = require('../models/init-models');

const { pedido } = initModels(sequelize);

module.exports = {
  // Todos os pedidos feito por tal pessoa (nif)
  findByPk: async (id) => {
    const pedidos = await pedido.findByPk(id, {
      include: ['det_pedidos', 'servico_pedidos'],
    });

    return pedidos;
  },
};
