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
    console.log('make worker')
    return {
      seneca: Seneca().client(worker),
      id: worker.id,
      up: true
    }
  }

  // Lazily get/create the next seneca.
  function nextWorker(cb) {
    console.log('next worker')
    var worker = workers[currentWorker++]
    if (currentWorker >= workers.length) currentWorker = 0
    if (!worker.up) return nextWorker()
    return worker
  }

  // Add a new worker.
  function addWorker(worker, cb) {
    console.dir(arguments)
    console.log('add worker')
    if (!worker.id) worker.id = nid()
    workers.push(makeWorker(worker))
    cb(null, worker.id)
  }

  function listWorkers(cb) {
    cb(null, workers)
  }

  function removeWorker(id, cb) {
    for (var i = 0; i < workers.length; i++) {
      if (workers.id === id) {
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
        var nextSeneca = nextWorker().seneca
        nextSeneca.act(args_, function () {
          console.dir(arguments)
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
