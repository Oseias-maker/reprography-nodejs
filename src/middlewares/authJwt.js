// Arquivo de configuração
const { verify } = require('jsonwebtoken');
const config = require('../.config/auth.config');
// Método que verifica o token enviado na requisição com o token e a palavra de segurança setada no back-end

// Service do usuário
const service = require('../services/usuario.service');

// Verifica se a requisição contém os valores setados no config.header e no config.secret
const validateToken = (req, res, next) => {
  const accessToken = req.header(config.jwt.header);

  if (!accessToken) {
    res.status(403).json({ error: 'Você não está logado!' });
    return;
  }
  try {
    const validToken = verify(accessToken, config.jwt.secret);
    req.user = validToken;
    if (validToken) {
      return next();
    }
  } catch (error) {
    res.json({ error });
  }
  //  ==>  //Aqui ele passa os dados do usuário, nif: ... , email: ...
  // Importante para usarmospor exemplo quando alguém realizar um pedido,
  // para sabermos quem foi que realizou aquele pedido.
};

isAdmin = (req, res, next) => {
  service.findUserbyPk(req.user.nif, { attributes: null }).then((user) => {
    service.getRoles(user).then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].descricao === 'admin') {
          if (next) {
            next();
            return;
          }

          // Exceção para detPedidos... Para podermos verificar se o usuário é admin após verificar se
          // o nif do pedido que ele está tentando acessar é igual ao dele (foi ele que requisitou)
          // se não for, verificamos se ele é admin, se for ele recebe a array do pedido que solicitou
          // se ele não for admin, recebe a mensagem abaixo "Você precisa ser Administrador...".

          return res.json(req.array);
        }
      }
      // res.redirect("/teste");
      return res.status(403).json({
        message: 'Você precisa ser Administrador para executar essa ação!',
      });
    });
  });
};

const authJwt = {
  validateToken,
  isAdmin,
};

module.exports = authJwt;
