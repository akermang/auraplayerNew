/**
 * Get array of the field IDs serving as columns.
 */
function getListColumnsMetadata() {
	var listOutputHead = document.getElementById("listOutputHead");
	if (listOutputHead == null) {
		return null;
	}
	
	var $ = [];
	var columnElements = listOutputHead.getElementsByTagName('div');
	for(var i = 0; i < columnElements.length; i++) {
		$.push({id: columnElements[i].id, displayFormat: columnElements[i].getAttribute('display-format')});
	}
	return $;
}

/**
 * Insert a new row to list, and populate it with values from local storage.
 * The fields index will be the row index.
 * Meaning, when populating parameter S_CUSTOMER_ID_0 for row number 4, the value
 * will be evaluated as sessionStorage[S_CUSTOMER_ID_4]. 
 * @param rowIndex number of row in table.
 */
function populateTableListLayoutRow(listOutput, columnsMetadata, rowIndex) {
	var rowColumnValues = "";
	
	for (var i in columnsMetadata) {
    	var cellName = columnsMetadata[i].id;
    	var cellNameWithIdx = cellName.substr(0, getNameWoIndexLength(cellName)) + '_' + rowIndex;
    	var cellValue = formatTableValue(columnsMetadata[i].displayFormat, sessionStorage[cellNameWithIdx]);
    	
    	var alphabeticalIndex = String.fromCharCode("a".charCodeAt(0) + (+i % 2));
    	rowColumnValues += 
    		"<div" + (+i >= 2 ? " style=\"font-weight:normal\"" : "") + " class=\"ui-block-" + alphabeticalIndex +"\">\n" + 
    		"	" + cellValue + "\n" +
    		"</div>\n";
	}
	
	var liClass = columnsMetadata.length == 1 ? "ui-grid-solo" : "ui-grid-a";
	listOutput.innerHTML += 
		"<li><a href=\"#\" class=\"ui-btn ui-btn-icon-right ui-icon-carat-r\">\n" +
		"	<div class=\"" + liClass + "\">\n" +
		"		" + rowColumnValues +
		"	\n</div>\n" +
		"</a></li>";
}

function clearAllTableListLayoutRows() {
	if (listOutput == null) {
		return;
	}
	
	var numOfDataChildren = listOutput.childElementCount - 1;
	for (var i = 0; i < numOfDataChildren; i++) {
		listOutput.removeChild(listOutput.lastElementChild);
	}
}

/**
 * Insert rows to list according to sessionStorage.
 */
function populateTableListLayout(listOutput) {
	if (listOutput == null) {
		return;
	}
	
	var columnsMetadata = getListColumnsMetadata();
	if (columnsMetadata == null) {
		return;
	}
	
	clearAllTableListLayoutRows();
	
	var lastIndex = getHighestIndex(columnsMetadata[0].id);
	for (var i = 0; i <= lastIndex; i++) {
		populateTableListLayoutRow(listOutput, columnsMetadata, i);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function calculateIndexInParent(element){
    var i = 0;
    while ((element = element.previousElementSibling) != null) {
    	i++;
    }
    return i;
}

function addTableListLayoutClickListener() {
	$('#listOutput').on('click','li', function(e){
		var row = calculateIndexInParent(e.currentTarget) - 1;	//first row is the table header
		var col = 0;	//list doesn't have meaning to columns. 
		
		var rowCells = [];
		var domCells = e.currentTarget.children[0].children[0].children;
		for (var i = 0; i < domCells.length; i++) {
			rowCells.push(domCells[i].innerText);
		}
		
		executeTableOnClickHandlers(row, col, rowCells);
	});
}
