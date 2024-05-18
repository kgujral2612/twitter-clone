$(document).ready(async ()=> {
    var followedUsers = await getFollowedUsers();

    $.get("/api/posts", {followedUsers: followedUsers}, results => {
        outputPosts(results, $(".postsContainer"));
     })
})

function getFollowedUsers(){
    var followedUsers = [];
    
    return new Promise((resolve, reject) => {
        $.get(`/api/users/${userLoggedIn._id}/following`, (data)=> {
            var following = data.following;
            following.forEach(user => {
                followedUsers.push(user._id);
            })
            resolve(followedUsers);
        })
    })
}