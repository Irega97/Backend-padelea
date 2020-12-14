"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { io } = require('../index');
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
let chatId;
// Mensajes de Sockets
io.on('connection', (socket) => {
    /*function sendNotificacion(id: String, notification: any){
      io.to(id).emit('newNotification', notification)
    }
  
    export default { sendNotificacion };*/
    socket.on('nuevoConectado', (user) => {
        socket.username = user.username;
        socket.id = user.id;
        auth_controller_1.default.setOnlineStatus(socket.id, true);
        socket.join(socket.id);
        console.log("El nuevo usuario es " + socket.username);
    });
    socket.on('disconnect', function () {
        auth_controller_1.default.setOnlineStatus(socket.id, false);
        console.log("Desconectado el usuario " + socket.username);
        io.emit('usuarioDesconectado', { user: socket.username, event: 'left' });
    });
    socket.on('nuevaSala', (chatid) => {
        socket.join(chatid);
        chatId = chatid;
        console.log("Sala " + chatid + " creada");
    });
    /*socket.on('set-name', (name: any) => {
      socket.username = name;
      io.emit('users-changed', {user: name, event: 'joined'});
    });*/
    socket.on('send-message', (message) => {
        socket.to(chatId).emit('message', { msg: message.text, user: socket.username, createdAt: new Date() });
    });
});
