$(document).ready(()=>{
    $.get(`/api/chats/${chatId}`, (data) => {
        $("#chatName").text(getChatName(data));
    })
})

$(document).on("click", "#chatName", (event) => {
    $('#chatNameModal').data('clickedButton', $(event.target));
    $('#chatNameModal').modal('show');
})

$("#chatNameButton").click(()=>{
    var name = $("#chatNameTextbox").val().trim();
    $.ajax({
        url : `/api/chats/${chatId}`,
        type: "PUT",
        data: {chatName: name},
        success: (data, status, xhr) => {
            if(xhr.status !=204)
                alert('could not update');
            else
                location.reload();
        }
    })
})