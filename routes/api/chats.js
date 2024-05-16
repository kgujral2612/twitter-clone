const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const Chat = require('../../schemas/ChatSchema');
const User = require('../../schemas/UserSchema');
const Message = require('../../schemas/MessageSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.post("/", async (req, res, next) => {
    if(!req.body.users){
        console.log("Users param not sent with the request");
        return res.sendStatus(400);
    }

    var users = JSON.parse(req.body.users);
    if(users.length == 0){
        console.log("Users array is empty");
        return res.sendStatus(400);
    }

    //push ourselves on the array
    //followed by all the users inside the payload 
    users.push(req.session.user._id);

    var chatData  = {
        users: users,
        isGroupChat: true
    }

    Chat.create(chatData)
    .then(chat => res.status(200).send(chat))
    .catch(error => {
        console.log("Error!!! "+ error);
        res.status(400);
    })
})

router.get("/", async (req, res, next) => {
    Chat.find({users: {
        $elemMatch: { $eq: req.session.user._id }
    }})
    .populate("users")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async results => {
        if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true"){
            results = results.filter(r=> !r.latestMessage.readBy.includes(req.session.user._id))
        }

        results = await User.populate(results, {path : "latestMessage.sender"})
        res.status(200).send(results)
    })
    .catch(err => {
        console.log(err);
        res.status(400);
    }) 
})

router.get("/:chatId", async (req, res, next) => {
    Chat.findOne({_id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id }}})
    .populate("users")
    .then(results=> res.status(200).send(results))
    .catch(err => {
        console.log(err);
        res.status(400);
    }) 
})

router.put("/:chatId", async (req, res, next) => {
    Chat.findByIdAndUpdate(req.params.chatId, req.body)
    .then(results=> res.sendStatus(204))
    .catch(err => {
        console.log(err);
        res.status(400);
    }) 
})

router.get("/:chatId/messages", async (req, res, next) => {
    Message.find({chat: req.params.chatId})
    .populate("sender")
    .then(results=> res.status(200).send(results))
    .catch(err => {
        console.log(err);
        res.status(400);
    }) 
})

module.exports = router;