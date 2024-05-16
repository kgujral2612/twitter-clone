const express = require('express');
const app = express();
const port = 3000;
const middleware = require('./middleware')
const path = require('path')
const bodyParser = require("body-parser")
const mongoose = require("./database");
const session = require("express-session");

const server = app.listen(port, () => console.log("Server listening on port " + port));
const io = require("socket.io")(server, { pingTimeout: 60000, allowEIO3: true });

app.set("view engine", "pug"); //telling the server that we're using pug as the template engine
app.set("views", "views"); //all views will be in the views folder

app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    secret: "bbq chips",
    resave: true,
    saveUninitialized: false
}))

app.use(express.static(path.join(__dirname, "public"))); //app.use(express.static("public"));

// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');
const logoutRoute = require('./routes/logoutRoutes');
const postRoute = require('./routes/postRoutes');
const profileRoute = require('./routes/profileRoutes');
const uploadRoute = require('./routes/uploadRoutes');
const searchRoute = require('./routes/searchRoutes');
const messagesRoute = require('./routes/messagesRoutes');
const notificationsRoute = require('./routes/notificationRoutes');

// API Routes
const postsApiRoute = require('./routes/api/posts');
const usersApiRoute = require('./routes/api/users');
const chatsApiRoute = require('./routes/api/chats');
const messagesApiRoute = require('./routes/api/messages');
const notificationsApiRoute = require('./routes/api/notifications');

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", middleware.requireLogin, postRoute);
app.use("/profile", middleware.requireLogin, profileRoute);
app.use("/uploads", middleware.requireLogin, uploadRoute);
app.use("/search", middleware.requireLogin, searchRoute);
app.use("/messages", middleware.requireLogin, messagesRoute);
app.use("/notifications", middleware.requireLogin, notificationsRoute);

app.use("/api/posts", postsApiRoute);
app.use("/api/users", usersApiRoute);
app.use("/api/chats", chatsApiRoute);
app.use("/api/messages", messagesApiRoute);
app.use("/api/notifications", notificationsApiRoute);

//the payload is available only in pug templates
app.get("/", middleware.requireLogin, (req, res, next)=> { 
    var payload = {
        pageTitle : "Home",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    res.status(200).render("home", payload);
});

console.log("io connection... ");

io.on("connection", socket => {

    socket.on("setup", userData => {
        socket.join(userData._id); //joining a chat room with userid
        socket.emit("connected"); //look for this event on the client side // each client gets it
    })

    socket.on("join room", room => socket.join(room));
    socket.on("typing", room => socket.in(room).emit("typing")); //sent to everyone in the room
    socket.on("stop typing", room => socket.in(room).emit("stop typing")); // the user just stopped typing
    socket.on("new message", newMessage => {
        var chat = newMessage.chat;
        if(!chat.users){
            return console.log("chat.users is undefined")
        }
        chat.users.forEach(user=>{
            if(user._id == newMessage.sender._id)
                return;
            socket.in(user._id).emit("message received", newMessage);
        })
    }); // the user just stopped typing
    socket.on("notification received", room => socket.in(room).emit("notification received")); 
})