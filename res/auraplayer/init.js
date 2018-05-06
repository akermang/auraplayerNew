//GLOBALS
var showStatusMessages = false;
var WEB_SERVICE_TIMEOUT = 30000;
var waitingForResponse = false;
var useSessionStorage = true; //true - save data on the browser local storage / false - save data on the server.
var handlerMap;
var userDataId;
var cookieLifespan = 1 * 60 * 60; //default one hour
var data = {};
window.lastFocusedElement = null;
var showErrorInRequest = true;

//initialize data
function initData() {

    userDataId = docCookies.getItem("userDataId");
    if (useSessionStorage) {
        setUserDataValuesInFields();
        initTableOrListFlags();
        populateTableOrList();
        addTableOrListClickListener();
    }
    else {
        if (userDataId != null) {
            refreshInputElements();
            getUserDataFromServer();	//will put fields in the input elements as well
        }
        else {
        	//generate new userDataId, save to cookie
            userDataId = Math.ceil(Math.random() * 10000000);
            data = new Object();
            var expiration = new Date();
            expiration.setSeconds(expiration.getSeconds() + cookieLifespan);
            docCookies.setItem("userDataId", userDataId, expiration);
        }
    }

    //set fields from query string into user data
    var qs = getURLParameters(window.location.search);
    for (param in qs) {
        populateField(param, qs[param]);
    }

    initEventHandlers();
    
    if (typeof window['handlerMap'] === "object") {
    	executeOnLoadHandlers();
    } else {
    	loadHandlersWithAjax();		//backward compatibility
    }
}

function loadHandlersWithAjax() {
	var creationTimestamp = $('meta[name="Creation-Timestamp"]').attr("content");
    if (creationTimestamp == undefined) {
        alert("Error: Meta tag Creation-Timestamp is missing");
    }
    var jsonFile = 'handlerMap_' + creationTimestamp + '.json';
	
	$.ajax({
        url: 'json/' + jsonFile,	// no need for getServiceManagerHost() since this is method is used only by old versions
        //async: false,
        dataType: 'text',
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        success: function (response) {
        	if (/^handlerMap=/.test(response)) {	// response.startsWith('handlerMap=')
        		response = response.substring('handlerMap='.length, response.length - ';'.length);
        	}
        	handlerMap = JSON.parse(response);
        	executeOnLoadHandlers();
        },
        error: function () {
            alert("Error loading handler map " + jsonFile);
        }
    });
}

function executeOnLoadHandlers() {
	var onloadFunctions = [];
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload"}));
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:navigate"}));
	$.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:function"}));
	for (var i = 0; i < onloadFunctions.length; i++) {
		executeHandler(onloadFunctions[i]);
	}
	$(document).triggerHandler("pageInitialized");
}

function initEventHandlers() {
	$(document).on("sendRequest", function () {
        if (window["sendRequestHandler"] != undefined) {
            window["sendRequestHandler"].call(this);
        }
    });

    $(document).on("receiveResponse", function (event, response, serviceName, status, populateFields) {
        if (window["receiveResponseHandler"] != undefined) {
            window["receiveResponseHandler"].call(this, response, serviceName, status, populateFields);
        }
    });

    $(document).on("pageInitialized", function () {
        if (window["pageInitializedHandler"] != undefined) {
            window["pageInitializedHandler"].call(this);
        }
    });
}

//initialize event listeners
$(function () {
	//initialize on-click event for inputs of type button
    $("input[type='button']").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }
    });

    //initialize on-click event for buttons
    $("button").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }
    });

    //initialize key-down event
    $(document).keydown(function (e) {
        var keyId = e.which;
        window.lastFocusedElement = e.target;
        var targetId = e.target.id;
        var handlers = getHandlersByFilter(handlerMap, {"key": keyId});

        for (var i = 0; i < handlers.length; i++) {
            //element not specified, execute
            if (handlers[i]["element"] == undefined ||
                handlers[i]["element"] == "") {
                executeHandler(handlers[i]);
            }
            //element matches rule, execute
            else if (handlers[i]["element"] == targetId) {
                executeHandler(handlers[i]);
            }
        }
        
        // do not propagate the event if the key was ENTER.
        if (keyId === 13) {
        	event.preventDefault();
        	return false;
        }
    });
});

//wait for window to load before showing
$(window).load(function () {
    $('body').show();
});
