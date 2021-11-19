// Biblioteca do sequelize
const Sequelize = require('sequelize');
// Operadores do sequelize
const { Op } = Sequelize;

// Inicializando as models e as recebendo
const { initModels } = require('../models/init-models');

const {
  pedido,
  det_pedido,
  centro_custos,
  curso,
  avaliacao_pedido,
  servico_pedido,
  servicoCapaAcabamento,
  servicoCopiaTamanho,
} = initModels(sequelize);

const meses = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

module.exports = {
  // verificacoes: (startedDate, endDate) => {
  // Passar pra cá as chamadas no banco para
  // serem utilizadas nas duas funções (estatisticasMensais e estatisticasQuatroMeses)
  // },

  // Estatisticas sobre as tabelas pedido e det_pedido por Mês.
  // Aqui o usuário vai passar o Ano e o Mês que quer consultar.
  estatisticasMensais: async (req, res) => {
    const { ano, mes } = req.params;

    const endDate = new Date(`${ano}-${mes}-31 23:59:59`);
    const startedDate = new Date(`${ano}-${mes}-01 00:00:00`);

    // Pedido

    // Quantidade de pedidos solicitados no mes passado por parametro
    const pedidos = await pedido.count({
      where: {
        createdAt: {
          [Op.between]: [startedDate, endDate],
        },
      },
    });

    // Soma custo total
    const custo_total = await pedido.sum('custo_total', {
      where: {
        createdAt: {
          [Op.between]: [startedDate, endDate],
        },
      },
    });

    // Cursos - CT-DS, CT-MP, CST-MP e Pós-Graduação
    const num_curso = await curso.findAll();

    // Objeto que será preenchido com descricao e quantidade
    const cursoObj = {};

    // Percorrendo os quatro tipos de curso e trazendo os valores quando id_curso = 1, 2, 3 e 4
    for (let i = 1; i <= num_curso.length; i++) {
      const cursoDesc = await curso.findOne(
        { where: { id_curso: i } },
        { attributes: ['descricao'] },
      );

      const cursoCount = await det_pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
          id_curso: i,
        },
      });

      cursoObj[i] = {
        descricao: cursoDesc.descricao,
        qtdade_solicitada: cursoCount,
      };
    }

    const num_centro_custos = await centro_custos.findAll();
    const centro_custosObj = {};

    for (let i = 1; i <= num_centro_custos.length; i++) {
      const centro_custosDesc = await centro_custos.findOne(
        { where: { id_centro_custos: i } },
        { attributes: ['descricao'] },
      );

      const centro_custosCount = await det_pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
          id_centro_custos: i,
        },
      });

      centro_custosObj[i] = {
        descricao: centro_custosDesc.descricao,
        qtdade_solicitada: centro_custosCount,
      };
    }

    // Lenght de avaliações... vai do 0 ao 2... 0 = não avaliado, 1 = atendeu, 2 = não atendeu!
    const num_avaliacao_pedido = await avaliacao_pedido.findAll();
    // Objeto
    const avaliacao_pedidoObj = {};

    // Começa em 0 pois existe avaliação com id 0 (ainda não avaliado...)
    for (let i = 0; i < num_avaliacao_pedido.length; i++) {
      const avaliacao_pedidoDesc = await avaliacao_pedido.findOne(
        { where: { id_avaliacao_pedido: i } },
        { attributes: ['descricao'] },
      );

      const avaliacao_pedidoCount = await pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
          id_avaliacao_pedido: i,
        },
      });

      avaliacao_pedidoObj[i] = {
        status: avaliacao_pedidoDesc.descricao,
        qtdade_solicitada: avaliacao_pedidoCount,
      };
    }

    // Det Pedido

    // Total de copias mensais
    const total_copias = await det_pedido.sum('num_copias', {
      where: {
        createdAt: {
          [Op.between]: [startedDate, endDate],
        },
      },
    });

    // Total de número de páginas solicitadas por mês
    const num_paginas = await det_pedido.sum('num_paginas', {
      where: {
        createdAt: {
          [Op.between]: [startedDate, endDate],
        },
      },
    });

    const folhas_impressas = total_copias * num_paginas;

    // servico_pedido

    // Lenght Servico CT
    const num_servicoCT = await servicoCopiaTamanho.findAll();
    // Objeto
    const servicoCTObj = {};

    for (let i = 1; i <= num_servicoCT.length; i++) {
      const servicoCTDesc = await servicoCopiaTamanho.findOne(
        { where: { id_servico: i } },
        { attributes: ['descricao'] },
      );

      const servicoCTCount = await servico_pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
          servicoCT: i,
        },
      });

      servicoCTObj[i] = {
        status: servicoCTDesc.descricao,
        qtdade_solicitada: servicoCTCount,
      };
    }

    // Lenght Servico CT
    const num_servicoCA = await servicoCapaAcabamento.findAll();
    // Objeto
    const servicoCAObj = {};

    for (let i = 1; i <= num_servicoCA.length; i++) {
      const servicoCADesc = await servicoCapaAcabamento.findOne(
        { where: { id_servico: i } },
        { attributes: ['descricao'] },
      );

      const servicoCACount = await servico_pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
          servicoCA: i,
        },
      });

      servicoCAObj[i] = {
        status: servicoCADesc.descricao,
        qtdade_solicitada: servicoCACount,
      };
    }

    return res.json({
      mes: meses[mes - 1],
      ano,
      pedidos,
      avaliacao_pedido: avaliacao_pedidoObj,
      servico_copiaTamanho: servicoCTObj,
      servico_capaAcabamento: servicoCAObj,
      num_paginas,
      num_copias: total_copias,
      folhas_impressas,
      centro_custos: centro_custosObj,
      curso: cursoObj,
      custo_total,
    });
  },

  // Estatisticas dos ultimos 3 meses + mês Atual.
  estatisticasQuatroMeses: async (req, res) => {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth() + 1;

    // Objeto que será preenchido
    const mesObj = {};

    // Fazendo o for percorrer 3 meses antes do nosso
    let i = mes - 3;

    for (i; i < mes + 1; i++) {
      // Passando valores dos meses para variável i caso o mês seja janeiro e
      // queiramos retornar os valores dos meses 12, 11 e 10
      if (i === -2) {
        i = 10;
      }
      if (i === -1) {
        i = 11;
      }
      if (i === 0) {
        i = 12;
      }

      const endDate = new Date(`${ano}-${i}-31 23:59:59`);
      const startedDate = new Date(`${ano}-${i}-01 00:00:00`);

      // Pedido

      // Quantidade de pedidos solicitados no mes passado por parametro
      const pedidos = await pedido.count({
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
        },
      });

      // Soma custo total
      const custo_total = await pedido.sum('custo_total', {
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
        },
      });

      // Cursos - CT-DS, CT-MP, CST-MP e Pós-Graduação
      const num_curso = await curso.findAll();

      // Objeto que será preenchido com descricao e quantidade
      const cursoObj = {};

      // Percorrendo os quatro tipos de curso e trazendo os valores quando id_curso = 1, 2, 3 e 4
      for (let i = 1; i <= num_curso.length; i++) {
        const cursoDesc = await curso.findOne(
          { where: { id_curso: i } },
          { attributes: ['descricao'] },
        );

        const cursoCount = await det_pedido.count({
          where: {
            createdAt: {
              [Op.between]: [startedDate, endDate],
            },
            id_curso: i,
          },
        });

        cursoObj[i] = {
          descricao: cursoDesc.descricao,
          qtdade_solicitada: cursoCount,
        };
      }

      const num_centro_custos = await centro_custos.findAll();
      const centro_custosObj = {};

      for (let i = 1; i <= num_centro_custos.length; i++) {
        const centro_custosDesc = await centro_custos.findOne(
          { where: { id_centro_custos: i } },
          { attributes: ['descricao'] },
        );

        const centro_custosCount = await det_pedido.count({
          where: {
            createdAt: {
              [Op.between]: [startedDate, endDate],
            },
            id_centro_custos: i,
          },
        });

        centro_custosObj[i] = {
          descricao: centro_custosDesc.descricao,
          qtdade_solicitada: centro_custosCount,
        };
      }

      // Lenght de avaliações... vai do 0 ao 2... 0 = não avaliado, 1 = atendeu, 2 = não atendeu!
      const num_avaliacao_pedido = await avaliacao_pedido.findAll();
      // Objeto
      const avaliacao_pedidoObj = {};

      // Começa em 0 pois existe avaliação com id 0 (ainda não avaliado...)
      for (let i = 0; i < num_avaliacao_pedido.length; i++) {
        const avaliacao_pedidoDesc = await avaliacao_pedido.findOne(
          { where: { id_avaliacao_pedido: i } },
          { attributes: ['descricao'] },
        );

        const avaliacao_pedidoCount = await pedido.count({
          where: {
            createdAt: {
              [Op.between]: [startedDate, endDate],
            },
            id_avaliacao_pedido: i,
          },
        });

        avaliacao_pedidoObj[i] = {
          status: avaliacao_pedidoDesc.descricao,
          qtdade_solicitada: avaliacao_pedidoCount,
        };
      }

      // Det Pedido

      // Total de copias mensais
      const total_copias = await det_pedido.sum('num_copias', {
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
        },
      });

      // Total de número de páginas solicitadas por mês
      const num_paginas = await det_pedido.sum('num_paginas', {
        where: {
          createdAt: {
            [Op.between]: [startedDate, endDate],
          },
        },
      });

      const folhas_impressas = total_copias * num_paginas;

      // servico_pedido

      // Lenght Servico CT
      const num_servicoCT = await servicoCopiaTamanho.findAll();
      // Objeto
      const servicoCTObj = {};

      for (let i = 1; i <= num_servicoCT.length; i++) {
        const servicoCTDesc = await servicoCopiaTamanho.findOne(
          { where: { id_servico: i } },
          { attributes: ['descricao'] },
        );

        const servicoCTCount = await servico_pedido.count({
          where: {
            createdAt: {
              [Op.between]: [startedDate, endDate],
            },
            servicoCT: i,
          },
        });

        servicoCTObj[i] = {
          status: servicoCTDesc.descricao,
          qtdade_solicitada: servicoCTCount,
        };
      }

      // Lenght Servico CT
      const num_servicoCA = await servicoCapaAcabamento.findAll();
      // Objeto
      const servicoCAObj = {};

      for (let i = 1; i <= num_servicoCA.length; i++) {
        const servicoCADesc = await servicoCapaAcabamento.findOne(
          { where: { id_servico: i } },
          { attributes: ['descricao'] },
        );

        const servicoCACount = await servico_pedido.count({
          where: {
            createdAt: {
              [Op.between]: [startedDate, endDate],
            },
            servicoCA: i,
          },
        });

        servicoCAObj[i] = {
          status: servicoCADesc.descricao,
          qtdade_solicitada: servicoCACount,
        };
      }

      // Continuando o Looping para trazer os meses antes de janeiro (1) -> dezembro (12)...
      if (i === 10 && mes < 4) {
        i = -2;
      }
      if (i === 11 && mes < 4) {
        i = -1;
      }
      if (i === 12 && mes < 4) {
        i = 0;
      }

      mesObj[i] = {
        ano,
        mes: meses[i - 1],
        pedidos,
        avaliacao_pedido: avaliacao_pedidoObj,
        servico_copiaTamanho: servicoCTObj,
        servico_capaAcabamento: servicoCAObj,
        num_paginas,
        num_copias: total_copias,
        folhas_impressas,
        centro_custos: centro_custosObj,
        curso: cursoObj,
        custo_total,
      };
    }
    return res.json(mesObj);
  },
};
