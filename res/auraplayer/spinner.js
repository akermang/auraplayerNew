/*
 * spinner function - starts/stops spinner over html element
 * 
 * spinner.start(parentElemtId) - start spinner over parentElemtId
 * spinner.stop() - stop spinner
 * 
 */
var androidSpinner = (function () {
    "use strict";

    var spinner = {};

    spinner.start = function (loadingText, theme) {
        $.mobile.loading("show", {
            text: loadingText,
            textVisible: true,
            theme: (theme === 'b') ? theme : 'z',
            html: ""
        });
    };

    spinner.stop = function () {
        $.mobile.loading("hide");
    };

    return spinner;
}());

function spinner(template) {
	return androidSpinner;
}

function startSmallSpinner(text) {
	$('#mainBody').append(
		'<div id="small-spinner" class="ui-loader ui-corner-all ui-body-z ui-loader-verbose small-spinner">' +
	   		'<span class="ui-icon-loading"><h1>' + text + '</h1></span>' + 
	   	'</div>');
}

function stopSmallSpinner() {
	var spinner = document.getElementById('small-spinner');
	if (spinner != undefined) {
		spinner.remove();
	}
}
