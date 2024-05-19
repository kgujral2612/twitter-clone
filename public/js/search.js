$(document).ready(()=> { 
    
    var selectedTab = $(".tabsContainer > .tab.active > span").text().trim();
    $('#searchBox').keydown((event)=> {
        if(event.which === 13){ //enter key is pressed
            var filterText = $('#searchBox').val().trim();
            
            if(selectedTab === 'Posts'){
                $.get("/api/posts", {search: filterText}, data=> {
                    if(data){
                        createPostListHtml(data);
                    }
                })
            } 
            else{
                $.get("/api/users", {search: filterText}, data => {
                    if(data){
                        createUserListHtml(data);
                    }
                })
            }
        }
    })
})

function createPostListHtml(posts){
    var html = "";
    posts.forEach(post=> {
        html += createPostHtml(post);
    })

    $(".resultsContainer").append(html);
}

function createUserListHtml(users){
    var html = "";
    users.forEach(user => {
        html += createUserHtml(user, true);
    })

    $(".resultsContainer").append(html);
}