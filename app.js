var express = require('express'),
	app = express(),
	server = require('http').createServer(app),

	io = require('socket.io').listen(server);
	users = {}; //keep users names who are currently connected to chat
	// socket.io needs an 'http' server object

	// nickname key values will be sockets

server.listen(3000);	


app.use("/styles",express.static(__dirname + "/styles")); // you must first declare static directory for css
//crete a route now after setting up server

app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){ //everytime user connects they have their own socket
	socket.on('new user', function(data, callback){ // reveices event
		if (data in users)
		{
			callback(false);
		} // check to see if index is != -1 means nickname exists somewhere in array if happens send back false
		else
		{
			callback(true);
			socket.nickname = data; //have nickname as property of socket. it is cnvenient because it is stored in every single socket
			users[socket.nickname] = socket; //nickname as key
			updateNicknames();
		}
	});


	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback){
		var msg = data.trim(); //trims mesage to take care of white space in case user has too many spaces
		if(msg.substr(0,3) === '/w ') //dont forget the space
		{	msg = msg.substr(3); // only want message from 3 characters onwards
			var ind = msg.indexOf(' ');
			if(ind !== -1) 
			{
				var name = msg.substr(0, ind); //check for only whispering to people in chat room
				var msg = msg.substring(ind + 1); //for the character right after the space /w    to the end should be the message
				if(name in users)
				{ // if name is in the users object then it is a whisper
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
				console.log('whisper!!!!!!'); //if cients adds /w it will whisper
				}
				else
				{
					callback('Error: Enter a valid user.');
				}
			}
			else
			{
				callback('Error: Please enter a message for your whisper.'); // this is if user entered nothing after /w 
			}	
		}
		else
		{	
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname}); // this sends it to all of the users the .emit 
		}
	}); // 

	socket.on('disconnect', function(data){
		if(!socket.nickname) return; //case if person comes to page looks at form and just leaves. disconnects before picking one. socket.nickname not set
		delete users[socket.nickname];
		updateNicknames(); //
	});
}); //first thing that happens after a client logs on to nodejs
// this receives event on server side must have same name


console.log("Listening on port 3000");

//socket.on broadcasts to everyone even user who sent info