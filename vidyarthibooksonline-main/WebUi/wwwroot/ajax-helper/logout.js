function logout() {
    $.ajax({
        type: "POST",
        url: "/logout",
        success: function (data) {
            if (data.success) {
                window.location.href = data.redirectUrl;
            }
        }
    });
}

$('.logout-link').on('click', logout);