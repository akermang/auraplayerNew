function uploadNewFiles() {
	spinner().start("Uploading attachments..");
	var deferred = $.Deferred();
	var deferreds = [];
	
	$('input[type="file"]').each(function(index, field){
		if (field.attributes.uploaded !== undefined && field.attributes.uploaded.value !== "true") {
			store(field.id, '');
			if (field.files.length !== 0 || field.attributes.fileFromCamera !== undefined) {
				var file = field.attributes.fileFromCamera !== undefined ? dataURItoBlob(field.attributes.fileFromCamera.value) : field.files[0];
				var target = field.attributes['data-target'] !== undefined ? field.attributes['data-target'].value : '';
				
				var formData = new FormData();
				formData.append('path', target !== '' ? target : 'www/upload');
				formData.append('file', file);
				if (target !== '') {
					formData.append('absolute', true);
				}
	
				deferreds.push($.ajax({
					url: getServiceManagerHost() + '/ServiceManager/Macro/FileManager',
					data: formData,
					type: 'POST',
					contentType: false, // (requires jQuery 1.6+)
					processData: false,
					success: function(response) {
						store(field.id, response.data);
						field.setAttribute("uploaded", true);
					}, error: function(jqXHR, textStatus, errorMessage) {
						spinner().stop();
						showInfoPopup('File upload failed', errorMessage);
					}
				 }));
			}
		}
	});
	
	$.when.all(deferreds).then(function(objects) {
		spinner().stop();
	    deferred.resolve();
	});
	
	return deferred.promise();
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: 'image/jpeg' });
}

if (typeof jQuery.when.all === 'undefined') {
    jQuery.when.all = function (deferreds) {
        return $.Deferred(function (def) {
            $.when.apply(jQuery, deferreds).then(
                function () {
                    def.resolveWith(this, [Array.prototype.slice.call(arguments)]);
                },
                function () {
                    def.rejectWith(this, [Array.prototype.slice.call(arguments)]);
                });
        });
    }
}

$(document).ready(function(){
    $("input[type=file]").click(function(){
        $(this).val("");
        document.getElementById(this.id + '_filename').innerHTML = '(No file)';
    });

    $("input[type=file]").change(function(){
        this.setAttribute("uploaded", false);
        this.removeAttribute("fileFromCamera");
        document.getElementById(this.id + '_filename').innerHTML = this.files[0].name;
    });
});
