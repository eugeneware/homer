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

  router.get('/ip', function () {
    var response = {
      status: 'OK',
      data: { ip: this.req.socket.address().address }
    };

    this.res.setHeader('Content-Type', 'application/json');
    this.res.end(JSON.stringify(response));
  });

  router.get('/lookup', function () {
    var response = { status: 'OK' };
    var self = this;
    this.res.setHeader('Content-Type', 'application/json');

    var body = this.req.body;
    if (!body.hostname && !body.password) {
      response = { status: 'ERROR', message: 'Invalid arguments' };
      return this.res.end(JSON.stringify(response));
    };

    db.get(body.hostname, function (err, value) {
      if (err) return self.res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
      if (value && value.password === body.password) {
        response.data = {
          ip: value.ip
        };
        self.res.end(JSON.stringify(response));
      } else {
        self.res.end(JSON.stringify({ status: 'ERROR', message: 'Incorrect password' }));
      }
    });
  });

  router.post('/update', function () {
    var response = { status: 'OK' };
    var self = this;
    this.res.setHeader('Content-Type', 'application/json');

    var body = this.req.body;
    if (!body.hostname && !body.password) {
      response = { status: 'ERROR', message: 'Invalid arguments' };
      return this.res.end(JSON.stringify(response));
    };

    db.get(body.hostname, function (err, value) {
      if (err) return self.res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
      if (value && value.password === body.password) {
        value.ip = self.req.socket.address().address;
        db.put(body.hostname, value, function (err) {
          if (err) self.res.end(JSON.stringify({ status: 'ERROR', message: err.message }));
          self.res.end(JSON.stringify(response));
        });
      } else {
        self.res.end(JSON.stringify({ status: 'ERROR', message: 'Incorrect password' }));
      }
    });
  });

  router.post('/register', function () {
    var response = { status: 'OK' };
    var self = this;
    this.res.setHeader('Content-Type', 'application/json');

    var body = this.req.body;
    if (!body.hostname && !body.password) {
      response = { status: 'ERROR', message: 'Invalid arguments' };
      return this.res.end(JSON.stringify(response));
    };

    db.get(body.hostname, function (err, value) {
      if (err && err.name !== 'NotFoundError') {
        response = { status: 'ERROR', message: err.message };
        return self.res.end(JSON.stringify(response));
      }

      if (value === undefined) {
        var ip = self.req.socket.address().address;
        return db.put(body.hostname, { ip: ip, password: body.password }, function (err) {
          if (err) response = { status: 'ERROR', message: err.message };
          self.res.end(JSON.stringify(response));
        });
      }

      response = { status: 'ERROR', message: 'DNS entry already registered' };
      self.res.end(JSON.stringify(response));
    });
  });

  app.on('close', function () {
    db && db.close();
    db = null;
  });

  return { app: app, dnsServer: dnsServer.create(db) };
}

module.exports = {
  create: make
};
