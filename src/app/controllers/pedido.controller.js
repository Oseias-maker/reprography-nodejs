//Services
const pedidoService = require("../services/pedido.service");
const servicoService = require("../services/servico.service");

//Enviando descrição de constraints para o front-end/email
const verifyConstraints = require("../services/verifyConstraints");

//Envio de e-mail
const mailer = require("../../mailer/mailer.js");
const { mailerConfig } = require('../../config/');
const template = require("../templates/emails");

//Validators
const validators = require("../validators/pedido.validator");

//Constants
const constants = require("../constants/pedido.constant");
const status = require("../constants/status.constant");

//Utilizado para excluir imagens
const { unlink } = require("fs");

module.exports = {

    ////ADMIN

    //GET 

    //Buscar todos os pedidos da tabela pedido
    buscarTodos: async (req, res) => {
        const { rated } = req.params;

        const ratedValid = await validators.isParameterValid(rated);

        if (!ratedValid) {
            return res.json({ status: status.error, message: constants.invalidParameter });
        };

        try {
            let pedidos = await pedidoService.findAllRated(ratedValid);

            if (pedidos.length < 1) {
                return res.json({ status: status.error, message: constants.notFoundArray });
            }

            //Verificando Constraints
            for (let i = 0; i < pedidos.length; i++) {
                const constraints = await verifyConstraints({ modo_envio: pedidos[i].dataValues.id_modo_envio, avaliacao: pedidos[i].dataValues.id_avaliacao_pedido });

                pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
                pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;

            }
            return res.status(200).json(pedidos);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    buscarPorNome: async (req, res) => {
        try {
            let pedidos = await pedidoService.findByName(req.params.pedido);

            if (pedidos.length < 1) {
                return res.json({ status: status.error, message: constants.notFoundArray });
            };

            //Verificando Constraints
            for (let i = 0; i < pedidos.length; i++) {
                const constraints = await verifyConstraints({ modo_envio: pedidos[i].dataValues.id_modo_envio, avaliacao: pedidos[i].dataValues.id_avaliacao_pedido });

                pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
                pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;

            }
            return res.status(200).json(pedidos);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    //Buscar os pedidos por ID do pedido
    buscarPorIdPedido: async (req, res) => {
        try {
            let pedidos = await pedidoService.findByPk(req.params.id);

            if (pedidos == null) {
                return res.json({ status: status.error, message: constants.notFound });
            };

            const constraints = await verifyConstraints({ modo_envio: pedidos.dataValues.id_modo_envio, avaliacao: pedidos.dataValues.id_avaliacao_pedido });

            pedidos.dataValues.id_avaliacao_pedido = constraints[1].descricao;
            pedidos.dataValues.id_modo_envio = constraints[4].descricao;

            return res.status(200).json(pedidos);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    //Todos os pedidos feito por tal pessoa (nif)
    buscarPorNif: async (req, res) => {
        const { rated } = req.params;

        const ratedValid = await validators.isParameterValid(rated);

        if (!ratedValid) {
            return res.json({ status: status.error, message: constants.invalidParameter });
        };

        try {
            let pedidos = await pedidoService.findAllRatedbyNif(req.params.nif, ratedValid);

            if (pedidos.length < 1) {
                return res.json({ status: status.error, message: constants.notFoundArray });
            }

            for (let i = 0; i < pedidos.length; i++) {
                const constraints = await verifyConstraints({ modo_envio: pedidos[i].dataValues.id_modo_envio, avaliacao: pedidos[i].dataValues.id_avaliacao_pedido });

                pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
                pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;

            }
            return res.status(200).json(pedidos);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },


    ////Usuário Comum 

    //GET

    //Todos os pedidos feito pelo usuário LOGADO!
    meusPedidos: async (req, res) => {
        const { rated } = req.params;

        const ratedValid = await validators.isParameterValid(rated);

        if (!ratedValid) {
            return res.json({ status: status.error, message: constants.invalidParameter });
        };

        try {
            let pedidos = await pedidoService.findAllRatedbyNif(req.user.nif, ratedValid);

            if (pedidos.length < 1) {
                return res.json({ status: status.error, message: constants.notFoundArray });
            }

            //Verificando Constraints 
            for (let i = 0; i < pedidos.length; i++) {
                const constraints = await verifyConstraints({ modo_envio: pedidos[i].dataValues.id_modo_envio, avaliacao: pedidos[i].dataValues.id_avaliacao_pedido });

                pedidos[i].dataValues.id_avaliacao_pedido = constraints[1].descricao;
                pedidos[i].dataValues.id_modo_envio = constraints[4].descricao;

            }
            return res.status(200).json(pedidos);
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },

    //POST


    //Adicionar pedido com detalhe solicitado por nif (usuario)
    adicionar: async (req, res) => {
        //Input que será enviado para tabela Pedido
        const { centro_custos, titulo_pedido, modo_envio, curso } = req.body;

        // Input que será enviado para tabela Det_Pedido
        const { num_copias, num_paginas, servicoCT, servicoCA, observacoes } = req.body;

        if (!num_copias || !num_paginas || !titulo_pedido || !modo_envio || !curso || !centro_custos) {
            return res.json({ status: status.error, message: "Solicitação faltando dados!"});
        }

        const custo_total = [(num_copias * num_paginas) * req.sub_total];

        try {
            //Inserindo um pedido e seus detalhes/serviços:
            await pedidoService.pedidoCreate({
                param: {
                    titulo_pedido: titulo_pedido, nif: req.user.nif, id_modo_envio: modo_envio,
                    id_avaliacao_pedido: 0, avaliacao_obs: null, custo_total: custo_total,
                    det_pedidos: {
                        id_centro_custos: centro_custos, id_curso: curso, num_copias: num_copias,
                        num_paginas: num_paginas, observacoes: observacoes, sub_total_copias: req.sub_total
                    },
                }

            }).then(pedido => {
                pedidoService.tableMidCreate({
                    param: {
                        pedidoId: pedido.id_pedido,
                        servicoCT: servicoCT,
                        servicoCA: servicoCA
                    }
                }).then(async servico => {
                    if (servico.servicoCT == 5 || servico.servicoCT == 6) {
                        await servicoService.serviceDecrement({ type: "ct", number: [5, 6], param: (num_copias * num_paginas) });
                    }
                    else {
                        await servicoService.serviceDecrement({ type: "ct", number: [servicoCT, servicoCT], param: (num_copias * num_paginas) });
                    }
                    await servicoService.serviceDecrement({ type: "ca", number: [servicoCA, servicoCA], param: (num_copias * num_paginas) });

                    const constraints = await verifyConstraints({ centro_custos: centro_custos, curso: curso, modo_envio: modo_envio, avaliacao: 0, servicoCA: servicoCA, servicoCT: servicoCT });

                    const output = template.pedidoEmail({ id: pedido.id_pedido, titulo_pedido: titulo_pedido, nif: req.user.nif, centro_custos: constraints[2].descricao, curso: constraints[3].descricao, servicoCA: constraints[5].descricao, servicoCT: constraints[6].descricao, modo_envio: constraints[4].descricao, num_paginas: num_paginas, num_copias: num_copias, observacoes: observacoes });
                    const email = mailerConfig.reproEmail;
                    const title = `Solicitação de Reprografia Nº${pedido.id_pedido}`;
                    let attachments = [];

                    if (req.file) {
                        attachments = [
                            {
                                filename: req.file.filename,
                                path: req.file.path
                            }
                        ]
                        //Exclui o Anexo que foi feito upload pelo multer para ser enviado pelo mailer 
                        //depois de 5seg
                        setTimeout(async () => {
                            await unlink(req.file.path, (err) => {
                                if (err) throw err;
                                console.log(`successfully deleted ${req.file.path}`);
                            });

                        }, 5000);
                    }

                    else { attachments = null }

                    await mailer.sendEmails(email, title, output, { attachments: attachments });

                    return res.status(200).json({ status: status.ok, message: "Pedido realizado com sucesso!" });
                });
            });
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    },


    //PUT

    alterarAvaliacao: async (req, res) => {
        const { id_avaliacao_pedido, avaliacao_obs } = req.body;

        if (!id_avaliacao_pedido) {
            return res.json({ status: status.error, message: "Informe se o pedido lhe atendeu ou não, por favor!" });
        }

        try {
            const pedidos = await pedidoService.findByPk(req.params.id);

            if (pedidos == null) {
                return res.json({ status: status.error, message: constants.notFound });
            }

            if (pedidos.id_avaliacao_pedido !== 0) {
                return res.json({ status: status.error, message: constants.alreadyRated });
            }

            if (req.user.nif === pedidos.nif) {
                await pedidoService.updateRequest({ request: pedidos, param: { id_avaliacao_pedido, avaliacao_obs } });

                const constraints = await verifyConstraints({ avaliacao: id_avaliacao_pedido });
                const output = template.avaliacaoEmail({ id: pedidos.id_pedido, titulo_pedido: pedidos.titulo_pedido, nif: pedidos.nif, avaliacao_obs: avaliacao_obs, avaliacao_pedido: constraints[1].descricao });
                const email = mailerConfig.reproEmail;
                const title = `Avaliação da Reprografia Nº${pedidos.id_pedido}`;

                await mailer.sendEmails(email, title, output, { attachments: null });
                return res.status(200).json({ status: status.ok, message: `Avaliação do pedido ${req.params.id} atualizada com sucesso!` });
            }
            else {
                return res.json({ status: status.error, message: "Você só pode alterar a avaliação de um pedido feito pelo seu usuário" });
            }
        }
        catch (err) {
            res.status(500).json({ status: status.error, message: err.message });
        };
    }
};