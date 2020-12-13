const { io } = require('../index');
import authController from '../controllers/auth.controller'

// Mensajes de Sockets
io.on('connection', (socket: any) => {
  console.log("Nueva conexion");
 
  socket.on('nuevoConectado', (user:any) =>{
    socket.username = user.username;
    socket.id = user.id;
    authController.setOnlineStatus(socket.id, true);
    console.log("El nuevo usuario es " + socket.username);
  })

  socket.on('disconnect', function(){
    authController.setOnlineStatus(socket.id, false);
    console.log("Desconectado el usuario " + socket.username);
    io.emit('usuarioDesconectado', {user: socket.username, event: 'left'});  
  });
  /*socket.on('set-name', (name: any) => {
    socket.username = name;
    io.emit('users-changed', {user: name, event: 'joined'});    
  });
  
  socket.on('send-message', (message: any) => {
    io.emit('message', {msg: message.text, user: socket.username, createdAt: new Date()});    
  });*/
});