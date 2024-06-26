// Globals
var cropper;
var timer;
var selectedUsers = [];

$(document).ready(()=>{
    refreshMessagesBadge();
    refreshNotificationsBadge();
})

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

$("#submitPostButton, #submitReplyButton").click((event) => {
    var button = $(event.target);

    //check whether you're replying or creating a new post
    var isModal = button.parents(".modal").length == 1;
    var textbox = isModal? $("#replyTextarea"):$("#postTextarea");

    var data = {
        content: textbox.val()
    }

    if(isModal){
        var id = button.data().id;
        if(id == null) return alert("Button id is null");
        data.replyTo = id;
    }

    $.post("/api/posts", data, postData => {

        if(postData.replyTo){
            emitNotification(postData.replyTo.postedBy);
            location.reload();
        }
        else{
            var html = createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    })
})

$('#deletePostButton').click((event)=> {
    var postId = $(event.target).data("id");
    $.ajax({
        url: `/api/posts/${postId}`,
        type: "DELETE",
        success: (postData) => {
            location.reload();
        }
    })
})

$('#replyModal').on('show.bs.modal', function (event) {
    var button = $(event.currentTarget).data('clickedButton');
    var postId = getPostIdFromElement(button);
    $('#submitReplyButton').data("id", postId); //stores in jquery cache -- access using data()

    $.get(`/api/posts/${postId}`, results => {
        outputPosts(results.postData, $('#originalPostContainer'))
     })
})

//clear the modal post after closing it
$('#replyModal').on('hidden.bs.modal', () => $('#originalPostContainer').html(""))

$('#deletePostModal').on('show.bs.modal', function (event) {
    var button = $(event.currentTarget).data('clickedButton');
    var postId = getPostIdFromElement(button);
    $('#deletePostButton').data("id", postId); 
})

$("#userSearchTextBox").keydown((event) => {
    clearTimeout(timer);
    var textbox = $(event.target);
    var value = textbox.val();

    //keycode: 8 del key
    if(value == "" && (event.keyCode == 8 || event.which == 8)){
        //remove user from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");

        if(selectedUsers.length == 0){
            //no users, disable chat button
            $("#createChatButton").prop("disabled", true);
        }

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

$('#createChatButton').click(()=>{
   var data = JSON.stringify(selectedUsers);

   $.post("/api/chats", {users: data}, chat => {

        if(!chat || !chat._id){
            return alert('Invalid response from server');
        }

        window.location.href = `/messages/${chat._id}`
   })
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
                emitNotification(postData.postedBy);
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
                emitNotification(postData.postedBy);
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

//-----------------------------------------------------
//------------ DELETE POST BUTTON ONCLICK -------------
//-----------------------------------------------------
$(document).on("click", ".deletePostButton", (event) => {
    $('#deletePostModal').data('clickedButton', $(event.target));
    $('#deletePostModal').modal('show');
})

//-----------------------------------------------------
//------------ IMAGE UPLOAD BUTTON ONCLICK ------------
//-----------------------------------------------------
$(document).on("click", ".profilePictureButton", (event) => {
    $('#imageUploadModal').data('clickedButton', $(event.target));
    $('#imageUploadModal').modal('show');
})

//-----------------------------------------------------
//------------ COVER PHOTO UPLOAD BUTTON ONCLICK ------
//-----------------------------------------------------
$(document).on("click", ".coverPhotoButton", (event) => {
    $('#coverPhotoUploadModal').data('clickedButton', $(event.target));
    $('#coverPhotoUploadModal').modal('show');
})

//-----------------------------------------------------
//------------ POST  -----    ONCLICK -----------------
//-----------------------------------------------------
$(document).on("click", ".post", (event) => {
    var element = $(event.target);
    var postId = getPostIdFromElement(element);

    if(postId !== undefined && !element.is("button")){
        window.location.href = `/posts/${postId}`
    }
})

//-----------------------------------------------------
//------------ FOLLOW BUTTON ONCLICK ------------------
//-----------------------------------------------------
$(document).on("click", ".followButton", (event) => {
    var element = $(event.target);
    var userToFollow = element.data().user;
    
    $.ajax({
        url : `/api/users/${userToFollow}/follow`,
        type: "PUT",
        success: (data, status, xhr) => {
            if(xhr.status !=200)
                alert('could not follow');
            
            var followers = parseInt($('#followersCount').text()) 
            if(element.hasClass('following')){
                element.removeClass('following');
                $('#followersCount').text(followers - 1);
                $('.followButton').text('Follow');
            }
            else{
                element.addClass('following');
                $('#followersCount').text(followers + 1);
                $('.followButton').text('Following');
            }
        }
    })
})

$(document).on("click", ".notification.active", (event)=> {
    var container = $(event.target);
    var notificationId = container.data().id;
    var href = container.attr("href");
    event.preventDefault();
    var callback = () => window.location = href; 

    markNotificationsAsOpened(notificationId, callback);
})

$('#filePhoto').change((event)=>{
    var input = $(event.target)[0];
    console.log(input);

    if(input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById('imagePreview');
            image.src = e.target.result;

            if(cropper !== undefined){
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 1/1,
                background: false
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
})

$('#imageUploadButton').click(()=>{
    //get the cropped area
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null){
        alert('could not upload image. make sure it is a valid image file.');
        return;
    }

    //blob binary large object
    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload()
        })
    })
})

$('#coverPhoto').change((event)=>{
    var input = $(event.target)[0];
    console.log(input);

    if(input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = (e) => {
            var image = document.getElementById('coverPreview');
            image.src = e.target.result;

            if(cropper !== undefined){
                cropper.destroy();
            }

            cropper = new Cropper(image, {
                aspectRatio: 16/9,
                background: false
            });
        }
        reader.readAsDataURL(input.files[0]);
    }
})

$('#coverPhotoUploadButton').click(()=>{
    //get the cropped area
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null){
        alert('could not upload cover photo. make sure it is a valid image file.');
        return;
    }

    //blob binary large object
    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);

        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload()
        })
    })
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

function createPostHtml(postData, largeFont = false) {

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
    var largeFontClass = largeFont ? "largeFont": "";

    var retweetText = '';
    if(isRetweet){
        retweetText = `<span>
                        <i class="fas fa-retweet"></i>
                        Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a></span>`;
    }

    var replyFlag = "";

    if(postData.replyTo && postData.replyTo._id){

        if(!postData.replyTo._id){
            return alert("Reply to is not populated");
        }
        else if(!postData.replyTo.postedBy._id){
            return alert("Posted by is not populated");
        }

        var replyUserName = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyUserName}'>@${replyUserName}</a>
                    <div>`;
    }

    var buttons = "";
    if(postData.postedBy._id == userLoggedIn._id){
        buttons = `<button data-id="${postData._id}" class="deletePostButton" data-toggle="modal" data-target="#deletePostModal">
        <i class="fas fa-times"></i>
        </button>`;
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
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
                            ${buttons}
                        </div>
                        ${replyFlag}
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
}

function searchUsers(searchTerm){
    $.get("/api/users", {search: searchTerm}, results=> {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container){
    //on a chat, you don't want to include yourself and the users that are already in the chat

    container.html("");

    results.forEach(result => {
        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)){ //don't want to show ourselves
            return;
        }
        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(()=> userSelected(result))

        container.append(element);
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

function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $("#userSearchTextBox").val("").focus() //clear the value of the search box and focus again
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml(){
    var elements = [];

    selectedUsers.forEach(user => {
        var name = `${user.firstName} ${user.lastName}`;
        var userElement = $(`<span class = 'selectedUser' >${name}</span>`)
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}

function getChatName(chatData) {
    var chatName = chatData.chatName;
    if(!chatName){
        //take all the users other than us
        var otherChatUsers = getOtherChatUsers(chatData.users);
        var namesArray = otherChatUsers.map(user => user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ");
    }

    return chatName;
}

function getOtherChatUsers(users){
    if(users.length == 1){
        return users;   //everyone left, you chat with your self
    }
    return users.filter(user=> user._id != userLoggedIn._id);
}

function messageReceived(newMessage){
    console.log("new message");
    if($(`[data-room="${newMessage.chat._id}"]`).length == 0){
        //not on the chat page
        //show popup
        showMessagePopup(newMessage);
    }
    else{
        // on chat page
        addChatMessageHtml(newMessage);
    }
    refreshMessagesBadge();
}

function markNotificationsAsOpened(notificationId = null, callback = null){
    if(callback == null){
        callback = () => location.reload();
    }

    var url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened` : `/api/notifications/markAsOpened`;
    $.ajax({
        url : url,
        type: "PUT",
        success : callback
    })
}

function refreshMessagesBadge(){
    $.get("/api/chats", { unreadOnly: true}, (data)=> {
        
        var numResults  = data.length;

        if(numResults > 0){
            $("#messagesBadge").text(numResults).addClass("active");
        }else{
            $("#messagesBadge").text("").removeClass("active");
        }
    })
}

function refreshNotificationsBadge(){
    $.get("/api/notifications", { unreadOnly: true}, (data)=> {
        
        var numResults  = data.length;

        if(numResults > 0){
            $("#notificationsBadge").text(numResults).addClass("active");
        }else{
            $("#notificationsBadge").text("").removeClass("active");
        }
    })
}

function createNotificationHtml(notification){
    var userFrom = notification.userFrom;
    var notificationText  = getNotificationText(notification);
    var href = getNotificationUrl(notification);
    var openedClass = notification.opened ? "" : "active";

    return `<a href='${href}' class='resultListItem notification ${openedClass}' data-id=${notification._id}>
                <div class="resultsImageContainer">
                    <img src="${userFrom.profilePic}" />
                </div>
                <div class="resultsDetailsContainer ellipsis">
                    ${notificationText}
                </div>
            </a>`;
}

function getNotificationText(notification){
    var userFrom = notification.userFrom;

    if(!userFrom.firstName || !userFrom.lastName)
        return alert("userFrom data not populated");

    var userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

    var text;

    if(notification.notificationType == "retweet"){
        text = `${userFromName} reposted one of your posts`
    }

    else if(notification.notificationType == "postLike"){
        text = `${userFromName} liked one of your posts`
    }

    else if(notification.notificationType == "reply"){
        text = `${userFromName} replied to one of your posts`
    }

    return `<span class="ellipsis">${text}</span>`;
}

function getNotificationUrl(notification){
    if(notification.notificationType == "retweet" 
    || notification.notificationType == "postLike" 
    || notification.notificationType == "reply"){
        return `/posts/${notification.entityId}`

    }

    //if notificationType == "follow", then take them to the profile page of the follower

}

function showNotificationPopup(data){
    var html = createNotificationHtml(data);
    var element = $(html);
    element.hide().prependTo("#notificationsList").slideDown("fast");

    setTimeout(()=>  element.fadeOut(500), 5000 );
}

function createChatHtml(chatData){
    var chatName = getChatName(chatData);
    var image = getChatImageElements(chatData);
    var latestMessage = getLatestChatMessage(chatData.latestMessage);
    var activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";

    return `<a class='resultListItem ${activeClass}' href='/messages/${chatData._id}'>
                ${image}
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subtext ellipsis'>${latestMessage}</span>
                </div>
            </a>`;
}

function getLatestChatMessage(latestMessage){
    if(latestMessage != null){
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }

    return "New chat";
}

function getChatImageElements(chatData){
    var otherChatUsers = getOtherChatUsers(chatData.users);

    var groupChatClass = "";
    var chatImage = getUserChatImageElement(otherChatUsers[0]);

    if(otherChatUsers.length > 1){
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherChatUsers[1]);
    }

    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user){
    if(!user || !user.profilePic) {
        return alert("user passed into function is invalid");
    }

    return `<img src=${user.profilePic} alt='Profile Picture'></img>`
}

function showMessagePopup(data){
    if(!data.chat.latestMessage._id){
        data.chat.latestMessage = data;
    }

    var html = createChatHtml(data.chat);
    var element = $(html);
    element.hide().prependTo("#notificationsList").slideDown("fast");

    setTimeout(()=> element.fadeOut(500), 5000);
}