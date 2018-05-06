function saveInputFieldsToServer() {
    "use strict";

    $.ajax({
        url: getServiceManagerHost() + "/ServiceManager/Macro/UserData/" + userDataId,
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
        url: getServiceManagerHost() + '/ServiceManager/Macro/UserData/' + userDataId,
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
        updateSessionDataFromHTML(collectInputElements());
    } else {
        saveInputFieldsToServer();
    }
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

function updateSessionDataFromHTML(inputElementsArray) {
    "use strict";

    for (var index = 0; index < inputElementsArray.length; index++) {
    	var inputElement = inputElementsArray[index];
        var itemId = inputElement.id;
        if (itemId == null || itemId.length == 0)
            continue;
        var itemValue = (inputElement.type === "checkbox" ? inputElement.checked : inputElement.value);
        if (useSessionStorage) {
            sessionStorage.setItem(itemId, itemValue)
        }
    }
}

function store(fieldName, fieldValue) {
	if (useSessionStorage) {
        sessionStorage.setItem(fieldName, fieldValue);
    } else {
    	data[fieldName] = fieldValue;
    }
}

function storeFromIndex(fieldName, index) {
	var indexedFieldName = fieldName.substr(0, getNameWoIndexLength(fieldName)) + '_' + index;
	var fieldValue = getSessionFieldValue(indexedFieldName);
	store(fieldName, fieldValue);
}

function clearArrayKeysInSessionStorage(array) {
	for (var key in array[0]) {
		removeItem(key);
		
		var keyNameWoIndex = key.substr(0, getNameWoIndexLength(key));
		var i = 0,
			key = keyNameWoIndex + '_0';
		while (i === 0 || containsKey(key)) {
			removeItem(key);
			i++;
			key = keyNameWoIndex + '_' + i;
		}
	}
}

function storeArrayInSessionStorage(array) {
	if (array == null || !isArray(array)) {
		return;
	}
	
	clearArrayKeysInSessionStorage(array);
	
	for (var i = 0; i < array.length; i++) {
		var arrayRow = array[i]; 
        if (arrayRow == undefined) {
        	continue;
        }

        for (var key in arrayRow) {
            var indexedKey = key.substr(0, getNameWoIndexLength(key)) + '_' + i;
            
            data[indexedKey] = arrayRow[key];
            if (useSessionStorage == true) {
                sessionStorage.setItem(indexedKey, arrayRow[key]);
            }
            
            if (i === 0 && !/_0$/.test(key)) {	//!key.endsWith('_0')
            	data[key] = arrayRow[key];
                if (useSessionStorage == true) {
                    sessionStorage.setItem(key, arrayRow[key]);
                }
            }
        }
    }
}

function containsKey(key) {
	if (useSessionStorage) {
        return (sessionStorage.getItem(key) !== null);
    } else {
        return (key in data);
    }
}

function getSessionFieldValue(key, shouldTrimValue) {
    var value = "";
    try {
        if (useSessionStorage) {
            value = sessionStorage.getItem(key);
        }
        else {
            value = data[key];
        }
    } catch (e) {}

    return shouldTrimValue === false ? value : cleanValue(value);
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
    }
}
