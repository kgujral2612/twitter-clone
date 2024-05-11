const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Chat = require('../../schemas/ChatSchema');
const User = require('../../schemas/UserSchema');
const Message = require('../../schemas/MessageSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (req, res, next) => {
    if(!req.body.content || !req.body.chatId){
        console.log("Invalid data passed into request");
        res.sendStatus(400);
    }

    var newMessage = {
        sender : req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    }

    Message.create(newMessage)
    .then(async message => {
        message = await message.populate("sender");
        message = await message.populate("chat");

        Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
        .catch(err => console.log(`Error: ${err}`))

        res.status(201).send(message);
    })
    .catch(err => {
        console.log(`Error: ${err}`);
        res.sendStatus(400);
    })
})


module.exports = router;