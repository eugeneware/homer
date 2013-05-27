var dns = require('native-dns');

module.exports = {
  create: makeServer
};

function makeServer() {
  var server = dns.createServer();

  server.on('request', function (request, response) {
    response.answer.push(dns.A({
      name: request.question[0].name,
      address: '127.0.0.1',
      ttl: 600,
    }));
    response.answer.push(dns.A({
      name: request.question[0].name,
      address: '127.0.0.2',
      ttl: 600,
    }));
    response.additional.push(dns.A({
      name: 'hostA.example.org',
      address: '127.0.0.3',
      ttl: 600,
    }));
    response.send();
  });

  server.on('error', function (err, buff, req, res) {
    console.log(err.stack);
  });

  return server;
}
