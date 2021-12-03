module.exports = {
  hotmail: {
    secureConnection: false,
    service: process.env.MAILER_SERVICE,
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  },
  reproEmail: process.env.MAILER_COMPANY_EMAIL,
  hostPort: process.env.MAILER_HOST_PORT, //HOST E PORTA QUE SERÁ ENVIADO NO EMAIL DE RECUPERAÇÃO (host e porta do front-end - OBS: sem a barra / no final.)
};
