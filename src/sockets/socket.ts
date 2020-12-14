const { io } = require('../index');
import authController from '../controllers/auth.controller'

 let chatId : String

// Mensajes de Sockets
io.on('connection', (socket: any) => {
 
  /*function sendNotificacion(id: String, notification: any){
    io.to(id).emit('newNotification', notification)
  }

  export default { sendNotificacion };*/

  socket.on('nuevoConectado', (user:any) =>{
    socket.username = user.username;
    socket.id = user.id;
    authController.setOnlineStatus(socket.id, true);
    socket.join(socket.id);
    console.log("El nuevo usuario es " + socket.username);
  });

  socket.on('disconnect', function(){
    authController.setOnlineStatus(socket.id, false);
    console.log("Desconectado el usuario " + socket.username);
    io.emit('usuarioDesconectado', {user: socket.username, event: 'left'});  
  });

  socket.on('nuevaSala', (chatid : any) =>{
    socket.join(chatid);
    chatId = chatid;
    console.log("Sala " + chatid + " creada");
  });
  /*socket.on('set-name', (name: any) => {
    socket.username = name;
    io.emit('users-changed', {user: name, event: 'joined'});    
  });*/
  
  socket.on('send-message', (message: any) => {
    socket.to(chatId).emit('message', {msg: message.text, user: socket.username, createdAt: new Date()});    
  });

});