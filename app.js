const express = require('express');
const app = express();
const port = 3000;

const server = app.listen(port, ()=>{
    console.log("Server listening on port " + port);
})

app.set("view engine", "pug"); //telling the server that we're using pug as the template engine
app.set("views", "views"); //all views will be in the views folder

app.get("/", (req, res, next)=> { 

    var payload = {
        pageTitle : "Home"
    }

    res.status(200).render("home", payload);
})