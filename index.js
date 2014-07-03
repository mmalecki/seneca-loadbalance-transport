'use strict'

var async = require('async')
var nid = require('nid')
var Seneca = require('seneca')
var shuffleArray = require('shuffle-array')

var name = 'loadbalance-transport'

module.exports = function (opts, cb) {
  var seneca = this
  var transportUtils = seneca.export('transport/utils')
  var currentWorker = 0
  var workers = []

  async.each(opts.workers, addWorker)

  // Make a worker and put it in our `workers` object
  function makeWorker(worker) {
    return {
      seneca: Seneca().client(worker),
      id: worker.id,
      up: true
    }
  }

  // Lazily get/create the next seneca.
  function nextWorker(cb) {
    var worker = workers[currentWorker++]
    if (currentWorker >= workers.length) currentWorker = 0
    if (!worker.up) return nextWorker()
    return worker
  }

  // Add a new worker.
  function addWorker(worker, cb) {
    function ping() {
      madeWorker.seneca.act({ role: 'transport', cmd: 'ping' }, function (err) {
        worker.up = !(err && err.code === 'task-timeout')
      })
    }

    if (!worker.id) worker.id = nid()
    var madeWorker = makeWorker(worker)
    madeWorker.pingInterval = setInterval(ping, opts.pingInterval || 1000)
    workers.push(madeWorker)
    cb(null, madeWorker)
  }

  function listWorkers(cb) {
    cb(null, workers)
  }

  function removeWorker(id, cb) {
    for (var i = 0; i < workers.length; i++) {
      if (workers[i].id === id) {
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
      sendDone(null, function (args_, done) {
        var worker = nextWorker()
        var nextSeneca = worker.seneca
        nextSeneca.act(args_, function () {
          if (arguments[0] && arguments[0].code === 'task-timeout') {
            worker.up = false
            return done(arguments[0])
          }
          done.apply(this, arguments)
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
  seneca.add({ role: 'seneca', cmd: 'close' }, close)

  cb(null, { name: name })
}
