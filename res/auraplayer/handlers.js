function executeHandler(handler) {
    if (handler == undefined) {
        return;
    }

    if (handler["preFunction"] != undefined) {
        executeCallFunctionHandler(handler["preFunction"], arguments);
    }
    
    if (/function$/.test(handler["action"])) {	//handler["action"].endsWith("function")
        executeCallFunctionHandler(handler['attr'], arguments);
        
    } else if (/webservice$/.test(handler["action"]) || handler["action"] == "onload") {
    	callWebServiceWithAllParams(handler['attr'], handler['initHandler'], handler['responseHandler'], handler['failureHandler'], true, true);

    } else if (/navigate$/.test(handler["action"])) {
        navigate(handler['attr']);
    }
}

function executeCallFunctionHandler(funcName, outerArguments) {
    if (window[funcName] == undefined) {
        alert("Undefined function: " + funcName);
    } else {
        window[funcName].apply(undefined,
            arguments.length > 1 ? Array.prototype.slice.call(outerArguments, 1) : undefined);
    }
}

function analyzeJson(json, responseHandler, serviceName, populateFields) {
    if (typeof json["Response"] === 'undefined') {
        executeResponseHandler(responseHandler, json, serviceName);
        return;
    }

    //Extract special output parameters
    var errorMsg = json["Response"][serviceName + "Message"]["Error"];
    var popupMsg = json["Response"][serviceName + "Message"]["PopupMessages"];
    var statusBarMsg = json["Response"][serviceName + "Message"]["StatusBarMessages"];

    if (showStatusMessages) {
        populateStatusMessages(statusBarMsg, popupMsg, errorMsg);
    }

    //Handle Elements
    var elements = json['Response'][serviceName + 'Elements'];

    if (typeof elements === "object" && elements !== null) {
        var nodeValue = "";
        var nodeName = "";
        for (var i in elements) {
            nodeName = i;
            nodeValue = elements[i];

            if (useSessionStorage === false) {	//TODO useSessionStorage?
                data[nodeName] = nodeValue;
            }

            //populate fields
            if (typeof(populateFields) === "undefined" || populateFields) {
                populateField(nodeName, nodeValue, "_output");
            }
        }
    }

    //Handle Array Items
    var tableRows = null;

    if (typeof json["Response"][serviceName + "TableArray"] !== 'undefined') {
        //if Object, convert to Array
        tableRows = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    storeArrayInSessionStorage(tableRows);
    if (typeof(populateFields) === "undefined" || populateFields) {
    	setUserDataValuesInFields();
    	if ((hasTable || hasList)) {
            populateTableOrList();
        }
    }

    executeResponseHandler(responseHandler, json, serviceName, tableRows);
    return true;
}

function executeResponseHandler(responseHandler, data, serviceName, tableRows) {
    if (typeof responseHandler === 'undefined' || responseHandler === '') {
        return;
    }

    //response handler is function
    if (typeof responseHandler.indexOf === 'undefined' || responseHandler.indexOf(':') === -1) {
        if (typeof responseHandler !== 'undefined' ||
            (typeof window[responseHandler] !== 'undefined' && window[responseHandler] !== null)) {
            if (typeof window[responseHandler] === 'function') {
                window[responseHandler].call(this, data, serviceName, tableRows);
            } else if (typeof responseHandler === 'function') {
                responseHandler.call(this, data, serviceName, tableRows);
            }
        }

        return;
    }
    
    if (/^popupErrors:/.test(responseHandler)) {	//responseHandler.startsWith('popupErrors:')
        var popupContents = responseHandler.substring(12);
        var separatorPos = popupContents.lastIndexOf(';');
        showServiceErrorsPopup(popupContents.substring(0, separatorPos), popupContents.substring(separatorPos + 1));
        return;
    }

    if (/^popupAndNavigate:/.test(responseHandler)) {	//responseHandler.startsWith('popupAndNavigate:')
    	var separatorPos = responseHandler.lastIndexOf(':');
    	var popupText = responseHandler.substring(17, separatorPos);
    	var targetPage = responseHandler.substring(separatorPos + 1);
        showInfoPopup('', popupText, function() {
    	    navigate(targetPage);
    	});
        return;
    }
    
    if (/^popup:/.test(responseHandler)) {	//responseHandler.startsWith('popup:')
        var popupText = responseHandler.substring(6);
        showInfoPopup('', popupText);
        return;
    }

    if (/^navigate:/.test(responseHandler)) {	//responseHandler.startsWith('navigate:')
        var targetPage = responseHandler.substring(9);
        navigate(targetPage);
        return;
    }
}

function _callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	var params = getInputFieldsAsQueryString();
	callWebService(webService, params, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
}

/**
 *
 * @param webService -    name of webservice
 * @param initHandler - function to be run before call to webservice,
 *                        return false to abort execution.
 *                        initHandler(serviceName)
 *
 * @param responseHandler - function to be run after webservice call,
 *                            responseHandler(response, serviceName, status)
 *            response - in json format
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	if (typeof window['uploadNewFiles'] === 'function') {
		uploadNewFiles().then(function() {
	    	_callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
	    });
	} else {
		_callWebServiceWithAllParams(webService, initHandler, responseHandler, failureHandler, asyncFlag, populateFields);
	}
}

/**
 *
 * @param webService -     name of webservice
 * @param params -         query string
 * @param initHandler -    function to be run before call to webservice,
 *                         return false to abort execution.
 *                         initHandler(serviceName)
 * @param asyncFlag -      call web service asynchronously
 * @param populateFields - field populator callback
 * @param failureHandler - function to be run after webservice call in case of a failure
 * @param responseHandler - function to be run after webservice call,
 *                            responseHandler(response, serviceName, status)
 *            response - in json format.
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebService(webService, params, initHandler, responseHandler, failureHandler, asyncFlag, populateFields) {
	if (waitingForResponse) {	//prevent calls to webservice while waiting for response
        return;
    }

    webService = webService.trim();
    if (typeof webService === 'undefined' || webService === '') {
        return;
    }
    
    var webServiceUrl;
    if (webService.indexOf("/") === -1 && webService.indexOf(".") === -1 && webService.indexOf(":") === -1) {
        webServiceUrl = "/ServiceManager/Macro/ExecMacro/" + webService;	//if webService is not URL, assume it is local service
    } else {
        webServiceUrl = webService;		//webService is assumed to be URL
    }

    var queryData = encodeURI(params) + '&randomSeed=' + (Math.random() * 1000000) + '&userDataId=' + userDataId + '&json=true';
    var serviceName = webServiceUrl.substr(webServiceUrl.lastIndexOf('/') + 1);

    //call init handler
    if (typeof initHandler !== 'undefined') {
        //get the function by calling window[errorHandler]
        if (typeof window[initHandler] !== 'undefined' && window[initHandler] !== null) {
            if (typeof(window[initHandler]) === 'function')
                var initResult = window[initHandler].call(this, serviceName);
            if (initResult === false) {
                return; //abort execution
            }
        }
    }

    $(document).triggerHandler("sendRequest");
    waitingForResponse = true;

    sendWebServiceRequest(serviceName, getServiceManagerHost() + webServiceUrl, queryData, asyncFlag, responseHandler, failureHandler, populateFields);
}

function sendWebServiceRequest(serviceName, url, queryData, asyncFlag, responseHandler, failureHandler, populateFields) {
	$.ajax({
        url: url,
        type: "POST",
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        dataType: "json", // expected format for response
        data: queryData,
        async: typeof asyncFlag === 'undefined' ? true : asyncFlag,
        success: function (response) {
        	if (typeof storeOfflineResponseIfNeeded === 'function') {
        		storeOfflineResponseIfNeeded(serviceName, response);
        	}
            onWebServiceAjaxSuccess(response, responseHandler, failureHandler, serviceName, populateFields);
        },
        error: function (response, status, error) {
        	if (response.status === 0) {
        		spinner().stop();
        		invokeOfflineHandler(serviceName, url, queryData);
        	} else {
        		onWebServiceAjaxFailure(response, status, failureHandler, serviceName, populateFields);
        	}
        },
        complete: function () {
            waitingForResponse = false;
        }
    });
}

function populateErrorsToHandler(failureHandler, message, status) {
	if (typeof failureHandler === 'function' || !/^popupErrors:/.test(failureHandler)) {	//!failureHandler.startsWith('popupErrors:')
		return failureHandler;
	}
	return failureHandler + message + ";" + status;
}

function onWebServiceAjaxSuccess(response, responseHandler, failureHandler, serviceName, populateFields) {
    window.response = response;
    var serviceErrorMsg = getResponseNodeValueByName("Error");

    if (serviceErrorMsg == "Service is disabled.") {
        showInfoPopup('Service Error', serviceErrorMsg);
        executeResponseHandler(failureHandler, undefined, serviceName, undefined);
        $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);

    } else if (typeof serviceErrorMsg !== 'undefined' && serviceErrorMsg !== null && serviceErrorMsg !== '') {
        failureHandler = populateErrorsToHandler(failureHandler, serviceErrorMsg, 200);
        analyzeJson(response, failureHandler, serviceName, populateFields);
        $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);
    } else {
        analyzeJson(response, responseHandler, serviceName, populateFields);
        $(document).triggerHandler("receiveResponse", [response, serviceName, "success", populateFields]);
    }
}

function populateErrorsToHandler(failureHandler, message, status) {
    if (typeof failureHandler === 'function' || !/^popupErrors:/.test(failureHandler)) {	//!failureHandler.startsWith('popupErrors:')
        return failureHandler;
    }

    return failureHandler + message + ";" + status;
}

function onWebServiceAjaxFailure(response, status, failureHandler, serviceName, populateFields) {
    var serviceErrorMsg = getResponseNodeValueByName("Error", response.responseJSON);

    if (typeof serviceErrorMsg === 'undefined' || serviceErrorMsg == null || serviceErrorMsg === "") {
    	if (response.status === 404) {
            showInfoPopup('Service Error', 'Service has failed with status of 404 - Requested page not found');
        } else if (response.status === 500) {
            showInfoPopup('Service Error', 'Service has failed with status of 500 - Internal Server Error');
        } else if (status === 'parsererror') {
            showInfoPopup('Service Error', 'Requested url parse failed');
        } else if (status === 'timeout') {
            showInfoPopup('Service Error', 'Timeout reached, no response');
        } else if (status === 'abort') {
            showInfoPopup('Service Error', 'Ajax request aborted');
        } else {
            showInfoPopup('Service Error', 'Unexpected Error: \n' + response.responseText);
        }
        
        if (!/^popupErrors:/.test(failureHandler)) {		//!failureHandler.startsWith('popupErrors:') || !popupLaunched
        	executeResponseHandler(failureHandler, undefined, serviceName, undefined);
        }

    } else if (typeof serviceErrorMsg !== 'undefined' && serviceErrorMsg != null && serviceErrorMsg !== "") {
        failureHandler = populateErrorsToHandler(failureHandler, serviceErrorMsg, response.status);
        analyzeJson(response.responseJSON, failureHandler, serviceName, populateFields);
    }

    $(document).triggerHandler("receiveResponse", [null, serviceName, "error", populateFields]);
}

function getHandlersByFilter(handlerMap, filter) {
    if (handlerMap == undefined) {
        return [];
    }

    return $(handlerMap).filter(function (index, handler) {
        return objFilter(handler, filter);
    });
}

function fetchService(serviceName, responseHandler, failureHandler) {
    var fetchServiceUrl;

    serviceName = serviceName.trim();

    if (typeof serviceName === 'undefined' || serviceName === '') {
        return;
    }

    fetchServiceUrl = "/ServiceManager/Macro/Service/" + serviceName;

    $.ajax({
        url: getServiceManagerHost() + fetchServiceUrl,
        type: "GET",
        timeout: WEB_SERVICE_TIMEOUT,
        dataType: "json",
        async: true,
        success: responseHandler,
        error: failureHandler
    });
}

function showServiceErrorsPopup(serviceErrorMsg, status) {
    var errorAlert = "<div> Service failed with errors [status " + status + "]:<br />&#9658;";
    
    errorAlert += [].concat.apply([], serviceErrorMsg.split("'").map(function(v,i){
        return i % 2 ? "'" + v + "'" : v.split(';').join("<br />&#9658;")
	})).filter(Boolean).join("");

    errorAlert += "<div/>";
    showInfoPopup('Service Error', errorAlert);
}

//utility function, used by getHandlersByFilter
function objFilter(obj, filter) {
    var result = true;

    for (key in filter) {
        result &= obj[key] == filter[key];
    }

    return result;
}

function getServiceManagerHost() {
	return 	typeof app !== 'undefined' && app.serviceManagerHost != undefined && app.serviceManagerHost != null ?
			app.serviceManagerHost.trim().replace(/\/$/, '') :
			'';
}

function navigate(targetUrl) {
    saveUserData();
    window.location = targetUrl;
}
