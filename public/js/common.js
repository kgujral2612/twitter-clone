// Globals
var timer;

$("#postTextarea, #replyTextarea").keyup(event => {
    var textbox = $(event.target);
    var value = textbox.val().trim();
    
    var isModal = textbox.parents(".modal").length == 1;

    var submitButton = isModal? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0) return alert("No submit button found");

    if (value == "") {
        submitButton.prop("disabled", true);
        return;
    }
    submitButton.prop("disabled", false);
})

$("#submitPostButton").click(() => {
    var button = $(event.target);
    var textbox = $("#postTextarea");

    var data = {
        content: textbox.val()
    }

    $.post("/api/posts", data, postData => {
        
        var html = createPostHtml(postData);
        $(".postsContainer").prepend(html);
        textbox.val("");
        button.prop("disabled", true);
    })
})

$('#replyModal').on('show.bs.modal', function (event) {
    var button = $(event.currentTarget).data('clickedButton');
    var postId = getPostIdFromElement(button);
    $.get(`/api/posts/${postId}`, results => {
        outputPosts(results, $('#originalPostContainer'))
     })
})

$("#userSearchTextBox").keydown((event) => {
    clearTimeout(timer);
    var textbox = $(event.target);
    var value = textbox.val();

    //keycode: 8 del key
    if(value == "" && event.keycode == 8){
        //remove user from selection
        return;
    }

    timer = setTimeout(() => {
        value = textbox.val().trim();

        if(value == "") {
            $(".resultsContainer").html("");
        }
        else {
            searchUsers(value);
        }
    }, 1000)

})

//-----------------------------------------------------
//------------ LIKE BUTTON ONCLICK --------------------
//-----------------------------------------------------
//$(".likeButton").click() //wont work becausse the likeButton is dynamic content; 
//we need to attach the listener to the document instead

$(document).on("click", ".likeButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData) => {
            button.find("span").text(postData.likes.length || "");

            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})


//-----------------------------------------------------
//------------ RETWEET BUTTON ONCLICK -----------------
//-----------------------------------------------------
$(document).on("click", ".retweetButton", (event) => {
    var button = $(event.target);
    var postId = getPostIdFromElement(button);
    
    if(postId === undefined) return;

    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData) => {
            button.find("span").text(postData.retweetUsers.length || "");

            if(postData.retweetUsers.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else{
                button.removeClass("active");
            }
        }
    })
})

//-----------------------------------------------------
//------------ REPLY BUTTON ONCLICK -------------------
//-----------------------------------------------------
$(document).on("click", ".replyButton", (event) => {
    $('#replyModal').data('clickedButton', $(event.target));
    $('#replyModal').modal('show');
})

//get the post id (pulled from mongo into data-id attribute) from the root element
//if it is a child element such as buttons, return the post el
//else if it is the rot itself, return it as is
function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element : element.closest(".post");
    var postId = rootElement.data().id;

    if(postId === undefined)
        return alert("Post Id undefined");
    return postId;
}

function createPostHtml(postData) {

    if(postData == null)
        alert("postdata is null");
    
    var isRetweet = postData.retweetData !=null;
    var retweetedBy = isRetweet ? postData.postedBy.username: null;
    postData = isRetweet? postData.retweetData : postData;

    var postedBy = postData.postedBy;

    if(postedBy._id === undefined) {
        return console.log("User object not populated");
    }

    var displayName = postedBy.firstName + " " + postedBy.lastName;
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    var likedButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" : "";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" : "";

    var retweetText = '';
    if(isRetweet){
        retweetText = `<span>
                        <i class="fas fa-retweet"></i>
                        Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a></span>`;
    }

    return `<div class='post' data-id='${postData._id}'>
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class='header'>
                            <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                        </div>
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postFooter'>
                        <div class="postbuttonContainer">
                            <button title='reply' class='replyButton' data-toggle='modal' data-target='#replyModal'>
                                <i class="far fa-comment"></i>
                            </button>
                        </div>
                        <div class="postbuttonContainer green">
                            <button title='retweet' class='retweetButton ${retweetButtonActiveClass}'>
                                <i class="fas fa-retweet"></i>
                                <span>${postData.retweetUsers.length || ""}</span>
                            </button>
                        </div>
                        <div class="postbuttonContainer red">
                            <button title='like' class='likeButton ${likedButtonActiveClass}'>
                                <i class="far fa-heart"></i>
                                <span>${postData.likes.length || ""}</span>
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30) return "Just now";
        
        return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

function outputPosts(results, container){
    container.html("")

    if(!Array.isArray(results))
        results = [results]

    results.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);
    })

    if(results.length == 0){
        container.append("<span class='noResults'>Nothing to show</span>")
    }
}

function searchUsers(searchTerm){
    $get("/api/users", {search: searchTerm}, results=> {
        outputSelectableUsers(results, $("resultsContainer"));

    })
}

function outputSelectableUsers(results, container){
    //on a chat, you don't want to include yourself and the users that are already in the chat

    container.html("");

    results.forEach(result => {
        if(result._id == userLoggedIn._id ){

        }
        var html = createUserHtml(result, true)
        container.append(html);
    })

    if(results.length == 0){
        container.append(`<span class='noResults'>No results found</span>`)
    }
}

function createUserHtml(userData, showFollowButton) {

    var name = userData.firstName + " " + userData.lastName;
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"

    var followButton = "";
    if (showFollowButton && userLoggedIn._id != userData._id) {
        followButton = `<div class='followButtonContainer'>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>`;
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div>
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                    </div>
                </div>
                ${followButton}
            </div>`;
}