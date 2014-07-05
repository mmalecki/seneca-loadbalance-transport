var test = require('tape')
var Seneca = require('seneca')
var async = require('async')
var startServer = require('./helpers/start-server.js')
var ping = require('./helpers/ping.js')
var calc = require('./helpers/calc.js')
var randomNumber = require('./helpers/random-number.js')
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
        })
      })
  })
})

test('load balancing with two workers', function (t) {
  // The way this test recognizes different workers is by implementing an
  // action replying with a random number generated during the setup,
  // which remains static for the lifetime of the seneca object.
  function plugin() {
    ping(this)
    calc(this)
    randomNumber(this)
  }

  async.parallel([
    async.apply(startServer, plugin, { type: 'tcp', port: 9200 }),
    async.apply(startServer, plugin, { type: 'tcp', port: 9201 })
  ], function () {
    var seneca = Seneca()
      .use(require('../'), {
        workers: [
          { type: 'tcp', port: 9200 },
          { type: 'tcp', port: 9201 }
        ]
      })
      .client({ type: 'loadbalance-transport' })
      .ready(function () {
        async.parallel([
          seneca.act.bind(seneca, 'role:random,cmd:get'),
          function (next) {
            // Something on the path from `act` call to worker number
            // increasing is asynchronous, and doesn't finish before
            // `setImmediate`, so set a 100 ms timeout before sending next
            // message. (XXX)
            setTimeout(function () {
              seneca.act('role:random,cmd:get', next)
            }, 100)
          }
        ], function (err, results) {
          if (err) return t.fail(err)
          t.notEqual(results[0].r, results[1].r)
          t.end()
          process.exit()
        })
      })
  })
})
