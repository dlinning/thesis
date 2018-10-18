(() => {
    var fileDownloader = {};

    fileDownloader.downloadToDevice = (data, blobArgs, title) => {
        var blob = new Blob([data], blobArgs);

        // IE
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob);
        }

        // Regular Browsers
        const objUrl = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = objUrl;
        a.download = title;
        a.click();
        setTimeout(function() {
            // Firefox needs a delay
            window.URL.revokeObjectURL(objUrl);
        }, 100);
    };

    window.fileDownloader = fileDownloader;
})();
