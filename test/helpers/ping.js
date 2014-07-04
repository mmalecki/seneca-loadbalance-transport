module.exports = function (seneca) {
  seneca.add({ role: 'transport', cmd: 'ping' }, function (args, cb) { cb() })
}
