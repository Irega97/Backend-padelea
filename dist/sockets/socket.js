"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { io } = require('../index');
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
// Mensajes de Sockets
io.on('connection', (socket) => {
    console.log("conectado");
    socket.on('nuevoConectado', (user) => {
        auth_controller_1.default.setOnlineStatus(user.id, true);
        socket.username = user.username;
        socket.id = user.id;
        socket.join(user.id);
        console.log("El nuevo usuario es " + user.username);
    });
    socket.on('nuevaNotificacion', (notification) => {
        io.in(notification.destino).emit('nuevaNotificacion', notification);
    });
    socket.on('disconnect', function () {
        auth_controller_1.default.setOnlineStatus(socket.id, false);
        console.log(socket);
        console.log("Desconectado el usuario " + socket.username);
        io.emit('usuarioDesconectado', { user: socket.username, event: 'left' });
    });
    socket.on('nuevaSala', (chatid) => {
        socket.join(chatid);
        //chatId = chatid;
        console.log("Sala " + chatid + " creada");
    });
    /*socket.on('set-name', (name: any) => {
      socket.username = name;
      io.emit('users-changed', {user: name, event: 'joined'});
    });*/
    /*socket.on('send-message', (message: any) => {
      socket.to(chatId).emit('message', {msg: message.text, user: socket.username, createdAt: new Date()});
    });*/
});
