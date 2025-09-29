const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.zamplisoft.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // remove /api prefix
      },
      onError: function (err, req, res) {
        console.log('Proxy error:', err);
      },
      onProxyReq: function (proxyReq, req, res) {
        console.log('Proxying request to:', proxyReq.path);
      }
    })
  );
};
