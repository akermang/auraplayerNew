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
