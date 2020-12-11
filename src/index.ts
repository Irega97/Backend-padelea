//FICHERO EJECUCIÓN DEL PROYECTO
import app from './app'; //app exportada en app.ts
//Ejecutamos la conexion a la BBDD antes de escuchar al server
import './database';

const server = require('http').createServer(app);
module.exports.io = require('socket.io')(server);
require('./sockets/socket');

server.listen(app.get('port')); //Recuperamos puerto de app.ts
console.log('Server in port', app.get('port'));