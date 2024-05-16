$(document).ready(()=>{
    $.get("/api/notifications", (data)=>{
        outputNotificationList(data, $('.resultsContainer'));
    })
})

$("#markNotificationsAsRead").click(()=> markNotificationsAsOpened())

function outputNotificationList(notifications, container){

    notifications.forEach((notification)=> {
        var html = createNotificationHtml(notification);
        container.append(html);
    })

    if(notifications.length == 0){
        container.append("<span class='noResults'>Nothing to show</span>")
    }
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