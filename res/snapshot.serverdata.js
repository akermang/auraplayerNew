/*\
 |*|
 |*|  :: cookies.js ::
 |*|
 |*|  A complete cookies reader/writer framework with full unicode support.
 |*|
 |*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
 |*|
 |*|  This framework is released under the GNU Public License, version 3 or later.
 |*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 |*|
 |*|  Syntaxes:
 |*|
 |*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
 |*|  * docCookies.getItem(name)
 |*|  * docCookies.removeItem(name[, path], domain)
 |*|  * docCookies.hasItem(name)
 |*|  * docCookies.keys()
 |*|
 \*/

var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            return false;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) {
            return false;
        }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: /* optional method: you can safely remove it! */ function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) {
            aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
        }
        return aKeys;
    }
};

///////////// END cookies.js

//GLOBALS
var showStatusMessages = false;
var WEB_SERVICE_TIMEOUT = 30000;
var waitingForResponse = false;
var useJson = false;
var useSessionStorage = true; //true - save data on the browser local storage / false - save data on the server.
var handlerMap = new Object();
var userDataId;
var cookieLifespan = 1 * 60 * 60; //default one hour
var data = {};
window.lastFocusedElement = null;
var showErrorInRequest = true;

function getHandlersByFilter(handlerMap, filter) {

    if (handlerMap == undefined) return new Array();
    return $(handlerMap).filter(function (index, handler) {
        return objFilter(handler, filter);
    });
}

//utility function, used by getHandlersByFilter
function objFilter(obj, filter) {

    result = true;
    for (key in filter) {
        result &= obj[key] == filter[key];
    }

    return result;
}

/*
 * spinner function - starts/stops spinner over html element
 * 
 * spinner.start(parentElemtId) - start spinner over parentElemtId
 * spinner.stop() - stop spinner
 * 
 */

var mobileSpinner = (function () {
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

/*
 * @Deprecated
 * spinner function - starts/stops spinner over html element
 *
 * spinner.start(parentElemtId) - start spinner over parentElemtId
 * spinner.stop() - stop spinner
 *
 */

var spinner = (function () {
    "use strict";

    var mSpin;

    var pub = {};

    pub.start = function (parentElemtId) {
        var target = document.getElementById(parentElemtId);
        mSpin = new Spinner().spin(target);
    };

    pub.stop = function () {
        mSpin.stop();
    };

    return pub;
}());

function getInputFieldsAsJson() {
    "use strict";

    var dataStr = "{\"data\":{";
    for (var index = 0; index < inputElementsArray.length; index++) {
        var itemId = inputElementsArray[index].id;
        if (itemId === null || itemId.length === 0) {
            continue;
        }
        var itemValue = inputElementsArray[index].value;
        dataStr += "\"" + itemId + "\":\"" + itemValue + "\",";
    }

    dataStr += "\"\":\"\"}}";

    return dataStr;
}

function saveInputFieldsToServer() {
    "use strict";

    $.ajax({
        url: "/ServiceManager/Macro/UserData/" + userDataId,
        type: "PUT",
        contentType: 'application/json',
        async: false,
        dataType: "text", // expected format for response
        data: getInputFieldsAsJson(),
        success: function () {
        },
        error: function () {
            //alert('Error receiving data from server');
        }
    });

}

function getUserDataFromServer() {
    "use strict";

    //get user data from server
    $.ajax({
        url: '/ServiceManager/Macro/UserData/' + userDataId,
        async: false,
        dataType: 'text',
        cache: false,
        success: function (response) {
            try {
                try {
                    response = response;
                } catch (e) {
                }
                data = JSON.parse(response).data;
            }
            catch (e) {
                data = new Object();
            }
            setUserDataValuesInFields();

        }
    });
}

function saveUserData() {
    "use strict";

    if (useSessionStorage) {
        updaeSessionDataFromHTML(collectInputElements());
    } else {
        saveInputFieldsToServer();
    }
}

var inputElementsArray = null;

function updaeSessionDataFromHTML(inputElementsArray) {
    "use strict";

    for (var index = 0; index < inputElementsArray.length; index++) {
        var itemId = inputElementsArray[index].id;
        if (itemId == null || itemId.length == 0)
            continue;
        var itemValue = inputElementsArray[index].value;
        if (useSessionStorage) {
            sessionStorage.setItem(itemId, itemValue)
        }
    }
}

function getFieldValue(key) {
    var value = $("#" + key).val();
    return (value == undefined && useSessionStorage) ?
        getSessionFieldValue(key) : cleanValue(value);
}

function removeItem(key) {
    if (useSessionStorage) {
        sessionStorage.removeItem(key);
    } else {
        data[key] = null;
    }
}

function removeItemNameContains(keyName) {
    if (useSessionStorage) {
        for (var key in sessionStorage) {
            if (key.indexOf(keyName) >= 0) {
                sessionStorage.removeItem(key);
            }
        }
    } else {

    }
}

function getSessionFieldValue(key) {
    var value = "";
    try {
        if (useSessionStorage) {
            value = sessionStorage.getItem(key);
        }
        else {
            value = data[key]
        }
    } catch (e) {
    }

    return cleanValue(value);
}

function refreshInputElements() {
    if (useSessionStorage) {
        //updaeSessionDataFromHTML(inputElementsArray);
    }
    else {
        inputElementsArray = collectInputElements();
    }
}

function addHiddenField(key, value) {
    var element = document.getElementById(key);

    if (element == null) {
        var hidden = $('<input>').attr({
            type: 'hidden',
            id: key
        });

        if (value != undefined) {
            hidden.value = value;
        }

        hidden.appendTo('body');

        refreshInputElements();

        return hidden[0];
    }
}

//collect input elements
function collectInputElements() {
    var result = new Array();

    //all input elements
    var inputArray = document.getElementsByTagName("input");

    var disallowedInputs = ['submit', 'button'];

    //get input fields of allowed types
    for (var index = 0; index < inputArray.length; index++) {
        if (disallowedInputs.indexOf(inputArray[index].type) == -1) {
            result.push(inputArray[index]);
        }
    }

    //add select elements
    var selectArray = document.getElementsByTagName("select");

    for (var index = 0; index < selectArray.length; index++) {
        result.push(selectArray[index]);
    }

    return result;
}

function getURLParameters(url) {
    var result = {};
    var searchIndex = url.indexOf("?");

    if (searchIndex == -1) {
        return result;
    }

    var sPageURL = url.substring(searchIndex + 1);
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        result[sParameterName[0]] = sParameterName[1];
    }

    return result;
}

//initialize data
$(function () {

    userDataId = docCookies.getItem("userDataId");
    if (useSessionStorage) {
        setUserDataValuesInFields();
    }
    else {
        if (userDataId != null) {
            refreshInputElements();
            getUserDataFromServer();//will put fields in the input elements as well
        }
        else { //generate new userDataId, save to cookie
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

    var creationTimestamp = $('meta[name="Creation-Timestamp"]').attr("content");

    if (creationTimestamp == undefined) {
        alert("Error: Meta tag Creation-Timestamp is missing");
    }

    var jsonFile = 'handlerMap_' + creationTimestamp + '.json';

    //load handler map from server and execute onload functions
    $.ajax({
        url: '/ServiceManager/www/json/' + jsonFile,
        //async: false,
        dataType: 'text',
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        success: function (response) {
            handlerMap = JSON.parse(response);

            // execute onload functions
            var onloadFunctions = [];
            $.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload"}));
            $.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:navigate"}));
            $.merge(onloadFunctions, getHandlersByFilter(handlerMap, {"action": "onload:function"}));
            for (var i = 0; i < onloadFunctions.length; i++) {
                executeHandler(onloadFunctions[i]);
            }

            //fire event pageInitialized
            $(document).triggerHandler("pageInitialized");

        },
        error: function () {
            alert("Error loading handler map " + jsonFile);
        }
    });


    //events handlers
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

});

function executeHandler(handler) {
    var params;

    if (handler == undefined) {
        return;
    } else if (handler["action"] == "function" || handler["action"] == "onload:function") {
        var funcName = handler['attr'];
        if (window[funcName] == undefined) {
            alert("Undefined function" + funcName);
        } else {
            window[handler['attr']].call();
        }
    } else if (handler["action"] == "webservice" || handler["action"] == "onload") {
        params = getInputFieldsAsQueryString();
        callWebService(handler['attr'], params, handler['initHandler'], handler['responseHandler'], true);
    } else if (handler["action"] == "navigate" || handler["action"] == "onload:navigate") {
        navigate(handler['attr']);
    }
}

function executeHandlerByServiceName(serviceName) {
    var handler = getHandlersByFilter(handlerMap, {"attr": serviceName})[0];

    if (handler == undefined) {
        alert("Handler not found for service name: " + serviceName)
    }

    executeHandler(handler);
}

function navigate(targetUrl) {
    saveUserData();
    window.location = targetUrl;
}

//wait for window to load before showing
$(window).load(function () {
    $('body').show();
});

function clearTextFields() {
    /*
     for (var index = 0; index < inputElementsArray.length; index++){
     if (inputElementsArray[index].type.indexOf("select")>=0)
     continue;
     var itemId = inputElementsArray[index].id;
     inputElementsArray[index].value = "";
     data[itemId] = "";
     }
     */
    $("textarea").each(function (index) {
        $(this).val("")
    });
    $("[type=text]").each(function (index) {
        $(this).val("")
    });
}
function clearInputFields() {
    $("[type=input]").each(function (index) {
        $(this).val("")
    });
}

function clearUserData() {
    if (useSessionStorage) {
        sessionStorage.clear();
    }
    else {
        for (item in data) {

            data[item] = "null";
        }
    }
}

function setNodeValue(node, value) {
    if (node == undefined) return;
    node.textContent = value;
    return;
}

function getNodeValue(node) {

    if (node == undefined) return "Undefined";
    value = node.textContent;
    if (value == undefined)
        value = node.text;
    return value;
}

function getResponseNodeValueByName(nodeName) {
    if (useJson) {
        if (window.response == null)
            return "";
        return findValues(window.response, nodeName)[0] || "";
    }
    else {
        if (window.response == null || window.response.getElementsByTagName(nodeName) == null)
            return "";
        return getNodeValue(window.response.getElementsByTagName(nodeName)[0]);
    }

}

function setResponseNodeValueByName(nodeName, nodeValue) {
    if (useJson) {
        if (window.response == null)
            return "";
        return setValues(window.response, nodeName, nodeValue);
    }
    else {
        if (window.response == null || window.response.getElementsByTagName(nodeName) == null)
            return "";
        return getNodeValue(window.response.getElementsByTagName(nodeName)[0]);
    }

}

function analyzeXml(xml, responseHandler, serviceName, populateFields) {

    if (typeof(populateFields) === "undefined") {
        populateFields = true;
    }
    //Checking for error field
    var errorMsg = getResponseNodeValueByName("Error");
    var popupMsg = getResponseNodeValueByName("PopupMessages");
    var statusBarMsg = getResponseNodeValueByName("StatusBarMessages");

    if (showStatusMessages) {
        populateStatusMessages(statusBarMsg, popupMsg, errorMsg);
    }

    //TODO: handle errors
    if (errorMsg.length > 0 && showErrorInRequest)
        alert("Error in request: " + errorMsg);

    //Handle Elements
    var elements = xml.getElementsByTagName(serviceName + "Elements")[0];
    var childNodes = undefined;
    if (elements != undefined)
        childNodes = xml.getElementsByTagName(serviceName + "Elements")[0].childNodes;
    if (childNodes == null || childNodes == undefined) {
        alert("Error parsing childNodes response");
        return;
    }
    var nodeValue = "";
    var nodeName = "";
    for (var i = 0; i < childNodes.length; i++) {
        nodeName = childNodes[i].nodeName;
        //handle namespace
        //if (nodeName.indexOf(":") > -1){
        //	nodeName = nodeName.substr(nodeName.indexOf(":") + 1);
        //}
        if (childNodes[i].childNodes.length > 0) {
            nodeValue = getNodeValue(childNodes[i].childNodes[0]);

            if (useSessionStorage == false) {
                //add to local object of data
                data[nodeName] = nodeValue;
            }
            //populate fields
            if (populateFields) {
                populateField(nodeName, nodeValue);
            }
        }
    }

    //Handle Array Items
    var tableNodes = xml.getElementsByTagName(serviceName + "ArrayItem");

    if (tableNodes.length >= 0) {
        for (var j = 0; j < tableNodes.length; j++) { //row in table
            var cells = tableNodes[j].childNodes;

            for (var k = 0; k < cells.length; k++) {
                //skip text nodes
                if (cells[k].nodeType != "1") {
                    continue;
                }

                var cellName = cells[k].nodeName;
                //handle namespace
                cellName = cellName.substr(0, cellName.lastIndexOf('_') + 1);
                cellName += j;
                var cellValue = getNodeValue(cells[k]);

                if (useSessionStorage == false) {
                    //add to user data
                    data[cellName] = cellValue;
                }

                //populate fields
                if (typeof(populateFields) === "undefined" || populateFields) {
                    populateField(cellName, cellValue);
                }
            }
        }
    }

    executeResponseHandler(responseHandler, xml, serviceName, tableNodes);
    return true;
}

function analyzeJson(json, responseHandler, serviceName, populateFields) {
    if (typeof(populateFields) === "undefined") {
        populateFields = true;
    }
    //Checking for error field
    var errorMsg = json["Response"][serviceName + "Message"]["Error"];
    var popupMsg = json["Response"][serviceName + "Message"]["PopupMessages"];
    var statusBarMsg = json["Response"][serviceName + "Message"]["StatusBarMessages"];

    if (showStatusMessages) {
        populateStatusMessages(statusBarMsg, popupMsg, errorMsg);
    }

    //TODO: handle errors
    if (errorMsg.length > 0 && showErrorInRequest)
        alert("Error in request: " + errorMsg);

    //Handle Elements
    var elements = json['Response'][serviceName + 'Elements'];

    if (typeof elements === "object" && elements != null) {
        var nodeValue = "";
        var nodeName = "";
        for (var i in elements) {
            nodeName = i;
            nodeValue = elements[i];

            if (useSessionStorage == false) {
                data[nodeName] = nodeValue;
            }
            //populate fields
            populateField(nodeName, nodeValue);
        }
    }

    //Handle Array Items
    var tableNodes = null;

    if (json["Response"][serviceName + "TableArray"] != undefined) {
        //if Object, convert to Array
        tableNodes = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    if (tableNodes != null && isArray(tableNodes)) {
        for (var j = 0; j < tableNodes.length; j++) { //row in table
            arrayItem = {};
            for (var k in tableNodes[j]) {
                var cellName = k;

                cellName = cellName.substr(0, cellName.lastIndexOf('_') + 1);
                cellName += j;
                var cellValue = tableNodes[j][k];

                if (useSessionStorage == false) {
                    //add to user data
                    data[cellName] = cellValue;
                }

                //populate fields
                if (typeof(populateFields) === "undefined" || populateFields) {
                    populateField(cellName, cellValue);
                }
            }
        }
    }

    executeResponseHandler(responseHandler, json, serviceName, tableNodes);
    return true;
}

function executeResponseHandler(responseHandler, data, serviceName, tableNodes) {
	if (responseHandler === undefined || responseHandler === '') {
		return;
	}
	
	//response handler is function
	if (responseHandler.indexOf(':') === -1) {
		if (window[responseHandler] != undefined && window[responseHandler] != null) {
		    if (typeof(window[responseHandler]) == "function")
		        window[responseHandler].call(this, data, serviceName, tableNodes);
		}
		return;
	}
	
	if (responseHandler.startsWith('popup:')) {
		var popupText = responseHandler.substring(6);
		alert(popupText);
		return;
	}
	
	if (responseHandler.startsWith('navigate:')) {
		var targetPage = responseHandler.substring(9);
		navigate(targetPage);
		return;
	}
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
 *            response - can be json or xml according to global var useJson
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebServiceWithAllParame(webService, initHandler, responseHandler, asyncFlag, populateFields) {
    var params = getInputFieldsAsQueryString();
    callWebService(webService, params, initHandler, responseHandler, asyncFlag, populateFields);
}

/**
 *
 * @param webService -    name of webservice
 * @param params -        query string
 * @param initHandler - function to be run before call to webservice,
 *                        return false to abort execution.
 *                        initHandler(serviceName)
 *
 * @param responseHandler - function to be run after webservice call,
 *                            responseHandler(response, serviceName, status)
 *            response - can be json or xml according to global var useJson
 *            serviceName - string
 *            status - one of: "success","notfound","internal","parsererror","timeout","abort","unknown"
 *
 */
function callWebService(webService, params, initHandler, responseHandler, asyncFlag, populateFields) {
    //prevent calls to webservice while waiting for response
    if (waitingForResponse) {
        return;
    }

    var webServiceUrl;

    webService = webService.trim();
    if (webService == undefined || webService == "") {
        return;
    }

    //if webService is not URL, assume it is local service
    if (webService.indexOf("/") == -1 && webService.indexOf(".") == -1
        && webService.indexOf(":") == -1) {
        webServiceUrl = "/ServiceManager/Macro/ExecMacro/" + webService;
    }
    else { //webService is assumed to be URL
        webServiceUrl = webService;
    }

    //switch to json by replacing: &json=true, dataType=json, analyzeJson
    var queryData = encodeURI(params) + '&randomSeed=' + (Math.random() * 1000000) +
        '&userDataId=' + userDataId + '&json=' + useJson;

    var serviceName = webServiceUrl.substr(webServiceUrl.lastIndexOf('/') + 1);

    //call init handler
    if (initHandler != undefined) {
        //get the function by calling window[errorHandler]
        if (window[initHandler] != undefined && window[initHandler] != null) {
            if (typeof(window[initHandler]) == "function")
                var initResult = window[initHandler].call(this, serviceName);
            if (initResult === false) {
                return; //abort execution
            }
        }
    }


    $(document).triggerHandler("sendRequest");
    waitingForResponse = true;

    $.ajax({
        url: webServiceUrl,
        type: "POST",
        timeout: WEB_SERVICE_TIMEOUT, //timeout in ms
        dataType: useJson === true ? "json" : "xml", // expected format for response
        data: queryData,
        async: typeof(asyncFlag) === 'undefined' ? true : asyncFlag,
        success: function (response, textStatus, jqXHR) {
            window.response = response;
            var errorMsg = getResponseNodeValueByName("Error");

            //service is disabled, abort
            if (errorMsg == "Service is disabled.") {
                alert(errorMsg);
                spinner.stop();
                return;
            }

            if (useJson) {
                analyzeJson(response, responseHandler, serviceName, populateFields);
            } else {
                analyzeXml(response, responseHandler, serviceName, populateFields);
            }

            $(document).triggerHandler("receiveResponse", [response, serviceName, "success", populateFields]);

        },
        error: function (jqXHR, status, error) {
            var error;
            if (jqXHR.status == 404) {
                status = "notfound";
                alert('Requested page not found. [404]');
            } else if (jqXHR.status == 500) {
                alert('Internal Server Error [500].');
                status = "internal";
            } else if (status === 'parsererror') {
                alert('Requested url parse failed.');
            } else if (status === 'timeout') {
                alert('Web Service call timed out.');
            } else if (status === 'abort') {
                alert('Ajax request aborted.');
            } else {
                alert('Uncaught Error.\n' + jqXHR.responseText);
                status = "unknown";
            }

            $(document).triggerHandler("receiveResponse", [null, serviceName, status]);

        },
        complete: function () {
            waitingForResponse = false;
        }
    });
}

function getInputFieldsAsQueryString() {
    var dataArray = new Array();
    if (useSessionStorage) {
        saveUserData();
        for (var i = 0; i < sessionStorage.length; i++) {
        	var key = sessionStorage.key(i);
        	var value = sessionStorage.getItem(key);
            if (key.indexOf("ls.") === -1 &&
                key.indexOf("serviceManagerLocalStorage.") === -1) {
                dataArray.push(key + "=" + (value === null ? "" : value));
            }
        }
    } else {
        for (var index = 0; index < inputElementsArray.length; index++) {
            var itemId = inputElementsArray[index].id;
            if (itemId == null || itemId.length == 0)
                continue;
            var itemValue = encodeURIComponent(inputElementsArray[index].value);
            dataArray.push(itemId + "=" + (itemValue.length > 0 ? itemValue : "null"));
        }
    }
    return dataArray.join("&");
}

//set or add value to input fields and to session data
function populateField(fieldName, fieldValue, fieldPostfix) {
    var fieldElement;

    if (typeof(fieldPostfix) !== 'undefined') {
        fieldElement = document.getElementById(fieldName + fieldPostfix);
    }

    if (typeof(fieldElement) === 'undefined' || fieldElement == null) {
        fieldElement = document.getElementById(fieldName);
    }

    if (typeof(fieldElement) === 'undefined' || fieldElement == null) {
        if (useSessionStorage && typeof(fieldValue) !== 'undefined') {
            sessionStorage.setItem(fieldName, fieldValue);
            sessionStorage.setItem(fieldName + fieldPostfix, fieldValue);
            return;
        } else {
            fieldElement = addHiddenField(fieldName);
        }
    }

    try {
        var nodeName = fieldElement.nodeName;

        if (typeof(fieldValue) !== "undefined") {
            if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
                fieldElement.value = fieldValue;
            } else if (nodeName == "DIV" || nodeName == "LABEL") {
                fieldElement.innerHTML = fieldValue;
            }
        }
    } catch (e) {
    }

    try {
        if (useSessionStorage) {
            sessionStorage.setItem(fieldName, fieldValue);
        } else {
            //push into inputElementsArray
            var objExist = inputElementsArray.indexOf(fieldElement);
            if (objExist < 0) {
                inputElementsArray.push(fieldElement);
            }
        }
    } catch (e) {
    }
}

//set or add value to HTML ONLY input fields
function populateFieldHTML(fieldName, fieldValue, fieldPostfix) {
    var elem;
    if (fieldPostfix != undefined)
        elem = document.getElementById(fieldName + fieldPostfix);
    if (elem == undefined)
        elem = document.getElementById(fieldName);
    if (elem == undefined || elem == null) {
        return;
    }

    try {
        var nodeName = elem.nodeName;

        if (nodeName == "INPUT" || nodeName == "TEXTAREA") {
            elem.value = fieldValue;
        }
        else if (nodeName == "DIV" || nodeName == "LABEL") {
            elem.innerHTML = fieldValue;
        }
    }
    catch (e) {
    }
}

function populateStatusMessages(statusBarMsg, popupMsg, errorMsg) {
    if (errorMsg.length > 0 && statusBarMsg.length == 0 && popupMsg.length == 0) {
        statusBarMsg = errorMsg;
        popupMsg = errorMsg;
    }

    if ($("#StatusBarMessages") != null)
        populateField("StatusBarMessages", statusBarMsg);
    if ($("#PopupMessages") != null)
        populateField("PopupMessages", popupMsg);

}

function clearStatusMessages() {

    if ($("#StatusBarMessages") != null)
        $("#StatusBarMessages").text("");
    if ($("#PopupMessages") != null)
        $("#PopupMessages").text("");

}

function setUserDataValuesInFields() {

    if (useSessionStorage) {
    	for (var i = 0; i < sessionStorage.length; i++) {
        	var key = sessionStorage.key(i);
        	var value = sessionStorage.getItem(key);
            populateFieldHTML(key, (value === null ? "" : value));
        }
    } else {
        for (var i in data) {
            populateField(i, decodeURIComponent(data[i]));
        }
    }

    /*
     for (var index = 0; index < inputElementsArray.length; index++){

     var value = "";
     var itemId = inputElementsArray[index].id;
     try{
     value = data[itemId];
     if (value === undefined && defaultValues != undefined
     && defaultValues[itemId] != undefined){
     value = defaultValues[itemId];
     }
     else if (value == null){
     value="";
     }
     else{
     value = unescape(value);
     }

     }
     catch(e)
     {value="";}

     inputElementsArray[index].value = value;
     }
     */
}
////////// POPUPS

function showAlert(alertHeader, alertTitle, alertContent, okfunction) {

    $("#popupAlert").popup({
        afterclose: function (event, ui) {
            $('#popupAlert a').off('click');
        }
    });


    $("#alertHeader").text(alertHeader);
    $("#alertTitle").text(alertTitle);
    $("#alertContent").text(alertContent);

    if (okfunction != undefined) {
        $("#popupAlert").bind({
            popupafterclose: okfunction
        });
    }

    $("#popupAlert").popup("open");


}

function showDialog(dialogHeader, dialogTitle, dialogContent, okfunction, cancelfunction) {

    $("#popupDialog").popup({
        afterclose: function (event, ui) {
            $('#popupDialog a').off('click');
        }
    });

    $("#dialogHeader").text(dialogHeader);
    $("#dialogTitle").text(dialogTitle);
    $("#dialogContent").text(dialogContent);

    $("#popupDialog").popup("open");

    $("#dialogOK").on("click", okfunction);
    $("#dialogCancel").on("click", cancelfunction);
}

/////////// LIST

/**
 * Create list: Query webservice, use result json to populate list
 *
 * @param serviceName - name of the service
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 *
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 */
function createList(serviceName, listItemTitle, selectionHandler) {

    //query web service with input parameters
    var params = getInputFieldsAsQueryString();

    var url = "/ServiceManager/Macro/ExecMacro/" + serviceName +
        "?" + params +
        "&json=true";

    //call web service
    jQuery.getJSON(encodeURI(url), function (json) {
        //populate results to list
        populateList(json, serviceName, listItemTitle, selectionHandler);
    });

}

/**
 * Populate webservice result in list
 *
 * @param json - the json result of the webservice call
 * @param serviceName - the name of the called webservice
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 */
function populateList(json, serviceName, listItemTitle, selectionHandler) {

    //Handle Array Items
    var tableNodes = null;

    //get list items from json
    if (json["Response"][serviceName + "TableArray"] != undefined) {
        //if Object, convert to Array
        tableNodes = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    populateListItems(tableNodes, listItemTitle, selectionHandler);
}

/**
 * Populate data in list
 *
 * @param data - data to be populated in list
 * @param listItemTitle - Either A> name of output field which value will be used for list-item title
 *                or B> function(outputParams, index) -
 *                        @param outputParams  - object containing selected item output params
 *                        @param index - index of item in list
 *                        return title for list item in list
 * @param selectionHandler - function(outputParams) - handler function for element pressed
 *                        @param outputParams  - object containing selected item output params
 *                        default: defaultListSelectionHandler
 *
 */

function populateListItems(listData, listItemTitle, selectionHandler) {

    //set default handler
    if (selectionHandler == null) {
        selectionHandler = defaultListSelectionHandler;
    }

    //set default title generator
    if (listItemTitle == null) {
        listItemTitle = defaultTitleGenerator;
    }

    //init list menu
    $("#listMenu").popup();
    $("#listItems").find(".lovItem").remove();

    $("#listMenu").off("click", "li")


    //add list items to lov
    if (listData != null && isArray(listData)) {
        for (var j = 0; j < listData.length; j++) { //row in table

            var liElement = $("<li/>");
            liElement.addClass("lovItem");

            for (var k in listData[j]) {
                var cellName = k;
                var cellValue = listData[j][k];
                liElement.data(cellName, cellValue);

            }

            var aElem = $("<a/>");
            aElem.attr("href", "#");
            aElem.addClass("ui-btn");
            aElem.addClass("ui-btn-icon-right");
            aElem.addClass("ui-icon-carat-r");


            if (isFunction(listItemTitle)) {
                var text = listItemTitle.call(this, liElement.data(), j);
                aElem.text(text);
            }
            else {
                //populate list-item text
                aElem.text(liElement.data(String(listItemTitle)));
            }

            liElement.append(aElem);

            $("#listItems").append(liElement);

        }
    }

    //handle item clicked
    $("#listMenu").on("click", "li",
        function () {
            $("#listMenu").popup("close");
            selectionHandler.call(this, $(this).data());
        }
    );

    $("#listMenu").popup();

    $("#listMenu").popup("open");

}

/**
 * Default function for list title generation
 * @param outputParams  - object containing selected item output params
 * @param index - index of selected list item, 0-based
 * @returns {String}
 */
function defaultTitleGenerator(outputParams, index) {
    return (index + 1) + ") " + outputParams[Object.keys(outputParams)[0]];
}

/**
 * Populate data fields of selected item to input fields
 *
 * @param selected - object containing selected item output params
 */
function defaultListSelectionHandler(selected) {
    for (inputId in selected) {
        var value = selected[inputId];
        populateFieldHTML(inputId, value);
    }
}

function createSelectObject(fieldID) {
    var selectObj = document.getElementById(fieldID);

    if (selectObj.type.indexOf('select') < 0) {
        var newSelect = document.createElement('select');
        newSelect.id = fieldID;
        var parent = selectObj.parentNode;

        if (parent.className.indexOf("ui-input-text") > -1) {
            var temp = selectObj.parentNode;
            selectObj.parentNode.parentNode.replaceChild(newSelect, temp);
        }
        else {
            selectObj.parentNode.replaceChild(newSelect, selectObj);

        }

        selectObj.id = fieldID;
        selectObj = newSelect;
    }
    //remove previous elements
    selectLength = selectObj.length
    for (i = 0; i < selectLength; i++) {
        selectObj.remove(0);
    }

    return selectObj;
}

function populateSelectItems(tableNodes, fieldID) {
    var selectObj = createSelectObject(fieldID)

    if (tableNodes != null && isArray(tableNodes) && tableNodes[0] != undefined) {
        keyName = Object.keys(tableNodes[0]);
        for (var j = 0; j < tableNodes.length; j++) {
            var optionArray = tableNodes[j][keyName].split(',')
            var option = document.createElement('option');
            option.value = optionArray[0];
            option.textContent = optionArray[1];

            if (option.textContent != undefined && option.textContent.trim() != "")
                selectObj.appendChild(option);
        }
    }
    return selectObj;
}

function populateSelect(json, serviceName, fieldID, onChangeFunc, defaultIndex) {
    //Handle Array Items
    var tableNodes = null;

    //get list items from json
    if (json["Response"][serviceName + "TableArray"] != undefined) {
        //if Object, convert to Array
        tableNodes = [].concat(json["Response"][serviceName + "TableArray"][serviceName + "ArrayItem"]);
    }

    var selectObj = populateSelectItems(tableNodes, fieldID);
    if (defaultIndex != undefined) {
        $(selectObj).selectedIndex = defaultIndex;
    }
    else {
        $(selectObj).selectedIndex = 0;
    }

    $(selectObj).selectmenu();
    $(selectObj).selectmenu("refresh");
    $(selectObj).change(onChangeFunc);
}

/**
 * createSelect: Query webservice, use result json to populate select object
 *
 * @param serviceName - name of the service
 * @param fieldID - name of output field which the select would be populated into
 * @param onChangeFunc - (optional) onchange function handler
 * @param defaultIndex - (optional) - index to be selected - default: 0
 */
function createSelect(serviceName, fieldID, onChangeFunc, defaultIndex) {
    if ($("#" + fieldID) == null) return;

    //query web service with input parameters
    var params = getInputFieldsAsQueryString();

    var url = "/ServiceManager/Macro/ExecMacro/" + serviceName +
        "?" + params +
        "&json=true";

    //call web service
    jQuery.getJSON(encodeURI(url), function (json) {
        //populate results to list
        populateSelect(json, serviceName, fieldID, onChangeFunc, defaultIndex);
    });
}

////////// GPS

// get location from GPS and pass results to callback function
// Object example: {street_number: "12", route: "Rambam Street", locality: "Tel Aviv", administrative_area_level_1: "Tel Aviv District", country: "Israel"} 
function getLocation(callback) {
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    var onSuccess = populatePosition.bind(this, callback);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onSuccess, null, options);
    } else {
        msg = "Geolocation is not supported by this browser.";
        alert(msg)
    }
}

function populatePosition(callback, position) {

    var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&language=en&sensor=false";
    jQuery.getJSON(url, function (json) {
        var res = {};

        //normalize google repsponse
        $.each(json['results'][0]['address_components'], function (i, elem) {
            res[elem['types'][0]] = elem['long_name']
        });

        callback(res);
    });

}

////////// LOV

var lov;

//initialize event listeners
$(function () {
    //LOV key listener
    $(document).keyup(function (e) {
        var keyId = e.which;
        if (lov != undefined && lov.isShowingLov()) {
            if (keyId == 38) { //UP
                lov.changeLovItemSelection(false);
                e.preventDefault();
            } else if (keyId == 40) { //DOWN
                lov.changeLovItemSelection(true);
                e.preventDefault();
            } else if (keyId == 13) { //ENTER
                lov.select();
                e.preventDefault();
                lov = undefined;
            }
        }
    });

    //handle on-click event for buttons
    $("input[type='button']").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }

    });

    //handle on-click event for buttons
    $("button").on("click", function () {
        var buttonId = $(this).attr('id');
        var handlers = getHandlersByFilter(handlerMap, {"element": buttonId});

        for (var i = 0; i < handlers.length; i++) {
            executeHandler(handlers[i]);
        }
    });

    //handle key-down event
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
    });

});

function appendLovDiv() {
    //first div style is enclosing whole window
    //copy style to new LOV div
    var style = $("body div:first").attr("style");
    var lovDiv = $("<div>");
    lovDiv.attr("id", "LOV");
    lovDiv.attr("style", style);
    lovDiv.css("z-index", 1005);
    lovDiv.css("display", "none");

    //append LOV table
    lovDiv.append(
        $("<table>")
            .css("width", "80%")
            .css("margin", "auto")
            .append(
                $("<tbody>")
            )
    );

    $("body").append(lovDiv);

    //add css for LOV to head
    $("<style>" +
        "#LOV { " +
        "color: black; " +
        "background-color:white;" +
        "display:none;" +
        "} " +
        "#LOV .selected{ " +
        "color:white;" +
        "background-color: black;" +
        "}" +
        "#LOV table{ " +
        "border-width: 2px;" +
        "border: solid;" +
        "}" +
        "#LOV table caption{ " +
        "border-width: 2px 2px 0px 2px !important;" +
        "border: solid;" +
        "}" +
        "</style>").appendTo('head');
}

/**
 * Shows List of Values select options
 * @param {Object} options, String map of value to description pairs
 * @param {String} caption, a Caption for the LOV window
 * @param {Function} callback, function to be called after LOV selection is made
 *
 * Example:
 *        prepareLOV("someLOV",
 *                   "USERNAME_0_container"
 *                   {
 *                    "A":"Avocado",
 *                    "B":"Banana",
                      "C":"Cabbage"
                     },
 *                   "Vegetables",
 *                   alert("Done!"));
 *
 */
function prepareLOV(lovId, containerId, elementId, options, caption, callback) {
    lov = new LOV(lovId, elementId);

    if (caption != undefined) {
        lov.setCaption(caption);
    }

    lov.setItemsToLov(options);
    lov.registerItemClickEvents();
    lov.toggleLov();
    lov.select = lov.select.bind(lov, callback);
    lov.reresh();

    return lov;
}

function createLovElement(lovId, containerId) {
    var lovPopup = $("<div>");
    lovPopup.attr("id", lovId);
    lovPopup.attr("data-role", "popup");

    var lovElement = $("<ul>");
    lovElement.attr("data-role", "listview");
    lovElement.attr("data-filter", "true");
    lovElement.attr("data-filter-placeholder", "Find Value..");
    lovElement.attr("data-filter-theme", "b");

    $("#" + containerId).append(lovPopup);
}

var LOV = function (lovId, elementId) {
    var self = this;
    this.selectedLovIndex = null;
    this.lovId = lovId;
    this.elementId = elementId;

    this.initLov = function () {
        this.resetSelection();
    };

    this.changeLovItemSelection = function (down) {
        var lovSize = this.countItemsInLov();

        var selectedItem = $("#LOV tbody tr")[this.selectedLovIndex];
        $(selectedItem).removeClass("selected");

        if (down) {
            this.selectedLovIndex++;
            if (this.selectedLovIndex == lovSize) {
                this.selectedLovIndex = 0;
            }
        } else {
            this.selectedLovIndex--;
            if (this.selectedLovIndex == -1) {
                this.selectedLovIndex = lovSize - 1;
            }
        }

        selectedItem = $("#LOV tbody tr")[this.selectedLovIndex];
        $(selectedItem).addClass("selected");
    };

    this.getSelectedItemValue = function () {
        return this.getLovItemValue(this.selectedLovIndex);
    };

    this.countItemsInLov = function () {
        return $("#LOV tbody tr").length;
    };

    this.setItemsToLov = function (obj) {
        this.clearLovTable();
        for (var key in obj) {
            this.addItemToLov(key, obj[key]);
        }

        this.refresh();
    };

    this.setCaption = function (caption) {
        $("#LOV table caption").remove();
        $("#LOV table").append("<caption>" + caption + "</caption>");
    };

    this.clearLovTable = function () {
        $("#LOV tbody").empty();
    };

    this.addItemToLov = function (key, value) {
        var lovElement = $("#" + this.lovId);
        var lovListElement = lovElement.children("ul");

        var lovListItem = $("<li>");
        var valueElement = $("<a>");
        valueElement.append(value);
        valueElement.addClass(lovId + "_item");
        lovListItem.append(valueElement);

        lovListElement.append(lovListItem);
    };

    this.registerItemClickEvents = function () {
        $("." + lovId + "_item").click(function () {
            var chosenElement = $(this);
            chosenElement.addClass("selected");

            var itemValue = chosenElement[0].innerHTML;
            var converter = window["convert_" + self.elementId + "_lov"];
            var convertedValue = typeof(converter) !== "undefined" ? converter(itemValue) : itemValue;
            $("#" + self.elementId).val(convertedValue);
            $("#" + lovId).addClass("ui-screen-hidden");
        });
    };

    this.getLovItemValue = function (index) {
        return $("#LOV_key_" + index).text();
    };

    this.resetSelection = function () {
        if (this.countItemsInLov() > 0) {
            $($("#LOV tbody tr")[this.selectedLovIndex]).removeClass("selected");
            this.selectedLovIndex = 0;
            $($("#LOV tbody tr")[this.selectedLovIndex]).addClass("selected");
        }
    };

    this.toggleLov = function () {
        $("#LOV").toggle();
        this.resetSelection();
    };

    this.refresh = function () {
        $(document).on('pagebeforeshow', '#mainPage', function () {
            var lovElement = $("#" + lovId);
            var lovListElement = lovElement.children("ul");
            lovListElement.listview('refresh');
        });
    };

    this.isShowingLov = function () {
        return $("#LOV").css("display") == "block";
    };

    this.select = function (callback) {
        $("#" + this.targetId).val(this.getSelectedItemValue());
        this.toggleLov();

        if (typeof(callback) !== "undefined") {
            callback();
        }
    };
};

var mobileLov;
/**
 * Shows List of Values select options
 * @param {Object} options, String map of value to description pairs
 * @param {String} caption, a Caption for the LOV window
 * @param {Function} callback, function to be called after LOV selection is made
 *
 * Example:
 *        prepareLOV({
 *                      lovId: "someLov",
 *                      triggerId: "someTrigger",
 *                      elementId: "someElement",
 *                      webService: "http://ec2-54-184-135-202.us-west-2.compute.amazonaws.com:9001/forms/frmservlet?config=ComplexScenario"
 *        });
 *
 */

function prepareMobileLOV(options) {
    mobileLov = new MobileLOV(options);

    if (typeof(caption) !== "undefined") {
        mobileLov.setCaption(caption);
    }

    mobileLov.init(options);

    return mobileLov;
}

var MobileLOV = function (options) {
    var self = this;
    this.selectedLovIndex = null;
    this.lovId = options.lovId;
    this.triggerId = options.triggerId;
    this.elementId = options.elementId;
    this.requestPreparer = options.requestPreparer;
    this.itemPresenter = options.itemPresenter;
    this.itemHandler = options.itemHandler;
    this.arrayItems = [];

    this.init = function (options) {
        self.registerTriggerEvents(options);
    };

    this.getSelectedItemValue = function () {
        return this.getLovItemValue(this.selectedLovIndex);
    };

    this.setItemsToLov = function (arrayItemValues) {
        if (typeof(arrayItemValues) !== "undefined") {
            arrayItemValues.forEach(function (arrayItemValue, arrayItemIndex) {
                self.addItemToLov(arrayItemIndex, arrayItemValue);
            });
        }

        self.registerItemClickEvents();
    };

    this.addItemToLov = function (key, value) {
        var lovElement = $("#" + self.lovId);
        var lovListElement = lovElement.children("ul");

        var lovListItem = $("<li>");

        var valueElement = $("<a>");
        valueElement.append(value);
        valueElement.addClass(self.lovId + "_item");
        valueElement.attr("id", self.lovId + "_" + key);

        lovListItem.append(valueElement);

        lovListElement.append(lovListItem);

        lovListElement.listview().listview('refresh');
    };

    this.registerItemClickEvents = function () {
        $("." + self.lovId + "_item").click(function () {
            var chosenElement = $(this);
            chosenElement.addClass("selected");

            var arrayItemIndex = parseInt(chosenElement[0].id.split(self.lovId + "_")[1]);
            var arrayItemHandler = window[self.itemHandler];

            if (typeof(arrayItemHandler) !== "undefined") {
                arrayItemHandler(self.getArrayItem(arrayItemIndex));
            }

            self.hide();
        });
    };

    this.registerTriggerEvents = function (options) {
        $("#" + this.triggerId).click(function () {
            self.hide();
            callWebService(options.webService, prepareParams(), undefined, handleLovResponse, true, false);
        });
    };

    function prepareParams() {
        if (typeof(window[self.requestPreparer]) !== "undefined") {
            var inputParams = window[self.requestPreparer]();
            var inputParamArray = [];

            for (var paramName in inputParams) {
                if (inputParams.hasOwnProperty(paramName)) {
                    inputParamArray.push(paramName + "=" + inputParams[paramName]);
                }
            }

            return inputParamArray.join("&");
        } else {
            return "";
        }
    }

    function handleLovResponse(response, serviceName, arrayItems) {
        if (typeof(window[self.itemPresenter]) !== "undefined") {
            self.arrayItems = arrayItems;
            var arrayItemValues = arrayItems.map(window[self.itemPresenter]);
            self.clear();
            self.setItemsToLov(arrayItemValues);
        }

        self.show();
    }

    this.show = function () {
        $("#" + self.lovId).listview().show();
    };

    this.hide = function () {
        $("#" + self.lovId).listview().hide();
        $("#" + self.lovId).popup("close");
    };

    this.refresh = function () {
        var lovElement = $("#" + self.lovId);
        var lovListElement = lovElement.children("ul");
        lovListElement.listview().listview('refresh');
    };

    this.clear = function () {
        var lovElement = $("#" + self.lovId);
        var lovListElement = lovElement.children("ul");
        lovListElement.empty();
        lovListElement.append();
    };

    this.getArrayItem = function (arrayItemIndex) {
        return self.arrayItems[arrayItemIndex];
    };
};

//UTILITY

function isArray(o) {
    if (o == undefined) return false;
    return Object.prototype.toString.call(o) === '[object Array]';
}

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function setValues(obj, key, value) {
    return setValuesHelper(obj, key, value);
}

function setValuesHelper(obj, key, value) {
    if (!obj) return;
    if (obj instanceof Array) {
        for (var i in obj) {
            setValuesHelper(obj[i], key, value);
        }
        return;
    }

    if (obj[key]) obj[key] = value;

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                setValuesHelper(obj[children[i]], key, value);
            }
        }
    }
}

function findValues(obj, key) {
    return findValuesHelper(obj, key, []);
}

function findValuesHelper(obj, key, list) {
    if (!obj) return list;
    if (obj instanceof Array) {
        for (var i in obj) {
            list = list.concat(findValuesHelper(obj[i], key, []));
        }
        return list;
    }
    if (obj[key]) list.push(obj[key]);

    if ((typeof obj == "object") && (obj !== null)) {
        var children = Object.keys(obj);
        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                list = list.concat(findValuesHelper(obj[children[i]], key, []));
            }
        }
    }
    return list;
}

function getResponseNodeListValueByName(nodeName) {
    if (useJson) {
        if (window.response == null)
            return "";
        return findValues(window.response, nodeName);
    }
    else {
        if (window.response == null || window.response.getElementsByTagName(nodeName) == null)
            return "";
        var nodeList = window.response.getElementsByTagName(nodeName);
        var nodeArray = [];
        for (i = 0; i < nodeList.length; i++) {
            nodeArray.push(getNodeValue(nodeList[i]));
        }
        return nodeArray;
    }
}

//if the value does not exist return empty string
//trim the white spaces from the value. trim
function cleanValue(val) {
    try {
        val = val.trim();
    } catch (e) {
        val = "";
    }
    return val;
}
