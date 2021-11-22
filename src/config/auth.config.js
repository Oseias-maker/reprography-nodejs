module.exports = {
  defaultPassword: process.env.DEFAULT_PASSWORD,
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    header: process.env.HEADER_KEY,
    saltRounds: 10
  },
  adminAccount: {
    nif: process.env.ADMIN_NIF,
    email: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
    defaultImage: "src/uploads/user-img/default/usuario.png"
  }
}