$(document).ready(()=> {
    $.get(`/api/posts/${postId}`, results => {
        outputPostsWithReplies(results, $(".postsContainer"));
     })
})

function outputPostsWithReplies(results, container){
    container.html("")

    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach(result => {
        var html = createPostHtml(result);
        container.append(html);
    })

    if(results.length == 0){
        container.append("<span class='noResults'>Nothing to show</span>")
    }
}