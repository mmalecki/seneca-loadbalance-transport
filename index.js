'use strict'

var async = require('async')
var nid = require('nid')
var Seneca = require('seneca')
var shuffleArray = require('shuffle-array')

var name = 'loadbalance-transport'

// Check whether an error is a `task-timeout`.
function isTaskTimeout(err) {
  return err && err.code === 'task-timeout'
}

// Skip properties we don't need to share (like interval ID).
function serializeWorker(worker) {
  return {
    id: worker.id,
    up: worker.up,
    lastCallDuration: worker.lastCallDuration,
    meanCallDuration: worker.meanCallDuration
  }
}

module.exports = function (opts, cb) {
  var seneca = this
  var transportUtils = seneca.export('transport/utils')
  var lastWorker = null
  var workers = []

  async.each(opts.workers, addWorker)

  // Make a worker and put it in our `workers` object
  function makeWorker(worker) {
    return {
      seneca: Seneca().client(worker),
      id: worker.id,
      up: true,
      lastCallDuration: -1,
      meanCallDuration: -1
    }
  }

  // Get the next worker, round-robin style.
  // TODO: solve this with a pluggable solution
  function nextWorker(cb) {
    seneca.act('role:loadbalance,hook:balance', {
      workers: workers,
      lastWorker: lastWorker
    }, function (err, worker) {
      if (!worker) return cb(new Error('No up backend found'))
      lastWorker = worker
      cb(null, worker)
    })
  }

  function roundRobin(args, cb) {
    var currentWorker = workers.indexOf(args.lastWorker)
    currentWorker++
    if (currentWorker >= workers.length) currentWorker = 0
    var worker = workers[currentWorker]
    if (!worker.up) return roundRobin({ lastWorker: worker, workers: workers }, cb)
    cb(null, worker)
  }

  // Add a new worker.
  function addWorker(worker, cb) {
    function ping() {
      // A thing to keep in mind that right now it can take very long
      // (I think default is 22222 ms) for a request to time out, even
      // in scenarios like remote side breaking the connection and
      // ECONNREFUSED on reconnect.
      madeWorker.seneca.act({ role: 'transport', cmd: 'ping' }, function (err) {
        worker.up = !isTaskTimeout(err)
      })
    }

    if (!worker.id) worker.id = nid()
    var madeWorker = makeWorker(worker)
    madeWorker.pingInterval = setInterval(ping, opts.pingInterval || 1000)
    workers.push(madeWorker)
    cb(null, madeWorker)
  }

  function listWorkers(args, cb) {
    cb(null, workers.map(serializeWorker))
  }

  function removeWorker(args, cb) {
    for (var i = 0; i < workers.length; i++) {
      if (workers[i].id === args.id) {
        clearInterval(workers[i].pingInterval)
        workers.splice(i, 1)
        return cb()
      }
    }
    cb(new Error('No such worker'))
  }

  function close(cb) {
  }

  function clientHook(args, clientDone) {
    transportUtils.make_client(makeSend, args, clientDone)

    function makeSend(spec, topic, sendDone) {
      // `sendDone` gets a function which is used to send things over a
      // transport. In reality, it just calls different instances of `seneca`
      // we created, talking to different endpoints.
      sendDone(null, function (args_, done) {
        nextWorker(function (err, worker) {
          var nextSeneca = worker.seneca
          var startTime = Date.now()

          nextSeneca.act(args_, function (err_) {
            var callDuration = Date.now() - startTime

            // See remark above about timing of timeouts for `act` requests.
            if (isTaskTimeout(err_)) {
              worker.up = false
              return done(err_)
            }

            // Grab some stats about this call (everything is ms)
            worker.lastCallDuration = callDuration
            worker.meanCallDuration = worker.meanCallDuration === -1
              ? callDuration
              : (worker.meanCallDuration + callDuration) / 2

            done.apply(this, arguments)
          })
        })
      })
    }
  }

  seneca.add(
    { type: 'loadbalance-transport', role: 'transport', hook: 'client' },
    clientHook
  )

  seneca.add({ role: 'loadbalance', cmd: 'add' }, addWorker)
  seneca.add({ role: 'loadbalance', cmd: 'list' }, listWorkers)
  // Default load balacing hook is round robin.
  seneca.add({ role: 'loadbalance', hook: 'balance' }, roundRobin)
  seneca.add({ role: 'seneca', cmd: 'close' }, close)

  cb(null, { name: name })
}
