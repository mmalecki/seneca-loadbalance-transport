'use strict'

var Seneca = require('seneca')

var name = 'loadbalance-transport'

function makeSeneca(worker) {
  return Seneca()
    .client(worker)
}

module.exports = function (seneca, opts, cb) {
  var senecas = opts.workers.map(makeSeneca)

  function getWorker() {
    var worker = senecas.shift()
    senecas.push(worker)
    return worker
  }

  function wrap(args, cb_) {
    var worker = getWorker();
    worker.act(args, function () {
      console.dir(arguments)
      cb_.apply(this, arguments)
    });
  }

  var store = {
    name: name,
    save: wrap,
    load: wrap,
    list: wrap,
    remove: wrap,
    close: wrap,
    native: function (cb_) {
      cb_(null, opts)
    }
  }

  seneca.store.init(seneca, opts, store, function (err, tag, description) {
    if (err) return cb(err)
    cb(null, { name: name, tag: tag })
  })
}
