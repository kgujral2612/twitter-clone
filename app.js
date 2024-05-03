const express = require('express');
const app = express();
const port = 3000;
const middleware = require('./middleware');
const path = require('path');

const server = app.listen(port, ()=>{
    console.log("Server listening on port " + port);
})

app.set("view engine", "pug"); //telling the server that we're using pug as the template engine
app.set("views", "views"); //all views will be in the views folder

//app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Routes
const loginRoute = require('./routes/loginRoutes');
const registerRoute = require('./routes/registerRoutes');

app.use("/login", loginRoute);
app.use("/register", registerRoute);

app.get("/", middleware.requireLogin, (req, res, next)=> { 
    var payload = {
        pageTitle : "Home"
    }
    res.status(200).render("home", payload);
})