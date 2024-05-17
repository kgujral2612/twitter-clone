$(document).ready(()=>{
    updateFollowButtonText();
    updateFollowersCount();
    updateFollowingCount();

    if(selectedTab === "replies")
        loadReplies();
    else
        loadPosts();
});

function updateFollowersCount(){
    $.get(`/api/users/${profileUserId}/followers`, results => {
        if(results && results.followers){
            $("#followersCount").text(results.followers.length)
        }
    })
}

function updateFollowingCount(){
    $.get(`/api/users/${profileUserId}/following`, results => {
        if(results && results.following){
            $("#followingCount").text(results.following.length)
        }
    })
}

function loadPosts() {
    $.get("/api/posts", { postedBy: profileUserId, isReply: false }, results => {
        outputPosts(results, $(".postsContainer"));
    })
}

function loadReplies() {
    $.get("/api/posts", { postedBy: profileUserId, isReply: true }, results => {
        outputPosts(results, $(".postsContainer"));
    })
}

function updateFollowButtonText(){
    var following = userLoggedIn.following;
    if(following.includes(profileUserId)){
        $('.followButton')
        .addClass('following')
        .text('Following');
    }
    else{
        $('.followButton')
        .removeClass('following')
        .text('Follow');
    }
}