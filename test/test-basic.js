var test = require('tape')
var Seneca = require('seneca')
var startServer = require('./helpers/start-server.js')
var ping = require('./helpers/ping.js')
var calc = require('./helpers/calc.js')

test('load balancing with a single worker', function (t) {
  startServer(function () {
    ping(this)
    calc(this)
  }, { type: 'tcp', port: 9100 }, function () {
    var seneca = Seneca()
      .use(require('../'), {
        workers: [
          { type: 'tcp', port: 9100 }
        ]
      })
      .client({ type: 'loadbalance-transport' })
      .ready(function () {
        seneca.act('role:calc,cmd:add', { a: 1, b: 1 }, function (err, res) {
          if (err) return t.fail(err)
          t.equal(res.result, 2)
          t.end()
          process.exit()
        })
      })
  })
})
