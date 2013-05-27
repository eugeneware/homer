var expect = require('chai').expect
  , dns = require('native-dns')
  , server = require('../lib/server');

describe('homer', function () {
  var port = 15353;
  var dnsServer;

  beforeEach(function (done) {
    dnsServer = server.create();
    dnsServer.serve(port);
    done();
  });

  afterEach(function (done) {
    dnsServer.close();
    done();
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
    dnsRequest('www.google.com', 'a', '127.0.0.1', port,
      function (err, addresses) {
        if (err) return done(err);
        expect(addresses.answer.length).to.equal(2);
        addresses.answer.forEach(function (answer) {
          expect(answer.name).to.equal('www.google.com');
        });
        done();
      });
  });
});
