# Twitter Clone: a full-stack, real-time twitter clone
![alt System Architecture Diagram](/system-diagram.png)

This project is a full-stack Twitter clone built with modern JavaScript technologies. The application offers core functionalities similar to twitter, allowing users to:

- Create, and view posts (tweets)
- Follow & unfollow other users 
- View feeds from only users that you follow
- Like and reply on posts
- Retweet posts from other users
- Search for users and posts
- Experience real-time updates and chatting with Socket.IO

## Tech Stack
- Frontend: HTML, CSS, Boostrap, JQuery, JavaScript, Pug 
- Backend: Node.js, Express
- Database: MongoDB
- Real-time communication: Socket.IO

## Features
- User Authentication: Secure login and registration system.
- Feed: View posts from followed users.
- Notifications: View notifications from other users instantly.
- Messaging: Chatting with other users instantly.
- Profile Image and Banner Image upload with crop functionality.
- Responsive Design: Optimized for various screen sizes.

## Realtime Chat Demo
![Demo](/demo/ChatDemo.gif)

## Notifcations Demo
![Demo](/demo/NotificationsDemo.gif)

## System Architecture

### Server (Node.js)
- The server is responsible for handling user requests, managing user authentication, interacting with the database, and facilitating real-time communication using Socket.IO.
- Express.js provides routing for API endpoints to handle user actions like registration, login, posting tweets, following users, etc.
- Mongoose ODM (Object Data Modeling) simplifies interaction with the MongoDB database.

### Datebase (MongoDB): 
MongoDB stores 
- User Data: first name, last name, username, email, password, profile picture, liked posts, retweeted posts, followed users, followers
- Tweet/Post Data: content, likes, retweeted by, posted by, if it is a reply
- Notifications Data: user to, user from, notification type(post like/reply/retweet/follow)
- Chats Data: users, chat name, latest message, created time, last updated time, if it is a group chat
- Messages Data: content, sender, chat id, read by 

### Frontend
- The frontend will be built using HTML, CSS, and Pug templates.
- Pug templates will dynamically generate HTML pages based on user data and fetched content from the backend.
- Socket.IO will be integrated on the client-side to enable real-time updates on messages and notifications

## Functionality Breakdown

### User Registration and Login
- Users will register with a username and password.
- Login will involve verifying username and password against the database.
- Secure password hashing will be implemented for user credentials using bcrpyt npm package

### Creating and viewing tweets
- Users can create tweets with text content.
- Tweets will be stored in the database with timestamps and author information.
- The frontend will display a timeline of tweets from followed users and the user themselves.

### Following and Unfollowing users:
- Users can follow other users.
- Following relationships will be stored in the database.
- Number of followers and followed users will be displayed on a user's profile
- The home page feed will display tweets from followed users.

### Liking and Retweeting posts:
- Users can like and retweet existing tweets.
- Likes and retweets will be stored with user and tweet references in the database.
- The frontend will display like and retweet counts for each tweet.

## Scalability

### Scalability:
- The application can be horizontally scaled by adding more Node.js servers behind a load balancer.
- MongoDB can be scaled by adding replica sets or sharding.

## Future Improvements
- Login and sign up using third party systems such as google, facebook, etc 
- Search Optimization
- Security
- Caching


