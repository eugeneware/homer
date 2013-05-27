function make() {
  var http = require('http')
    , app = http.createServer(handler)
    , director = require('director')
    , router = new director.http.Router()
    , ecstatic = require('ecstatic')({
      root: __dirname + '/public', autoIndex: true })
    , levelup = require('levelup')
    , byteup = require('byteup')()
    , dnsServer = require('./server')
    , path = require('path')
    , db = levelup(path.join(__dirname, '..', '/data/homer.db'),
      { keyEncoding: 'utf8', valueEncoding: 'json' });

  function handler(req, res) {
    req.chunks = [];
    req.on('data', function (chunk) {
      req.chunks.push(chunk.toString());
    });

    router.dispatch(req, res, function (err) {
      ecstatic(req, res);
    });
  }

  router.post('/register', function () {
    var self = this;
    this.res.setHeader('Content-Type', 'application/json');

    var body = this.req.body;
    if (!body.hostname && !body.password) {
      var response = { status: 'ERROR', message: 'Invalid arguments' };
      return this.res.end(JSON.stringify(response));
    };


    db.get(body.hostname, function (err, value) {
      var response;
      if (err && err.name !== 'NotFoundError') {
        response = { status: 'ERROR', message: err.message };
        return self.res.end(JSON.stringify(response));
      }

      if (value === undefined) {
        return db.put(body.hostname, { password: body.password }, function (err) {
          response = { status: 'OK' };
          self.res.end(JSON.stringify(response));
        });
      }

      response = { status: 'ERROR', message: 'DNS entry already registered' };
      self.res.end(JSON.stringify(response));
    });
  });

  return { app: app, dnsServer: dnsServer.create(db) };
}

module.exports = {
  create: make
};
