module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    header: process.env.HEADER_KEY,
    saltRounds: 10,
  },
  adminAccount: {
    email: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
    defaultImage: 'uploads/user-img/default/usuario.png',
  },
};
