// Services

// Service dos detalhes do Pedido.
const pedidoService = require('../services/detPedido.service');
// Service que envia descrição de constraints para o front-end/email
const verifyConstraints = require('../services/verifyConstraints');

module.exports = {
  /// /GET

  // Buscar os pedidos por ID do pedido
  buscarPorIdPedido: async (req, res) => {
    const pedidos = await pedidoService.findByPk(req.params.id);

    if (pedidos !== null) {
      const constraints = await verifyConstraints({
        centro_custos: pedidos.det_pedidos[0].id_centro_custos,
        curso: pedidos.det_pedidos[0].id_curso,
        modo_envio: pedidos.id_modo_envio,
        avaliacao: pedidos.id_avaliacao_pedido,
        servicoCA: pedidos.servico_pedidos[0].servicoCA,
        servicoCT: pedidos.servico_pedidos[0].servicoCT,
      });

      pedidos.id_avaliacao_pedido = constraints[1].descricao;
      pedidos.det_pedidos[0].id_centro_custos = constraints[2].descricao;
      pedidos.det_pedidos[0].id_curso = constraints[3].descricao;
      pedidos.servico_pedidos[0].dataValues.servicoCA
        = constraints[5].descricao;
      pedidos.servico_pedidos[0].dataValues.servicoCT
        = constraints[6].descricao;
      pedidos.id_modo_envio = await constraints[4].descricao;
    }

    // Retorna mensagem se encontrar um pedido nulo.
    if (pedidos == null) {
      return res
        .status(404)
        .json({ message: `Nenhum pedido com id ${req.params.id}` });
    }

    // Só passa para o serializer se o nif fornecido no login for o mesmo ao nif cadastrado no pedido.
    if (req.user.nif === pedidos.nif) {
      return res.json(pedidos);
    }

    // Verificando se o usuário que está querendo ver os detalhes do pedido de outro usuário é administrador

    req.array = [pedidos];
    await authJwt.isAdmin(req, res);
  },
};
