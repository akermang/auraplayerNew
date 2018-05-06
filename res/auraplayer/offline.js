/*********************************
 *** Is supported / get config ***
 *********************************/
var offlineRequestsTableData;

function checkOfflineSupport() {
	if (typeof(Storage) === "undefined") {
		showInfoPopup('Offline Support', 'LocalStorage is not supported by your browser, offline capabilities malfunction.');
	}
}

function getOfflineConfig(serviceName) {
	var allConfig = typeof(offlineConfig) !== "undefined" && offlineConfig instanceof Array ? offlineConfig : [];
	for (var i = 0; i < allConfig.length; i++) {
		if (allConfig[i].service === serviceName) {
			return allConfig[i];
		}
	}
	return {};
}

/*********************************
 *** Handler *********************
 *********************************/

function invokeOfflineHandler(serviceName, url, query) {
	var config = getOfflineConfig(serviceName);
	switch (config.action) {
	case 'ERROR':
		showInfoPopup('Offline', 'Please try again later.');
		break;
	case 'SYNC_LATER':
		storeOfflineRequest(getPageName(), serviceName, url, query);
		break;
	case 'STORAGE_THEN_LIVE':
		// will never get here
		break;
	case 'LIVE_THEN_STORAGE':
		
		break;
	default:
	}
}

function getPageName() {
	var $ = window.location.pathname.split("/").pop();
	return  $.indexOf('#') !== -1 ?	$ = $.substring(0, $.indexOf('#')) : $;
}

/*********************************
 *** Sync ************************
 *********************************/

function syncOfflineRequest(index) {
	alert('syncOfflineRequest' + index);
}

function syncAllOfflineRequests() {
	alert('syncAllOfflineRequests');
}

/*********************************
 *** Request *********************
 *********************************/

function getFirstOfflineReqIndex() {
	var index = localStorage['offlineReq_start'];
	return index !== undefined ? +index : 0;
}

function getLastOfflineReqIndex() {
	var index = localStorage['offlineReq_end'];
	return index !== undefined ? +index : -1;
}

function storeOfflineRequest(pageName, serviceName, url, query) {
	var nextIndex = getLastOfflineReqIndex() + 1;
	var now = new Date();
	localStorage['offlineReq_' + nextIndex + '_page'] = pageName;
	localStorage['offlineReq_' + nextIndex + '_service'] = serviceName;
	localStorage['offlineReq_' + nextIndex + '_time'] = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
	localStorage['offlineReq_' + nextIndex + '_url'] = url;
	localStorage['offlineReq_' + nextIndex + '_query'] = query;
	localStorage['offlineReq_end'] = nextIndex;
	showInfoPopup('Offline', 'Your action will be synced later.');
}

function deleteOfflineRequest(index) {
	localStorage.removeItem('offlineReq_' + index + '_page');
	localStorage.removeItem('offlineReq_' + index + '_service');
	localStorage.removeItem('offlineReq_' + index + '_time');
	localStorage.removeItem('offlineReq_' + index + '_url');
	localStorage.removeItem('offlineReq_' + index + '_query');
}

function getOfflineRequests() {
	var $ = [];
	var start = getFirstOfflineReqIndex();
	var end = getLastOfflineReqIndex();
	
	for (var i = start; i < end + 1; i++) {
		if (localStorage['offlineReq_' + i + '_service'] !== undefined) {
			$.push({
				index: 		i,
				page: 		localStorage['offlineReq_' + i + '_page'],
				service: 	localStorage['offlineReq_' + i + '_service'],
				time: 		localStorage['offlineReq_' + i + '_time'],
				url:		localStorage['offlineReq_' + i + '_url'],
				query:		localStorage['offlineReq_' + i + '_query']
			});
		}
	}
	showHideOfflineRequestsTable($);
	return $;
}

/*********************************
 *** Response ********************
 *********************************/

function storeOfflineResponseIfNeeded(serviceName, response) {
	var offlineAction = getOfflineConfig(serviceName).action;
	if (offlineAction === 'STORAGE_THEN_LIVE' || offlineAction === 'LIVE_THEN_STORAGE') {
		localStorage['offlineRes_' + serviceName] = JSON.stringify(response);
	}
}

/*********************************
 *** UI **************************
 *********************************/

function showHideOfflineRequestsTable(offlineRequests) {
	if (offlineRequests.length !== 0) {
		document.getElementById('offlineRequestsContainer').style.display = 'block';
		document.getElementById('noOfflineRequestsContainer').style.display = 'none';
	} else {
		document.getElementById('offlineRequestsContainer').style.display = 'none';
		document.getElementById('noOfflineRequestsContainer').style.display = 'block';
	}
}

function populateOfflineRequestsTable(offlineRequests) {
	offlineRequestsTableData = offlineRequests;
	
	var tbody = document.getElementById('offlineRequestsTbody');
	if (tbody === null) {
		return;
	}
	while(tbody.rows.length > 0) {
		tbody.deleteRow(0);
	}
	for (var i = 0; i < offlineRequests.length; i++) {
		var row = tbody.insertRow(i);
		var cell;
		
		cell = document.createElement('td');
        row.appendChild(cell);
        cell.innerHTML = offlineRequests[i]['index'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['page'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['service'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = offlineRequests[i]['time'];
        
        cell = row.insertCell(-1);
        cell.innerHTML = '<a title="Sync" href="#" onclick="syncOfflineRequest(' + i + ')"\r\n' +
						 'class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-refresh ui-btn-icon-notext"\r\n' +
						 'style="width: 40px !important; margin-right: 10px"></a>\r\n' +
						 '<a title="Delete" href="#" onclick="deleteTableOfflineRequest(' + i + ')"\r\n' +
						 'class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-icon-minus ui-btn-icon-notext"\r\n' +
						 'style="width: 40px !important; margin-right: 0"></a>';
	}
}

function deleteTableOfflineRequest(index) {
	var rowData = offlineRequestsTableData[index];
	showConfirmPopup('Delete sync request #' + rowData.index, 'Are you sure you want to delete request for service ' + rowData.service + ' made from ' + rowData.page + '?', function() {
		offlineRequestsTableData.splice(index, 1);
		document.getElementById("offlineRequestsTbody").deleteRow(index);
		deleteOfflineRequest(rowData.index);
	});
}
