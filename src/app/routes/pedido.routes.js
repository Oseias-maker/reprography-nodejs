const { authJwt } = require("../middlewares");
const { upload } = require("../middlewares");
const { verifyService } = require("../middlewares");
const controller = require("../controllers/pedido.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "accessToken, Origin, Content-Type, Accept"
    );
    next();
  });

  ////USUARIO COMUM

  //POST

  //Insere um pedido, verificando se o usuário está logado e isnerindo um anexo.
  app.post("/request", [authJwt.validateToken], upload.single('file'), verifyService, controller.adicionar);


  //GET

  //Meus pedidos (pegar pedido pelo req.user.nif => nif do usuário logado, que será verificado
  // pelo token jwt)
  app.get("/myRequests/rated=:rated", [authJwt.validateToken], controller.meusPedidos);


  //PUT

  //rota para atualizar a avaliação
  app.put("/rating/:id", [authJwt.validateToken], controller.alterarAvaliacao);


  ////ADMIN

  //GET

  //Buscar todos os pedidos
  app.get("/requests/rated=:rated", [authJwt.validateToken, authJwt.isAdmin], controller.buscarTodos);

  //Buscar pedido por id do pedido
  app.get("/request/:id", [authJwt.validateToken, authJwt.isAdmin], controller.buscarPorIdPedido);

  //Buscar pedido por nif da tabela usuario (foreignKey)
  app.get("/request/nif/:nif/rated=:rated", [authJwt.validateToken, authJwt.isAdmin], controller.buscarPorNif);

  //Exibe o pedido pelo seu titlo
  app.get("/request/title/:pedido", [authJwt.validateToken, authJwt.isAdmin], controller.buscarPorNome);
};