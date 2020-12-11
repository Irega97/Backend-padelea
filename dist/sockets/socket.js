"use strict";
const { io } = require('../index');
// Mensajes de Sockets
io.on('connection', (socket) => {
    console.log(socket);
    console.log("Nueva conexion");
    socket.on('disconnect', function () {
        console.log("Desconectado");
        io.emit('users-changed', { user: socket.username, event: 'left' });
    });
    /*socket.on('set-name', (name: any) => {
      socket.username = name;
      io.emit('users-changed', {user: name, event: 'joined'});
    });
    
    socket.on('send-message', (message: any) => {
      io.emit('message', {msg: message.text, user: socket.username, createdAt: new Date()});
    });*/
});
