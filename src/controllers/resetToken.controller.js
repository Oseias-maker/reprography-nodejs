// Arquivos de config
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('../.config/auth.config.json');

// Services
const serviceUsuario = require('../services/usuario.service');
const serviceResetToken = require('../services/resetToken.service');

// Uitlizado para criptografar as senhas no banco de dados
// Usado para criar o token de reset aleatório

// Envio de e-mail
const template = require('../templates/emails');
const { mailer } = require('../utils');

module.exports = {
  // ROTAS POST

  forgotPasswordPost: async (req, res) => {
    // Assegure que você tem um usuário com esse email

    // const { mail } = req.body;
    const { mail } = req.body;

    const email = await serviceUsuario.findOneByEmail(mail);
    if (email == null) {
      /**
       * Nós não queremos avisar á atacantes
       * sobre emails que não existem, porque
       * dessa maneira, facilita achar os existentes.
       * */
      return res.json({ status: 'ok' });
    }
    /**
     * Expira todos os tokens que foram definidos
     * anteriormente para este usuário. Isso preveni
     * que tokens antigas sejam usadas.
     * */
    await serviceResetToken.updateByEmail(mail);

    // Cria um resete de token aleatório
    const token = crypto.randomBytes(64).toString('base64');

    // token expira depois de uma hora
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1 / 24);

    // Inserindo dados da token dentro do BD
    await serviceResetToken.addToken({
      param: {
        email: mail,
        expiration: expireDate,
        token,
        used: 0,
      },
    });

    res.json({ status: 'ok' });

    // Envio de e-mail de recuperação de senha
    const output = template.forgotPasswordEmail(token, mail);
    const title = 'Recuperação de Senha';
    await mailer.sendEmails(mail, title, output, { attachments: null });
  },

  // RESET PASSWORD

  resetPassword: async (req, res) => {
    const {
      email, token, senha, senha2,
    } = req.body;

    // comparar senhas
    if (senha !== senha2) {
      return res.json({
        status: 'error',
        message: 'Senha não encontrada. Por favor, tente novamente.',
      });
    }

    /**
     * Assegure que sua senha é válida (isValidPassword
     * function checa se sua senha tem >= 8 caracteres, alfanumerico,
     * caracter especial, etc)
     * */
    // if (!isValidPassword(req.body.password1)) {
    //   return res.json({ status: 'error', message: 'Senha não contêm os requerimentos minímos. Por favor, tente novamente.' });
    // }
    const record = await serviceResetToken.findOneByEmailandToken(email, token);
    // var record = await resettoken.findOne({
    //   where: {
    //     email: email,
    //     expiration: { [Op.gt]: Sequelize.fn('CURDATE') },
    //     token: token,
    //     used: 0
    //   }
    // });

    if (record == null) {
      return res.json({
        status: 'error',
        message:
          'Token não encontrado. Por favor, faça o processo de resetar a senha novamente.',
      });
    }

    await serviceResetToken.updateByEmail(email);

    const newPassword = await bcrypt.hash(senha, config.jwt.saltRounds);

    const usuario = await serviceUsuario.findOneByEmail(email);

    await serviceUsuario.updateUser({
      user: usuario,
      param: { senha: newPassword },
    });

    return res.json({
      status: 'ok',
      message:
        'Senha resetada. Por favor, tente efetuar o login com sua nova senha',
    });
  },
};
