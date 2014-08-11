function navController($scope) {

    io.socket.post('/job',{},function(data){ 
        //console.log('Users:',data); 
    });
    io.socket.on('User', function(message){console.log('nav message',message)});
    io.socket.on('hello', function(data) {
      //console.log('hello',data);
    });
   
};