#!/usr/bin/env node

var HLSServer = require('./index')
var http = require('http')
var argv = require('minimist')(process.argv.slice(2))
var cluster = require('cluster')
var numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  masterProcess()
} else {
  childProcess()
}

function masterProcess () {
  if (argv['v'] || argv['version']) {
    console.log(require('../package.json').version)
    process.exit(0)
  }

  function printHelp () {
    console.log('hlsserver - Quick and simple HLS video streaming server is.')
    console.log('')
    console.log('Usage:')
    console.log('  hlsserver --port <port> --dir <directory> --path <path>  Run an HLS server.')
    console.log('  hlsserver --version | -v                                 Show package version.')
    console.log('')
    process.exit(0)
  }

  if (argv['help']) {
    printHelp()
  }

  var port = argv['port'] || argv['p'] || 8000
  var dir = argv['dir'] || argv['d'] || ''
  var path = argv['path'] || argv['url'] || argv['u'] || '/'

  var workers = []
  for (let i = 0; i < numCPUs; i++) {
    var worker = cluster.fork()
    workers.push(worker)
    worker.send({
      port: '8080',
      dir: '/hls',
      path: '/streams'
    })
  }

  console.log('HLS server starting on port', port)
}

function childProcess () {
  process.on('message', (msg) => {
    var server = http.createServer()
    HLSServer(server, {
      path: msg.path,
      dir: msg.dir
    })

    var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
	  
	var server_port = process.env.IP || process.env.OPENSHIFT_NODEJS_PORT ||  process.env.OPENSHIFT_INTERNAL_PORT || process.env.PORT || 8080
	var server_ip_address = process.env.PORT || process.env.OPENSHIFT_NODEJS_IP || process.env.OPENSHIFT_INTERNAL_IP || '0.0.0.0'
	var server_dir = process.env.OPENSHIFT_DATA_DIRP || ''
 
	server.listen(port, ip, function () {
		console.log( "Listening on " + server_ip_address + ", port " + server_port )
		console.log( "DATA DIR FOR HLSSERVER is::" + server_dir)
	});
	
	
    //server.listen(msg.port)

    console.log(`Worker ${process.pid} running...`)
  })
}
