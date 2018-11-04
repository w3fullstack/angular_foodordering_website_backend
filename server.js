#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var fs = require('fs');
require('./apis/users');
require('./apis/category');
require('./apis/items');
require('./apis/menu');
require('./apis/restaurant');
require('./apis/force_exec_query');
require('./apis/mobileapis');
require('./apis/order');
require('./apis/file');
var UUID = require('node-uuid');
var io = require('socket.io');
const helmet = require('helmet');

const local_mode = false;

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
app.use(helmet());

/**
 * Create HTTP server.
 */
var http, server;

if (local_mode) {
  http = require('http');
  server = http.createServer(app);
  log('Working on LOCAL_MODE');
} else {
  var options = {
    key: fs.readFileSync('./cert/privkey1.pem'),
    cert: fs.readFileSync('./cert/cert1.pem'),
    ca: fs.readFileSync('./cert/chain1.pem'),
  };
  http = require('https');
  server = http.createServer(options, app);
  log('Working on PRODUCTION_MODE');
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  log('Listening on ' + bind);
}

function log(data) {
    console.log(data);
}


/** Socket.io integration */
var client_manager = require('./clients');
var sio = io.listen(server);

sio.sockets.on('connection', function (client) {
  // create userid
  client.user_id = UUID();
  client_manager.addClient(client);

  // emit onconnected
  client.emit('onconnected', {id: client.user_id});

  // message
  client.on('message', function(msg) {
    
  });
  // disconnect
  client.on('disconnect', function() {
    client_manager.disconnected(client);
  });
});