const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Notification = require('../../schemas/NotificationSchema');
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (req, res, next) => {

    var searchObject = req.query;
    
    if(searchObject.isReply !== undefined){
        searchObject.replyTo = { $exists: searchObject.isReply };
        delete searchObject.isReply;
    }
    
    if(searchObject.followedUsers !== undefined){
        var userList = []
        searchObject.followedUsers.forEach(user => {
            userList.push(new mongoose.Types.ObjectId(user))
        });
        searchObject.postedBy = { $in: userList};
        delete searchObject.followedUsers;
    }

    if(searchObject.search !== undefined){
        searchObject = {
            $or: [
                { content: { $regex: searchObject.search, $options: "i" }}
            ]
        }
        delete searchObject.search;
    }

    var results = await getPosts(searchObject);
    res.status(200).send(results);
})


router.get("/:id", async (req, res, next) => {
    var postId = req.params.id;
    
    var postData = await getPosts({_id: postId});
    postData = postData[0];

    results = {
        postData: postData
    }

    if(postData.replyTo !== undefined){
        results.replyTo = postData.replyTo;
    }

    results.replies = await getPosts({ replyTo: postId});

    res.status(200).send(results);
})

router.post("/", async (req, res, next) => {

    if (!req.body.content) {
        console.log("Content param not sent with request");
        return res.sendStatus(400);
    }

    var postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo = req.body.replyTo;
    }

    Post.create(postData)
    .then(async newPost => {
        newPost = await User.populate(newPost, { path: "postedBy" })
        newPost = await Post.populate(newPost, { path: "replyTo" })
        
        if(newPost.replyTo !== undefined){
            await Notification.insertNotification(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id);
        }
        res.status(201).send(newPost);
    })
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

router.put("/:id/like", async (req, res, next) => {
    var postId = req.params.id;
    var userId = req.session.user._id;

    var isLiked = req.session.user.likes && req.session.user.likes.includes(postId);

    var option = isLiked? "$pull": "$addToSet"; //use the option inside the mongo query using []

    //insert user like
    req.session.user = await User.findByIdAndUpdate(userId, {[option]: { likes: postId}}, {new: true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    //insert post like
    var post = await Post.findByIdAndUpdate(postId, {[option]: { likes: userId}}, {new: true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    if(!isLiked){
        await Notification.insertNotification(post.postedBy, userId, "postLike", post._id);
    }

    res.status(200).send(post);
})

router.post("/:id/retweet", async (req, res, next) => {

    var postId = req.params.id;
    var userId = req.session.user._id;

    // try and delete retweet
    var deletedPost = await Post.findOneAndDelete({postedBy: userId, retweetData: postId})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    var option = deletedPost != null ? "$pull": "$addToSet"; //use the option inside the mongo query using []

    var repost = deletedPost;

    if(repost == null){
        // add the post
        repost = await Post.create({postedBy: userId, retweetData: postId})
        .catch(err => {
            console.log(err);
            res.sendStatus(400);
        })
    }

    //insert user retweet in user collection
    req.session.user = await User.findByIdAndUpdate(userId, {[option]: { retweets: repost._id}}, {new: true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    //insert post retweets on the original post
    var post = await Post.findByIdAndUpdate(postId, {[option]: { retweetUsers : userId}}, {new: true})
    .catch(err => {
        console.log(err);
        res.sendStatus(400);
    })

    //sending notification if the user is inserting a new retweet
    //the user could be undoing their retweet
    if(!deletedPost){
        await Notification.insertNotification(post.postedBy, userId, "retweet", post._id);
    }

    res.status(200).send(post);
})

router.delete("/:id", (req, res, next) => {
    Post.findByIdAndDelete(req.params.id)
    .then(()=> res.sendStatus(202))
    .catch((err)=> {
        console.log("Error " + err)
        res.sendStatus(400)
    });
})

async function getPosts(filter){
    var results = await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({"createdAt": -1})
    .catch(err=> console.log(`Error while fetching posts. Error: ${err}`))

    results = await User.populate(results, {path: "replyTo.postedBy"})
    return await User.populate(results, {path: "retweetData.postedBy"})
}

module.exports = router;