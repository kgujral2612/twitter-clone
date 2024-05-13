var connected = false;

var socket = io("http://localhost:3000")
socket.emit("setup", userLoggedIn); //look for this event on the server side

socket.on("connected", () => connected = true );
socket.on("message received", (newMessage) => messageReceived(newMessage) );

