/* Copyright (c) 2012-2014 Richard Rodger, MIT License */
/* Copyright (c) 2014 Maciej Małecki, MIT License */
"use strict";
Error.stackTraceLimit = Infinity;


var http = require('http')

var express = require('express')
var argv    = require('optimist').argv


// create a seneca instance
var seneca  = require('seneca')({timeout:300})

// load configuration for plugins
// top level properties match plugin names
// copy template config.template.js to config.mine.js and customize
seneca.use('options','config.mine.js')


var conf = {
  port: argv.p || 3000
}

// use the user and auth plugins
// the user plugin gives you user account business logic
seneca.use('user')

// the auth plugin handles HTTP authentication
seneca.use('auth',{
  // redirects after login are needed for traditional multi-page web apps
  redirect:{
    login:{win:'/account',fail:'/login#failed'},
    register:{win:'/account',fail:'/#failed'},
  }
})

seneca.use(require('../../'), {
  workers: []
})

seneca.use(require('seneca-web'))

seneca.ready(function () {
  // use the express module in the normal way
  var app = express()
  app.enable('trust proxy')

  app.use(express.cookieParser())
  app.use(express.query())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.json())

  app.use(express.session({secret:'seneca'}))

  app.use(express.static(__dirname + '/public'))


  // add any middleware provided by seneca plugins
  app.use( seneca.export('web') )


  // some express views
  app.engine('ejs',require('ejs-locals'))
  app.set('views', __dirname + '/views')
  app.set('view engine','ejs')

  // Get workers from loadbalance transport and display them
  app.get('/list', function (req, res){
    seneca.act('role:loadbalance,cmd:list', function (err, args) {
      res.render('workers.ejs', { locals: { workers: args } })
    })
  })

  app.get('/add', function (req, res) {
    res.render('add.ejs')
  })

  app.post('/add', function (req, res) {
    seneca.act('role:loadbalance,cmd:add', req.body, function (err, args) {
      if (err) res.send(500, err)
      res.send(200)
    })
  })

  // create a HTTP server using the core Node API
  // this lets the admin plugin use web sockets
  var server = http.createServer(app)
  server.listen(conf.port)

  // visit http://localhost[:port]/admin to see the admin page
  // you'll need to logged in as an admin - user 'a1' above
  seneca.use('data-editor')
  seneca.use('admin',{server:server})

})
