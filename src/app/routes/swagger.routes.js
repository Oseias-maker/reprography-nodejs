const swaggerUi = require('swagger-ui-express');
const swaggerDocsV1 = require('../../info_api/docs/swagger/v1/swaggerV1.config.json');
const swaggerDocsV2 = require('../../info_api/docs/swagger/v2/swaggerV2.config.json');
const swaggerDocsV3 = require('../../info_api/docs/swagger/v3/swaggerV3.config.json');

module.exports = function (app) {
  // Swagger Routes

  // //Versão 1
  app.use('/v1/docs', swaggerUi.serve, (...args) =>
    swaggerUi.setup(swaggerDocsV1)(...args)
  );

  // //Versão 2
  app.use('/v2/docs', swaggerUi.serve, (...args) =>
    swaggerUi.setup(swaggerDocsV2)(...args)
  );

  // //Versão 3 (principal)
  app.use('/docs', swaggerUi.serve, (...args) =>
    swaggerUi.setup(swaggerDocsV3)(...args)
  );
};
