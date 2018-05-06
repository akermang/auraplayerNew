/****************************
 *** Common *****************
 ****************************/

/**
 * Get the highest index existing for a parameter 
 * @param fieldName
 */
function getHighestIndex(fieldName) {
	var $ = -1;
	var fieldNameWoIndex = fieldName.substr(0, getNameWoIndexLength(fieldName));
	
	for (var key in sessionStorage) {
        var keyWoIndex = key.substr(0, getNameWoIndexLength(key));
        
		if (keyWoIndex === fieldNameWoIndex) {
			var index = +key.substr(key.lastIndexOf('_') + 1);
			if (index > $) {
				$ = index;
			}
		}
	}
	return $;
} 

function executeTableOnClickHandlers(row, col, rowCells) {
	var onTableClickHandlers = [];
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:webservice"}));
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:navigate"}));
    $.merge(onTableClickHandlers, getHandlersByFilter(handlerMap, {"action": "tableClick:function"}));
    for (var i = 0; i < onTableClickHandlers.length; i++) {
        executeHandler(onTableClickHandlers[i], row, col, rowCells);
    }
}

function formatTableValue(displayFormat, value) {
	return  !!displayFormat && displayFormat.indexOf('%s') !== -1 ?
			displayFormat.replace('%s', value):
			value;
}

/****************************
 *** table-list selectors ***
 ****************************/

var hasTable, hasList;
var tableOutputBody, listOutput;

function populateTableOrList() {
	if (hasTable) {
		populateTable(tableOutputBody);
	} else if (hasList) {
		populateTableListLayout(listOutput);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function initTableOrListFlags() {
	tableOutputBody = document.getElementById("tableOutputBody");
	listOutput = document.getElementById("listOutput");
	
	hasTable = (tableOutputBody != null);
	hasList = (listOutput != null);
}

function addTableOrListClickListener() {
	if (hasTable) {
		addTableClickListener();
	} else if (hasList) {
		addTableListLayoutClickListener();
	}
}
