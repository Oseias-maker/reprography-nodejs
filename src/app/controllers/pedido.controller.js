// Services
const { unlink } = require('fs');
const pedidoService = require('../services/pedido.service');
const servicoService = require('../services/servico.service');

// Enviando descrição de constraints para o front-end/email
const verifyConstraints = require('../services/verifyConstraints');

// Envio de e-mail
const { mailer } = require('../utils');
const mailerConfig = require('../.config/mailer.config');
const template = require('../templates/emails');

// Utilizado para excluir imagens

module.exports = {
  /// /ADMIN

  // GET

  // Buscar todos os pedidos da tabela pedido
  buscarTodos: async (req, res, next) => {
    let { rated } = req.params;

    if (rated == 1) {
      rated = [1, 2];
    } else if (rated == 0) {
      rated = [0, 0];
    } else {
      return res.json({ message: 'Insira um parâmetro válido!' });
    }

    const pedidos = await pedidoService.findAllRated(rated);

    if (pedidos.length < 1) {
      return res.json({ message: 'Nenhum pedido encontrado!' });
    }
    // Verificando Constraints
    for (let i = 0; i < pedidos.length; i++) {
      const constraints = await verifyConstraints({
        modo_envio: pedidos[i].dataValues.id_modo_envio,
        avaliacao: pedidos[i].dataValues.id_avaliacao_pedido,
      });

      pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
      pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;
    }
    res.json(pedidos);
  },

  buscarPorNome: async (req, res, next) => {
    // const query = `%${req.query.search}`;
    const pedidos = await pedidoService.findByName(req.params.pedido);
    if (pedidos.length < 1) {
      return res.json({ message: 'Nenhum pedido encontrado!' });
    }

    // Verificando Constraints
    for (let i = 0; i < pedidos.length; i++) {
      const constraints = await verifyConstraints({
        modo_envio: pedidos[i].dataValues.id_modo_envio,
        avaliacao: pedidos[i].dataValues.id_avaliacao_pedido,
      });

      pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
      pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;
    }
    res.json(pedidos);
  },

  // Buscar os pedidos por ID do pedido
  buscarPorIdPedido: async (req, res, next) => {
    const pedidos = await pedidoService.findByPk(req.params.id);
    if (pedidos == null) {
      return res.json({ message: 'Pedido não encontrado!' });
    }

    const constraints = await verifyConstraints({
      modo_envio: pedidos.dataValues.id_modo_envio,
      avaliacao: pedidos.dataValues.id_avaliacao_pedido,
    });

    pedidos.dataValues.id_avaliacao_pedido = constraints[1].descricao;
    pedidos.dataValues.id_modo_envio = constraints[4].descricao;

    res.json(pedidos);
  },

  // Todos os pedidos feito por tal pessoa (nif)
  buscarPorNif: async (req, res, next) => {
    let { rated } = req.params;

    if (rated == 1) {
      rated = [1, 2];
    } else if (rated == 0) {
      rated = [0, 0];
    } else {
      return res.json({ message: 'Insira um parâmetro válido!' });
    }

    const pedidos = await pedidoService.findAllRatedbyNif(
      req.params.nif,
      rated
    );

    if (pedidos.length < 1) {
      return res.json({ message: 'Nenhum pedido encontrado!' });
    }

    for (let i = 0; i < pedidos.length; i++) {
      const constraints = await verifyConstraints({
        modo_envio: pedidos[i].dataValues.id_modo_envio,
        avaliacao: pedidos[i].dataValues.id_avaliacao_pedido,
      });

      pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
      pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;
    }
    res.json(pedidos);
  },

  /// /Usuário Comum

  // GET

  // Todos os pedidos feito pelo usuário LOGADO!
  meusPedidos: async (req, res, next) => {
    let { rated } = req.params;

    if (rated == 1) {
      rated = [1, 2];
    } else if (rated == 0) {
      rated = [0, 0];
    } else {
      return res.json({ message: 'Insira um parâmetro válido!' });
    }

    const pedidos = await pedidoService.findAllRatedbyNif(req.user.nif, rated);

    if (pedidos.length < 1) {
      return res.json({ message: 'Nenhum pedido encontrado!' });
    }

    // Verificando Constraints
    for (let i = 0; i < pedidos.length; i++) {
      const constraints = await verifyConstraints({
        modo_envio: pedidos[i].dataValues.id_modo_envio,
        avaliacao: pedidos[i].dataValues.id_avaliacao_pedido,
      });

      pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
      pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;
    }
    res.json(pedidos);
  },

  // POST

  // Adicionar pedido com detalhe solicitado por nif (usuario)
  adicionar: async (req, res) => {
    // Input que será enviado para tabela Pedido
    const { centro_custos, titulo_pedido, modo_envio, curso } = req.body;

    // Input que será enviado para tabela Det_Pedido
    const { num_copias, num_paginas, servicoCT, servicoCA, observacoes } =
      req.body;

    const custo_total = [num_copias * num_paginas * req.sub_total];

    // Inserindo um pedido e seus detalhes/serviços:
    await pedidoService
      .pedidoCreate({
        param: {
          titulo_pedido,
          nif: req.user.nif,
          id_modo_envio: modo_envio,
          id_avaliacao_pedido: 0,
          avaliacao_obs: null,
          custo_total,
          det_pedidos: {
            id_centro_custos: centro_custos,
            id_curso: curso,
            num_copias,
            num_paginas,
            observacoes,
            sub_total_copias: req.sub_total,
          },
        },
      })
      .then((pedido) => {
        pedidoService
          .tableMidCreate({
            param: {
              pedidoId: pedido.id_pedido,
              servicoCT,
              servicoCA,
            },
          })
          .then(async (servico) => {
            if (servico.servicoCT == 5 || servico.servicoCT == 6) {
              await servicoService.serviceDecrement({
                type: 'ct',
                number: [5, 6],
                param: num_copias * num_paginas,
              });
            } else {
              await servicoService.serviceDecrement({
                type: 'ct',
                number: [servicoCT, servicoCT],
                param: num_copias * num_paginas,
              });
            }
            await servicoService.serviceDecrement({
              type: 'ca',
              number: [servicoCA, servicoCA],
              param: num_copias * num_paginas,
            });
            return res.json({ message: 'Pedido realizado com sucesso!' });
          })
          .then(async (send) => {
            const constraints = await verifyConstraints({
              centro_custos,
              curso,
              modo_envio,
              avaliacao: 0,
              servicoCA,
              servicoCT,
            });
            // console.log(constraints);

            const output = template.pedidoEmail({
              id: pedido.id_pedido,
              titulo_pedido,
              nif: req.user.nif,
              centro_custos: constraints[2].descricao,
              curso: constraints[3].descricao,
              servicoCA: constraints[5].descricao,
              servicoCT: constraints[6].descricao,
              modo_envio: constraints[4].descricao,
              num_paginas,
              num_copias,
              observacoes,
            });
            const email = mailerConfig.reproEmail;
            const title = `Solicitação de Reprografia Nº${pedido.id_pedido}`;

            if (req.file) {
              var attachments = [
                {
                  filename: req.file.filename,
                  path: req.file.path,
                },
              ];
              // Exclui o Anexo que foi feito upload pelo multer para ser enviado pelo mailer
              // depois de 5seg
              setTimeout(async () => {
                await unlink(req.file.path, (err) => {
                  if (err) throw err;
                  console.log(`successfully deleted ${req.file.path}`);
                });
              }, 5000);
            } else {
              attachments = null;
            }
            // console.log(output);
            await mailer.sendEmails(email, title, output, { attachments });
          });
      });
  },

  // PUT

  alterarAvaliacao: async (req, res, next) => {
    const { id_avaliacao_pedido, avaliacao_obs } = req.body;

    if (!id_avaliacao_pedido) {
      return res.json({
        error: 'Informe se o pedido lhe atendeu ou não, por favor!',
      });
    }

    const pedidos = await pedidoService.findByPk(req.params.id);

    if (pedidos == null) {
      return res.json({ message: 'Esse pedido não existe!' });
    }

    if (pedidos.id_avaliacao_pedido !== 0) {
      return res.json({ message: 'Esse pedido já foi avaliado!' });
    }

    if (req.user.nif === pedidos.nif) {
      await pedidoService.updateRequest({
        request: pedidos,
        param: { id_avaliacao_pedido, avaliacao_obs },
      });
      res.status(200).json({
        message: `Avaliação do pedido ${req.params.id} atualizada com sucesso!`,
      });
      const constraints = await verifyConstraints({
        avaliacao: id_avaliacao_pedido,
      });
      // console.log(constraints);
      const output = template.avaliacaoEmail({
        id: pedidos.id_pedido,
        titulo_pedido: pedidos.titulo_pedido,
        nif: pedidos.nif,
        avaliacao_obs,
        avaliacao_pedido: constraints[1].descricao,
      });
      const email = mailerConfig.reproEmail;
      const title = `Avaliação da Reprografia Nº${pedidos.id_pedido}`;
      // console.log(output);
      await mailer.sendEmails(email, title, output, { attachments: null });
    } else {
      return res.json({
        error:
          'Você só pode alterar a avaliação de um pedido feito pelo seu usuário',
      });
    }
  },
};
