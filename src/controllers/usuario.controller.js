// Arquivo de config
const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');
const { unlink } = require('fs');
const config = require('../.config/auth.config.json');

// Services

// Service do usuário
const service = require('../services/usuario.service');
// Enviando descrição de constraints para o front-end/email
const verifyConstraints = require('../services/verifyConstraints');

// Usado para criptografar as senhas no banco -> Nesse caso para comparar a senha
// quando o usuário solicitar mudança de senha.

// Usado para enviar o token e informações do usuário pro front quando ele Logar

// Funções do usuário
module.exports = {
  // Usuários

  logar: async (req, res) => {
    const { emailOrNif, senha } = req.body;

    if (!emailOrNif || !senha) {
      return res
        .status(400)
        .send('Requisição faltando campos de email ou senha!');
    }

    let user = await service.findOneByEmail(emailOrNif);

    // Login com usuário ou NIF
    if (user == null) {
      user = await service.findUserbyPk(emailOrNif, { attributes: null });
      if (!user) {
        return res.json({
          status: 'error',
          message: 'E-mail/NIF ou Senha Inválidos!',
        });
      }
      if (user.ativado === 0 && user.primeiro_acesso === 0) {
        return res.json({
          status: 'error',
          message: 'Sua conta está desativada, contate um administrador!',
        });
      }
    } else {
      if (user.ativado === 0 && user.primeiro_acesso === 1) {
        return res.json({
          status: 'error',
          message: 'Primeiro acesso requer NIF ao invés do e-mail.',
        });
      }

      if (user.ativado === 0) {
        return res.json({
          status: 'error',
          message: 'Sua conta está desativada, contate um administrador!',
        });
      }
    }

    await bcrypt
      .compare(senha, user.senha)
      .then((match) => {
        if (!match) {
          return res.json({
            accessToken: null,
            status: 'error',
            message: 'E-mail/NIF ou Senha Inválidos!',
          });
        }

        const authorities = [];
        service.getRoles(user).then((roles) => {
          for (let i = 0; i < roles.length; i++) {
            authorities.push(
              `${roles[i].id}_ROLE_${roles[i].descricao.toUpperCase()}`,
            );
          }

          const token = sign(
            {
              nif: user.nif,
              nome: user.nome,
              email: user.email,
              imagem: user.imagem,
              roles: authorities,
            },
            config.jwt.secret,
            {
              expiresIn: 86400, // 24 hours
            },
          );

          return res.status(200).json({
            nif: user.nif,
            nome: user.nome,
            email: user.email,
            imagem: user.imagem,
            roles: authorities,
            accessToken: token,
            primeiro_acesso: user.primeiro_acesso,
          });
        });
      })
      .catch((err) => {
        res.status(500).json({ status: 'error', message: err.message });
      });
  },

  informacoesBasicas: async (req, res) => {
    const user = await service.findUserbyPk(req.user.nif, {
      attributes: { exclude: ['senha'] },
    });

    const depto = await verifyConstraints({
      departamento: user.dataValues.depto,
    });

    user.dataValues.depto = depto[0].descricao;

    return res.status(200).json(user);
  },

  primeiroAcesso: async (req, res) => {
    const { senha, confirmSenha } = req.body;

    if (senha !== confirmSenha) {
      return res.json({
        status: 'error',
        message: 'Os campos Nova senha e Confirmar senha não coincidem.',
      });
    }

    const user = await service.findUserbyPk(req.user.nif, { attributes: null });

    if (user.primeiro_acesso == 0) {
      return res.json({
        status: 'error',
        message: 'Esse não é seu primeiro acesso!',
      });
    }

    await bcrypt.hash(
      confirmSenha,
      config.jwt.saltRounds,
      async (err, hash) => {
        if (err) throw err;
        await service.updateUser({
          user,
          param: { senha: hash, primeiro_acesso: 0, ativado: 1 },
        });

        return res.json({
          status: 'ok',
          message: 'Senha atualizada com sucesso!',
        });
      },
    );
  },

  // Altera
  alterarMeuUsuario: async (req, res) => {
    const user = await service.findUserbyPk(req.user.nif, { attributes: null });

    let {
      nome, telefone, email, image,
    } = req.body;

    if (req.file) {
      if (user.imagem !== config.adminAccount.defaultImage) {
        await unlink(user.imagem, (err) => {
          if (err) throw err;
          console.log(`successfully deleted ${user.imagem}`);
        });
      }
      image = req.file.path;
    }

    await service.updateUser({
      user,
      param: {
        nome,
        telefone,
        email,
        imagem: image,
      },
    });

    return res.json({
      status: 'ok',
      message: 'Sua conta foi atualizada com sucesso!!',
    });
  },

  alterarSenha: async (req, res) => {
    const { senhaAntiga, senhaNova, confirmSenhaNova } = req.body;

    if (senhaNova !== confirmSenhaNova) {
      return res.json({
        status: 'error',
        message: 'Os campos Nova senha e Confirmar senha não coincidem.',
      });
    }

    await service
      .findUserbyPk(req.user.nif, { attributes: null })
      .then((user) => {
        bcrypt.compare(senhaAntiga, user.senha).then((match) => {
          if (!match) {
            return res.json({
              status: 'error',
              message: 'A senha inserida no campo Senha antiga está incorreta.',
            });
          }

          bcrypt.hash(senhaNova, config.jwt.saltRounds, (err, hash) => {
            if (err) throw err;
            service.updateUser(user, { senha: hash });
            return res
              .status(200)
              .json({
                status: 'ok',
                message: 'Sua senha foi atualizada com sucesso!',
              });
          });
        });
      });
  },

  // Usuário pode excluir a própria conta (exclui pelo nif do usuário logado)
  desativarMeuUsuario: async (req, res) => {
    const user = await service.findUserbyPk(req.user.nif, { attributes: null });

    if (user == null) {
      return res
        .status(404)
        .json({
          status: 'error',
          message: 'Não há nenhum usuário (ativado) com esse NIF',
        });
    }

    await service.updateUser({ user, param: { ativado: 0 } });

    return res.json({
      status: 'ok',
      message: 'Sua conta foi desativada com sucesso!',
    });
  },

  // Gerentes --- (ADMIN)

  // Registrar usuário
  adicionarUsuario: (req, res) => {
    let {
      nif, nome, telefone, depto, email, cfp, admin,
    } = req.body;

    // Imagem padrão caso não seja inserida nenhuma imagem.
    let image = config.adminAccount.defaultImage;

    // Senha padrão
    const senha = 'senai115';

    if (req.file) {
      image = req.file.path;
    }

    // Regra de negócio para Controle de Usuário -> Se Input de Roles for 1 (usuário for ADM)
    // Ele faz a busca de admin na tabela roles, e registra o id de Admin no usuário a ser criado
    // na tabela user_roles
    if (admin == 1) {
      admin = ['admin'];
    } else {
      admin = ['user'];
    }

    bcrypt.hash(senha, config.jwt.saltRounds, (err, hash) => {
      if (err) throw err;
      service
        .addUser({
          param: {
            nif,
            senha: hash,
            nome,
            telefone,
            depto,
            email,
            cfp,
            imagem: image,
          },
        })
        .then((user) => {
          if (admin) {
            service.getDescRoles(admin).then((roles) => {
              service.setRoles(user, roles);
            });
          } else {
            service.setRoles([1]);
          }
          return res
            .status(200)
            .json({
              status: 'ok',
              message: `Usuário com nif ${user.nif} criado com sucesso!`,
            });
        })
        .catch((err) => {
          res.status(500).json({ message: err.message });
        });
    });
  },

  buscarTodos: async (req, res) => {
    const { enabled } = req.params;

    const users = await service.findAllUsers(enabled);

    if (users.length < 1) {
      return res.json({ status: 'error', message: 'Sem registros...' });
    }

    for (let i = 0; i < users.length; i++) {
      const depto = await verifyConstraints({
        departamento: users[i].dataValues.depto,
      });

      users[i].dataValues.depto = depto[0].descricao;
    }

    return res.json(users);
  },

  buscarPorNome: async (req, res) => {
    // const query = `%${req.query.search}`;
    const users = await service.findAllByName(req.params.user);

    if (users.length < 1) {
      return res.json({
        status: 'error',
        message: `Usuários com nome ${req.params.user} não encontrados`,
      });
    }

    for (let i = 0; i < users.length; i++) {
      const depto = await verifyConstraints({
        departamento: users[i].dataValues.depto,
      });

      users[i].dataValues.depto = depto[0].descricao;
    }

    return res.json(users);
  },

  buscarPorNif: async (req, res) => {
    const user = await service.findUserbyPk(req.params.nif, {
      attributes: { exclude: ['senha'] },
    });

    if (user == null) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Usuário não encontrado!' });
    }

    const depto = await verifyConstraints({
      departamento: user.dataValues.depto,
    });

    user.dataValues.depto = depto[0].descricao;

    return res.json(user);
  },

  alterarPorNif: async (req, res) => {
    const user = await service.findUserbyPk(req.params.nif, {
      attributes: null,
    });

    if (user == null) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Usuário não encontrado!' });
    }

    let {
      nome, senha, telefone, depto, email, cfp, admin,
    } = req.body;

    if (admin) {
      if (admin == 1) {
        admin = ['admin'];
      } else {
        admin = ['user'];
      }

      const roles = await service.getDescRoles(admin);
      await service.setRoles(user, roles);
    }

    if (req.file) {
      if (user.imagem !== config.adminAccount.defaultImage) {
        await unlink(user.imagem, (err) => {
          if (err) throw err;
          console.log(`successfully deleted ${user.imagem}`);
        });
      }
      var image = req.file.path;
    }

    bcrypt.hash(senha, config.jwt.saltRounds, async (err, hash) => {
      if (err) throw err;
      await service.updateUser({
        user,
        param: {
          nome,
          senha: hash,
          telefone,
          depto,
          email,
          cfp,
          imagem: image,
        },
      });

      return res
        .status(200)
        .json({
          status: 'ok',
          message: `Conta com NIF ${req.params.nif} atualizada com sucesso!!`,
        });
    });
  },

  enableOrDisableAccount: async (req, res) => {
    const { nif, enable } = req.params;

    const user = await service.findUserbyPk(nif, { attributes: null });

    if (user == null) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Usuário não encontrado!' });
    }

    await service.updateUser({ user, param: { ativado: enable } });

    return res.json({
      status: 'ok',
      message: `Status do Usuário ${user.nif} atualizado com sucesso!`,
    });
  },

  // excluirPorNif: async (req, res) => {
  //     const user = await service.findUserbyPk(req.params.nif, { attributes: null });

  //     if (user == null) {
  //         return res.status(404).json({ status: 'error', message: "Usuário não encontrado!" });
  //     }
  //     await service.destroyUser(user);

  //     if (user.imagem !== config.adminAccount.defaultImage) {
  //         await unlink(user.imagem, (err) => {
  //             if (err) throw err;
  //             console.log(`successfully deleted ${user.imagem}`);
  //         });
  //     }

  //     return res.status(200).json({ status: 'ok', message: `Conta com NIF ${user.nif} excluida com sucesso!!` });
  // }
};
