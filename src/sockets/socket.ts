const { io } = require('../index');

// Mensajes de Sockets
io.on('connection', (socket: any) => {
  //console.log(socket);
  console.log("Nueva conexion");
 
  socket.on('set-name', (user:any) =>{
    socket.username = user.username;
    socket.id = user.id;
    console.log("El nuevo usuario es: " + socket.username + " con id: " + socket.id);
  })
  socket.on('disconnect', function(){
      console.log("Desconectado");
    io.emit('users-changed', {user: socket.username, event: 'left'});  
  });
  /*socket.on('set-name', (name: any) => {
    socket.username = name;
    io.emit('users-changed', {user: name, event: 'joined'});    
  });
  
  socket.on('send-message', (message: any) => {
    io.emit('message', {msg: message.text, user: socket.username, createdAt: new Date()});    
  });*/
});