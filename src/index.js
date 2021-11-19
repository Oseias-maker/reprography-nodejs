const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3002;

const cors = require('cors');

// var corsOptions = {
//   origin: "http://localhost:3000"
// };
// app.use(cors(corsOptions));

app.use(cors());
app.use(express.json());

// parse requests of content-type - application/json
app.use(bodyParser.json());

// Usando rota de Uploads para renderizar as imagens que estão em /uploads no diretório da API
app.use('/uploads', express.static('uploads'));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Models
const db = require('./models');

// Função para inserir os registros fixos de alguams tabelas (como tipo_usuario, tipo_copia, etc...)
const { inserirRegistros } = require('./utils');

// Routers

// Usuario router
require('./routes/usuario.routes')(app);
// Pedido router
require('./routes/pedido.routes')(app);
// Deatlhes do Pedido router
require('./routes/detPedido.routes')(app);
// ResetToken Router
require('./routes/resetToken.routes')(app);
// Servico Router
require('./routes/servico.routes')(app);
// Estatisticas Router
require('./routes/estatisticas.routes')(app);
// Swagger Routes
require('./routes/swagger.routes')(app);

// Imports para as informações que vamos trazer no console (consumo de ram, uso de cpu...)
const os = require('os');
const utils = require('os-utils');
const process = require('process');
const diskspace = require('diskspace');

// Sincronizando o sequelize com o banco de dados (utilizar o { force: true } somente em desenvolvimento,
// para conseguir limpar o banco e testar com novos registros.)
db.sequelize.sync({ force: false }).then(() => {
  app.listen(port, async () => {
    await inserirRegistros.InserirRegistros();
    await inserirRegistros.InserirUsuario();
    await console.log(
      `\n(||||||||| | | -------- Server running on port ${port} -------- | | |||||||||)`,
    );

    // Informações sobre a CPU, ARQUITETURA, TOTAL DE MEMÓRIA RAM DISPONÍVEL NO SISTEMA E SEU USO.
    console.log('\nCPUS: ', os.cpus());
    console.log(`\nArquitetura do processador: ${process.arch}`);
    console.log(`Plataforma que a API está rodando: ${process.platform}`);
    console.log(`\nTotal de memória ram: ${os.totalmem()} B`);
    console.log(
      `Uso Atual de memória ram: ${Math.round(os.totalmem - os.freemem())} B`,
    );
    console.log(`Memória ram livre: ${Math.round(os.freemem())} B`);

    // Listando disco tanto do windows quanto do linux
    if (process.platform == 'linux') {
      var disc = '/';
    } else {
      var disc = 'C*';
    }

    // Verificando disco (espaço total... livre e status)
    diskspace.check(disc, (err, result) => {
      console.log(`\nTamanho total do disco: ${result.total} B`);
      console.log(`Espaço do disco utilizado: ${result.used} B`);
      console.log(`Espaço livre do disco: ${result.free} B`);
      console.log(`Status do disco: ${result.status}\n`);
    });

    // Verificando uso de CPU e uso de Memória
    utils.cpuUsage((v) => {
      function timeout() {
        setTimeout(() => {
          while (0 === 0) {
            console.log('\n--------------------------------------------');
            console.log(
              '\nInformações que serão atualizadas em 60 segundos:\n',
            );
            console.log(`CPU Usage (%): ${v * 100}%`);
            console.log(
              `Uso de memória ram: ${Math.round(os.totalmem - os.freemem())} B`,
            );
            console.log(`Memória Livre: ${os.freemem()} B \n`);
            console.log('--------------------------------------------');
            break;
          }
          timeout();
        }, 60000);
      }
      timeout();
    });
  });
});
