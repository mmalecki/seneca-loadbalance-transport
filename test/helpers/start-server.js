var Seneca = require('seneca')

module.exports = function (plugin, listen, cb) {
  var server = Seneca()
    .use(plugin)
    .listen(listen)
    .ready(cb)
}
