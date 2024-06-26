const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Chat = require('../../schemas/ChatSchema');
const User = require('../../schemas/UserSchema');
const Message = require('../../schemas/MessageSchema');
const Notification = require('../../schemas/NotificationSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (req, res, next) => {
    if(!req.body.content || !req.body.chatId){
        console.log("Invalid data passed into request");
        res.sendStatus(400);
    }

    var newMessage = {
        sender : req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId,
        readBy: [req.session.user._id]
    }

    Message.create(newMessage)
    .then(async message => {
        message = await message.populate("sender");
        message = await message.populate("chat");
        message = await User.populate(message, {path: "chat.users"});

        var chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
        .catch(err => console.log(`Error: ${err}`))

        insertNotifications(chat, message);

        res.status(201).send(message);
    })
    .catch(err => {
        console.log(`Error: ${err}`);
        res.sendStatus(400);
    })
})

function insertNotifications(chat, message){
    chat.users.forEach((userId)=> {
        if(userId == message.sender._id.toString()){
            // don't send a notification to ourself
            return;
        }
        Notification.insertNotification(userId, message.sender._id, "newMessage", message.chat._id);
    })
}

module.exports = router;