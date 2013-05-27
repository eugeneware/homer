var expect = require('chai').expect
  , dns = require('native-dns')
  , server = require('../lib/server')
  , HomerClient = require('../lib/client')
  , endpoint = require('../lib/endpoint')
  , request = require('request')
  , path = require('path')
  , rimraf = require('rimraf');

var dbPath = path.join(__dirname, '..', 'data/homer.db');

describe('homer http service', function () {
  var port = 3000;
  var dnsPort = 15353;
  var client, server;

  beforeEach(function (done) {
    rimraf.sync(dbPath);
    server = endpoint.create();
    server.app.listen(port, 'localhost', function (err) {
      server.dnsServer.serve(dnsPort);
      client = new HomerClient('localhost', port);
      done();
    });
  });

  afterEach(function (done) {
    server.app.close(function () {
      server.dnsServer.close();
      done();
    });
  });

  it('should be able to register', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, done);
  });

  it('should be able to update', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, function (err, res) {
      if (err) return done(err);
      client.update(hostname, password, done);
    });
  });

  it('should be able to update with a set ip', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, function (err, res) {
      if (err) return done(err);
      client.update(hostname, password, '8.8.8.8', function (err) {
        if (err) return done(err);
        client.lookup(hostname, password, function (err, res) {
          if (err) return done(err);
          expect(res.ip).to.equal('8.8.8.8');
          done();
        });
      });
    });
  });

  it('should be able to deal with bad passwords', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, function (err, res) {
      if (err) return done(err);
      client.update(hostname, 'bad password', function (err, res) {
        expect(err.message).to.equal('Incorrect password');
        done();
      });
    });
  });

  it('should be able to lookup an ip address', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, function (err, res) {
      if (err) return done(err);
      client.update(hostname, password, function (err, res) {
        if (err) return done(err);
        client.lookup(hostname, password, function (err, res) {
          if (err) return done(err);
          expect(res.ip).to.equal('127.0.0.1');
          done();
        });
      });
    });
  });

  it('should be able to look up your own ip address', function (done) {
    client.ip(function (err, res) {
      if (err) return done(err);
      expect(res.ip).to.equal('127.0.0.1');
      done();
    });
  });
});

describe('homer dns server', function () {
  var port = 3000;
  var dnsPort = 15353;
  var dnsServer;

  beforeEach(function (done) {
    rimraf.sync(dbPath);
    server = endpoint.create();
    server.app.listen(port, 'localhost', function (err) {
      server.dnsServer.serve(dnsPort);
      client = new HomerClient('localhost', port);
      done();
    });
  });

  afterEach(function (done) {
    server.app.close(function () {
      server.dnsServer.close();
      done();
    });
  });

  function dnsRequest(name, type, server, port, cb) {
    var question = dns.Question({
      name: name,
      type: type,
    });

    var req = dns.Request({
      question: question,
      server: { address: server, port: port, type: 'udp' },
      timeout: 1000,
    });

    req.on('timeout', function () {
      cb(new Error('Timeout in making request'));
    });

    req.on('message', function (err, answer) {
      cb(null, answer);
    });

    req.send();
  }

  it('should be able to query a dns server', function (done) {
    dnsRequest('www.google.com', 'a', '8.8.8.8', 53,
      function (err, addresses) {
        if (err) return done(err);
        expect(addresses.answer.length).to.equal(5);
        addresses.answer.forEach(function (answer) {
          expect(answer.name).to.equal('www.google.com');
        });
        done();
      });
  });

  it('should be able to query my dns server', function (done) {
    var hostname = 'home.eugeneware.com';
    var password = 'hslim2';
    client.register(hostname, password, function (err, res) {
      if (err) return done(err);
      client.update(hostname, password, function (err) {
        if (err) return done(err);
        dnsRequest(hostname, 'a', '127.0.0.1', dnsPort,
          function (err, addresses) {
            if (err) return done(err);
            expect(addresses.answer.length).to.equal(1);
            addresses.answer.forEach(function (answer) {
              expect(answer.name).to.equal(hostname);
              expect(answer.ttl).to.equal(60);
            });
            done();
          });
      });
    });
  });
});
