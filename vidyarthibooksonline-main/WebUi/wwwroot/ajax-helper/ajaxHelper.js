function ajaxRequest(url, method, data, redirectUrl, buttonElement, isFileUpload = false, successCallback = null) {
    if (buttonElement) {
        var button = $(buttonElement);
        var originalHtml = button.html();
        button.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>');
        button.prop('disabled', true);
    }

    return $.ajax({
        url: url,
        type: method.toUpperCase(), // 'GET' or 'POST'
        data: data,
        contentType: isFileUpload ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
        processData: !isFileUpload,
        success: function (response) {
           
            if (response.success) {
                toastr.success(response.message, 'Success', {
                    positionClass: 'toast-top-right',
                    closeButton: true,
                    progressBar: true,
                    newestOnTop: true,
                    timeOut: 5000
                });

                if (response.redirectUrl) {
                    setTimeout(function () {
                        window.location.href = response.redirectUrl;
                    }, 1000); // Redirect after 1 seconds

                    // Call success callback if provided
                    if (successCallback && typeof successCallback === 'function') {
                        successCallback(response);
                    }
                } else if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {

                   
                    // If the action is delete, remove the product item from the DOM
                    if (method.toUpperCase() === 'POST' && url.includes('deleteproduct')) {
                        $(buttonElement).closest('.product-item').remove();
                    }
                }
            } else {
                toastr.error(response.message, 'Error', {
                    positionClass: 'toast-top-right',
                    closeButton: true,
                    progressBar: true,
                    newestOnTop: true,
                    timeOut: 5000
                });
            }
        },
        error: function (xhr, status, error) {
            toastr.error('An error occurred while processing your request.', 'Error', {
                positionClass: 'toast-top-right',
                closeButton: true,
                progressBar: true,
                newestOnTop: true,
                timeOut: 5000
            });
            console.error('Request failed:', status, error);
        },
        complete: function () {
            if (buttonElement) {
                button.html(originalHtml);
                button.prop('disabled', false);
            }

        }
    });
}


