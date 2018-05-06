/**
 * Get array of the field IDs serving as columns.
 */
function getTableColumnsMetadata() {
	var tableOutputHead = document.getElementById("tableOutputHead");
	if (tableOutputHead == null) {
		return null;
	}
	
	var $ = [];
	var tdElements = tableOutputHead.getElementsByTagName('th');
	for(var i = 0; i < tdElements.length; i++) {
		$.push({id: tdElements[i].id, displayFormat: tdElements[i].getAttribute('display-format')});
	}
	return $;
}

/**
 * Insert a new row to table, and populate it with values from local storage.
 * The fields index will be the row index.
 * Meaning, when populating parameter S_CUSTOMER_ID_0 for row number 4, the value
 * will be evaluated as sessionStorage[S_CUSTOMER_ID_4]. 
 * @param rowIndex number of row in table.
 */
function populateTableRow(tableOutputBody, columnsMetadata, rowIndex) {
	var rowCount = tableOutputBody.rows.length;
	var row = tableOutputBody.insertRow(rowCount);
	
	for (var i in columnsMetadata) {
    	var cellName = columnsMetadata[i].id;
    	var cellNameWithIdx = cellName.substr(0, getNameWoIndexLength(cellName)) + '_' + rowIndex;
    	var cellValue = formatTableValue(columnsMetadata[i].displayFormat, sessionStorage[cellNameWithIdx]);
    	
    	var cell;
    	if (row.cells.length == 0) {
            cell = document.createElement('td');
            row.appendChild(cell);
        } else {
            cell = row.insertCell(-1);
        }
    	cell.innerHTML = cellValue;
    }
}

/**
 * Insert rows to table according to sessionStorage.
 */
function populateTable(tableOutputBody) {
	if (tableOutputBody == null) {
		return;
	}
	
	var columnsMetadata = getTableColumnsMetadata();
	if (columnsMetadata == null) {
		return;
	}
	
	clearAllTableRows();
	
	var lastIndex = getHighestIndex(columnsMetadata[0].id);
	for (var i = 0; i <= lastIndex; i++) {
		populateTableRow(tableOutputBody, columnsMetadata, i);
	}
}

function clearAllTableRows() {
	if (tableOutputBody == null) {
		return;
	}
	
	while(tableOutputBody.rows.length > 0) {
		tableOutputBody.deleteRow(0);
	}
}

/****************************
 *** onLoad *****************
 ****************************/

function addTableClickListener() {
	$('#tableOutput').on('click','td', function(e){
		var row = e.currentTarget.parentElement.rowIndex - 1;	//first row is the table header
		var col = e.currentTarget.cellIndex;
		
		var rowCells = [];
		var domCells = e.currentTarget.parentElement.cells;
		for (var i = 0; i < domCells.length; i++) {
			rowCells.push(domCells[i].innerText);
		}
		
		executeTableOnClickHandlers(row, col, rowCells);
	});
}
