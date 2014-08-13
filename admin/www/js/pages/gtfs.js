$(function () {
    function pageLoad(){
        'use strict';
        // Initialize the jQuery File Upload widget:
        var $fileupload = $('#fileupload');
        $fileupload.fileupload({
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: '/data/gtfs/upload/',
            dropZone: $('#dropzone')
        });

        // Enable iframe cross-domain access via redirect option:
        $fileupload.fileupload(
            'option',
            'redirect',
            window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'
            )
        );
        
    }
    pageLoad();

    PjaxApp.onPageLoad(pageLoad);

});