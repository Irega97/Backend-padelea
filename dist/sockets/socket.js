"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { io } = require('../index');
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
// Mensajes de Sockets
io.on('connection', (socket) => {
    socket.on('nuevoConectado', (user) => {
        auth_controller_1.default.setOnlineStatus(user.id, true);
        socket.username = user.username;
        socket._id = user.id;
        socket.join(user.id);
        console.log(user.username + " se ha conectado");
    });
    socket.on('nuevoUsuario', (user) => {
        socket.emit('nuevoUsuario', user);
    });
    socket.on('nuevaNotificacion', (data) => {
        const notification = {
            type: data.type,
            description: data.description,
            status: data.status,
            origen: data.origen,
            image: data.image
        };
        socket.in(data.destino).emit('nuevaNotificacion', notification);
    });
    socket.on('disconnect', function () {
        auth_controller_1.default.setOnlineStatus(socket._id, false);
        console.log(socket.username + " se ha desconectado");
        //io.emit('usuarioDesconectado', {user: socket.username, event: 'left'});  
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
