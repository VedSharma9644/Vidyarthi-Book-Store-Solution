function loadData(url, containerId) {
    $('#loadingIndicator').show();
    $.ajax({
        url: url,
        type: 'GET',
        success: function (response) {
            $('#loadingIndicator').hide(); // Hide loader
            $('#' + containerId).html(response); // Update the specified container

            // Re-initialize the DataTable after the new content has been loaded
            $("#basic-datatable").DataTable({
                destroy: true,  // Ensure the previous instance is destroyed before re-initialization
                keys: true,
                language: {
                    paginate: {
                        previous: "<i class='mdi mdi-chevron-left'></i>",
                        next: "<i class='mdi mdi-chevron-right'></i>"
                    }
                },
                drawCallback: function () {
                    $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
                }
            });
        },
        error: function (error) {
            console.error('Error loading data:', error);
            $('#loadingIndicator').hide(); // Hide loader
        }
    });
}
