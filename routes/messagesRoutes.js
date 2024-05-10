const express = require('express');
const router = express.Router();
const Chat = require('../schemas/ChatSchema');
const User = require('../schemas/UserSchema');

router.get("/", (req, res, next) => {
    res.status(200).render("inboxPage", {
        pageTitle: "Inbox",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
})

router.get("/new", (req, res, next) => {
    res.status(200).render("newMessage", {
        pageTitle: "New message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    });
})

router.get("/:chatId", async (req, res, next) => {
    var userId = req.session.user._id;
    var chatId = req.params.chatId;

    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }

    console.log(payload);
    var chat = await Chat.findOne({_id: chatId, users: { $elemMatch : { $eq: userId} }})
               .populate("users");
    
    console.log(chat);

    if(chat == null){
        //check if chat id is user id
        var userFound = await User.findById(chatId);

        if(userFound == null){
            //get chat using user id
        }
    }
    
    if(chat == null){
        payload.errorMessage = "Chat does not exist or you do not have permission to view it";
    }
    else{
        payload.chat = chat;
    }

    res.status(200).render("chatPage", payload);
})


module.exports = router;