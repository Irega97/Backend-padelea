const { io } = require('../index');
import authController from '../controllers/auth.controller'
import chatController from '../controllers/chat.controller'

let sockets: any [] = [];
// Mensajes de Sockets
io.on('connection', (socket: any) => {

  socket.on('nuevoConectado', (user:any) =>{
    authController.setOnlineStatus(user.id, true);
    socket.username = user.username;
    socket._id = user.id;
    socket.join(user.id);
    console.log(user.username + " se ha conectado");
    let info = {
      "user": user.username,
      "estado": true 
    }
    
    chatController.getIdMyChats(user.id).then((data:any) =>{
      data.chats.forEach((chat:any) =>{
        socket.join(chat.chat._id);
      })
      io.emit("actConectado", info);
      sockets.push(socket);
    });
  });

  socket.on('mensajeLeido', (info:any) => {
    chatController.leerChat(info.chat, info.user).then(data => {
      if (data == 1)
        socket.to(info.chat).emit('mensajeLeido', info);
    })
  })

  socket.on('disconnect', function(){
    if (socket._id != undefined){
      let info = {
        "user": socket.username,
        "estado": false 
      }
      authController.setOnlineStatus(socket._id, false);
      io.emit('actConectado', info);
      console.log(socket.username + " se ha desconectado");
      let i = sockets.indexOf(socket);
      sockets.splice(i, 1);
      //console.log("Socket", socket);
    }
  });
});

function getSocket(){
  return io;
}

function getVectorSockets(){
  return sockets;
}

module.exports.getSocket = getSocket;
module.exports.getVectorSockets = getVectorSockets;