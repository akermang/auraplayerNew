function clearTextFields() {
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

function clearOutputFields() {
    if (showStatusMessages) {
        clearStatusMessages();
    }
    
    $(".output_value").val("");		// clear the regular fields
    var table = document.getElementById('tableOutput');		// clear output table

    if (table != null) {
        for (var i = table.rows.length - 1; i > 0; i--) {
            table.deleteRow(i);
        }
    }
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

function _populateCheckboxHTML(fieldElement, fieldValue) {
	fieldElement.checked = ("" + fieldValue == "true");
	fieldElement.previousSibling.className = fieldElement.previousSibling.className.replace("ui-checkbox-on", "").replace("ui-checkbox-off", "");
	fieldElement.previousSibling.className += (fieldElement.checked ? "ui-checkbox-on" : "ui-checkbox-off");
}

function _applyConverterFunction(fieldId, fieldValue) {
	var converter = window['convert_' + fieldId];
	return typeof converter === "function" ? converter(fieldValue) : fieldValue;
}

function _populateFieldCommon(fieldElement, fieldValue) {
	try {
        var nodeName = fieldElement.nodeName;
    	if (nodeName === "INPUT") {
    		if (fieldElement.type === "checkbox") {
    			_populateCheckboxHTML(fieldElement, fieldValue);
    		} else {
    			fieldElement.value = fieldValue;
    		}
    	} else if (nodeName === "TEXTAREA") {
            fieldElement.value = fieldValue;
        } else if (nodeName === "DIV" || nodeName === "LABEL") {
            fieldElement.innerHTML = fieldValue;
        } else if (nodeName === "A") {
        	
        	if (fieldElement.href.indexOf("tel:") === 0) {
        		fieldElement.innerHTML = fieldValue;
        		fieldElement.href = "tel:" + fieldValue;
        	} else { //link
        		fieldElement.innerHTML = _applyConverterFunction(fieldElement.id, fieldValue);
        		fieldElement.href = fieldElement.innerHTML;
        	}
        }
    } catch (e) {}
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

    if (typeof(fieldValue) !== "undefined") {
    	_populateFieldCommon(fieldElement, fieldValue);
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
    } catch (e) {}
}

//set or add value to HTML ONLY input fields
function populateFieldHTML(fieldName, fieldValue, fieldPostfix) {
    var fieldElement;
    if (fieldPostfix != undefined)
        fieldElement = document.getElementById(fieldName + fieldPostfix);
    if (fieldElement == undefined)
        fieldElement = document.getElementById(fieldName);
    if (fieldElement == undefined || fieldElement == null) {
        return;
    }
    _populateFieldCommon(fieldElement, fieldValue);
}

function setDefaultValues() {
	if (defaultValues === undefined) {
		return;
	}
    for (var paramName in defaultValues) {
    	if (getSessionFieldValue(paramName, false) !== null) {
    		continue;
    	}
        var paramInfo = defaultValues[paramName];
        try {
            var paramElement = $('#' + paramName);
            if (paramInfo.type === 'checkbox') {
                paramElement.attr('checked', paramInfo.value).checkboxradio("refresh");
            } else if (paramInfo.type === 'slider') {
                paramElement.val(paramInfo.value).flipswitch('refresh');
            } else if (paramInfo.type === 'date') {
                paramElement.datepicker();
                paramElement.datepicker("option", "dateFormat", paramInfo.value.format);
                paramElement.datepicker().datepicker("setDate", paramInfo.value.dateValue);
            } else {
                populateFieldHTML(paramName, paramInfo.value);
            }
        }
        catch (e) {
        }
    }
}

function setUserDataValuesInFields() {
    if (useSessionStorage) {
    	for (var i = 0; i < sessionStorage.length; i++) {
        	var key = sessionStorage.key(i);
        	var value = sessionStorage.getItem(key);
            populateFieldHTML(key, (value === "null" ? "" : value), '_output');
        }
    } else {
        for (var i in data) {
            populateField(i, decodeURIComponent(data[i]));
        }
    }
}

function getInputFieldsAsJson() {
    "use strict";

    var dataStr = "{\"data\":{";
    for (var index = 0; index < inputElementsArray.length; index++) {
    	var inputElement = inputElementsArray[index];
        var itemId = inputElement.id;
        if (itemId === null || itemId.length === 0) {
            continue;
        }
        var itemValue = (inputElement.type === "checkbox" ? inputElement.checked : inputElement.value);
        dataStr += "\"" + itemId + "\":\"" + itemValue + "\",";
    }

    dataStr += "\"\":\"\"}}";

    return dataStr;
}

var inputElementsArray = null;


function getFieldValue(key) {
	var element = $("#" + key);
	var value;
	if (element.length > 0) {
		value = element.is("input") ? 
    			(element[0].type === "checkbox" ? element[0].checked : element.val()) :
    			element.text();
	}
    return  (value == undefined && useSessionStorage) ?
    		getSessionFieldValue(key) : cleanValue(value);
}

function refreshInputElements() {
    if (useSessionStorage) {
        //updateSessionDataFromHTML(inputElementsArray);
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

//remove output fields that have input field with same name
function removeDuplicatedFields() {
    var duplicatedFields = $(".requestField input").filter(function (index, elem) {
        return $(".responseField #" + elem.id).length > 0;
    });

    $(duplicatedFields).each(function (index, duplicatedField) {
        $(".responseField  #" + duplicatedField.id).closest('.responseField ').remove();
    });

    refreshInputElements();
}

function collectInputElements() {
    var result = new Array();

    //all input elements
    var inputArray = document.getElementsByTagName("input");

    var disallowedInputs = ['submit', 'button', 'file'];

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

function getResponseNodeValueByName(nodeName, response) {
    if (window.response == null && response == null) {
        return "";
    } else if (typeof response === 'undefined' || response == null) {
        response = window.response;
    }

    return findValues(response, nodeName)[0] || "";
}

function setResponseNodeValueByName(nodeName, nodeValue) {
    if (window.response == null)
        return "";
    return setValues(window.response, nodeName, nodeValue);
}

function getResponseNodeListValueByName(nodeName) {
    if (window.response == null)
        return "";
    return findValues(window.response, nodeName);
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

function validateRequiredFields() {
	if ($('#responseForm')[0] === undefined) {
		return;
	}

	if ($('#responseForm')[0].checkValidity()) {
    	$('button').prop('disabled', false);  
	} else {
    	$('button').prop('disabled', 'disabled');
	}
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

function getNameWoIndexLength(fieldName) {
	return fieldName.indexOf('_') !== -1 ? fieldName.lastIndexOf('_') : fieldName.length;
}
