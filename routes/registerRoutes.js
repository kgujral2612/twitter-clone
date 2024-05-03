const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require('../schemas/UserSchema');
const bcrypt = require('bcrypt');

app.set("view engine", "pug"); 
app.set("views", "views"); 

app.use(bodyParser.urlencoded({extended: false})); //only strings and arrays can come through -- don't really need this setting

router.get("/", (req, res, next)=> { 
    res.status(200).render("register"); //renders register.pug
})

router.post("/", async (req, res, next)=> { //form submission
    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var username = req.body.username.trim();
    var email = req.body.email.trim();
    var password = req.body.password;

    var payload = req.body;

    if(firstName && lastName && username && email && password){
        //check if this user doesn't already exist
        var user = await User.findOne({
            $or: [
                {username: username},
                {email: email}
            ]
        })
        .catch((err)=> {
            console.log(err);
            payload.errorMessage = "Uh, oh. Something went wrong.";
            res.status(200).render("register", payload); //renders register.pug
        });

        if(user == null){
            //no user found
            //insert user
            var data = req.body;

            data.password = await bcrypt.hash(password, 10);
            
            User.create(data)
            .then((user)=> {
                req.session.user = user;
                return res.redirect('/');
            })
        }
        else{
            //user found
            if(email == user.email){
                payload.errorMessage = "Email already in use.";
            }
            else{
                payload.errorMessage = "Username already in use.";
            }
            res.status(200).render("register", payload); 
        }
    }
    else{
        payload.errorMessage = "Make sure each field has a valid value";
        res.status(200).render("register", payload); //renders register.pug
    }
})

module.exports = router;
