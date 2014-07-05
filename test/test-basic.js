var test = require('tape')
var Seneca = require('seneca')
var startServer = require('./helpers/start-server.js')
var ping = require('./helpers/ping.js')
var calc = require('./helpers/calc.js')
var testCalc = require('./helpers/test-calc.js')

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
        testCalc(seneca, t, function () {
          t.end()
          process.exit()
        })
      })
  })
})
