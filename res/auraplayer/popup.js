/**************
 * Info popup *
 **************/

function showInfoPopup(title, message, confirmCallback) {
    $("#infoPopupTitle").text(title);
    $("#infoPopupMessage").html(message);

    $("#infoPopup").popup({
        afterclose: function (event, ui) {
            if (typeof confirmCallback !== 'undefined') {
                confirmCallback();
            }
        }
    });
    
    setTimeout(function() {
    	$("#infoPopup").popup("open");
    }, 200);
}


/**********************
 * Confirmation popup *
 **********************/

function showConfirmPopup(title, message, confirmCallback, cancelCallback) {
    $("#confirmPopupTitle").text(title);
    $("#confirmPopupMessage").text(message);

    confirmPopupConfirmCallback = confirmCallback;
    confirmPopupCancelCallback = cancelCallback;

    setTimeout(function() {
    	$("#confirmPopup").popup("open");
    }, 200);
}

var confirmPopupConfirmCallback = undefined;
var confirmPopupCancelCallback = undefined;

$(function () {
    $("#confirmPopupOk").on("click", function () {
        if (confirmPopupConfirmCallback != undefined) {
            confirmPopupConfirmCallback();
        }
    });

    $("#confirmPopupCancel").on("click", function () {
        if (confirmPopupCancelCallback != undefined) {
            confirmPopupCancelCallback();
        }
    });
});
