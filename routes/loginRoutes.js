const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');

app.set("view engine", "pug"); 
app.set("views", "views"); 

app.use(bodyParser.urlencoded({extended: false}));

router.get("/", (req, res, next)=> { 
    res.status(200).render("login");
})

router.post("/", async (req, res, next)=> { 
    var payload = req.body;
    if(req.body.logUserName && req.body.logPassword){
        //check if there is a user with this username and email
        var user = await User.findOne({
            $or: [
                {username: req.body.logUserName},
                {email: req.body.logUserName}
            ]
        })
        .catch((err)=> {
            console.log(err);
            payload.errorMessage = "Uh, oh. Something went wrong.";
            res.status(200).render("login", payload); 
        });

        if(user != null){
            var result = await bcrypt.compare(req.body.logPassword, user.password);

            if(result === true){
                req.session.user = user;
                return res.redirect('/'); //login scenario
            }
        }
        else{
            payload.errorMessage = "Login credentials incorrect.";
            res.status(200).render("login", payload); 
        }
    }
    res.status(200).render("login");
})


module.exports = router;