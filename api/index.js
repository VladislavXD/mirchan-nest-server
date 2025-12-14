const bootstrap = require('../dist/main').default;

let app;

module.exports = async (req, res) => {
  if (!app) {
    app = await bootstrap();
  }

  // Handle the request
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
};