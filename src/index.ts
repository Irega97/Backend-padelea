//FICHERO EJECUCIÓN DEL PROYECTO
import app from './app'; //app exportada en app.ts
//Ejecutamos la conexion a la BBDD antes de escuchar al server
import './database';

const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('config/key.pem'),
    cert: fs.readFileSync('config/cert.pem')
};

const server = https.createServer(options, app).listen(app.get('port')); //Recuperamos puerto de app.ts

//const server = require('http').createServer(app);
module.exports.io = require('socket.io')(server);
require('./sockets/socket');

console.log('Server in port', app.get('port'));