var autocomplete_config = {};
var fired_suggestions = [];
var suggestions_in_progress = [];

function highlightText(text, $node) {
	text = $.trim(text);
	if (text === '') {
		return;
	}
	var searchText = text.toLowerCase(), currentNode = $node.get(0).firstChild, matchIndex, newTextNode, newSpanNode;
	while ((matchIndex = currentNode.data.toLowerCase().indexOf(searchText)) >= 0) {
		newTextNode = currentNode.splitText(matchIndex);
		currentNode = newTextNode.splitText(searchText.length);
		newSpanNode = document.createElement("span");
		newSpanNode.className = "highlight";
		currentNode.parentNode.insertBefore(newSpanNode, currentNode);
		newSpanNode.appendChild(newTextNode);
	}
}

function invokeOnSelectUserDefinedCallback(serviceName, selectedItem) {
	var itemHandler = window[autocomplete_config[serviceName].itemHandler];
	if (typeof(itemHandler) === 'undefined') {
		return;
	}
	
	if (/^_static_lov_/.test(autocomplete_config[serviceName].webService)) {		//autocomplete_config[serviceName].webService).startsWith('_static_lov_')
		itemHandler(selectedItem);
	} else {
		fetchService(serviceName, function (serviceData) {
			if (typeof serviceData !== 'undefined') {
				var useLabelsAsKeys = serviceData.data.useLabelsAsKeys;
				itemHandler(selectedItem, useLabelsAsKeys);
				validateRequiredFields();
			} else {
				onSuggestionsError();
			}
		}, onSuggestionsError);
	}
}

function setAutocomplete(serviceName, labelItemPairs, keepClosed) {
	var config = autocomplete_config[serviceName];
	var element = $("#" + config.elementId);
	if (element[0].nodeName === "DIV") {
		element = $(element[0].parentElement);
	}

	element.autocomplete({
		source: labelItemPairs,
		minLength: 0,
		selectFirst: true,
		select: function(event, ui) {
			invokeOnSelectUserDefinedCallback(config.webService, ui.item.item);
			return false;
		}
	})
	.click(function() {
		$(this).autocomplete("search", $(this).val());
	})
	.data("ui-autocomplete")._renderItem = function(ul, item) {
		var $a = $("<a></a>").text(item.label);
		highlightText(this.term, $a);
		return $("<li></li>").append($a).appendTo(ul);
	};
	
	if (!keepClosed && labelItemPairs.length > 0) {
		var element = $('#' + autocomplete_config[serviceName].elementId);
		element.autocomplete("search", element.val());
	}
}

function prepareAutocompleteRequestParams(serviceName) {
	var requestPreparer = window[autocomplete_config[serviceName].requestPreparer];
	if (typeof requestPreparer !== 'undefined') {
		var inputParams = requestPreparer();
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

function presentAutocompleteItems(serviceName, arrayItems) {
	var itemPresenter = window[autocomplete_config[serviceName].itemPresenter];
	if (typeof itemPresenter !== "undefined") {
		fetchService(serviceName, function (serviceData) {
			if (typeof serviceData !== 'undefined') {
				var useLabelsAsKeys = serviceData.data.useLabelsAsKeys;
				
				var autocompleteOptions = [];
				for (var i = 0; i < arrayItems.length; i++) {
					autocompleteOptions.push({label: itemPresenter(arrayItems[i], useLabelsAsKeys), item: arrayItems[i]});
				}
				
				setAutocomplete(serviceName, autocompleteOptions);
			} else {
				onSuggestionsError();
			}
		}, onSuggestionsError);
	}
}

function onSuggestionsSuccess(response, serviceName, arrayItems) {	
	console.log('Received ' + arrayItems.length + ' autocomplete suggesstions from service ' + serviceName);
	
	presentAutocompleteItems(serviceName, arrayItems);
	suggestions_in_progress.splice(suggestions_in_progress.indexOf(serviceName), 1);
	stopSmallSpinner();
}

function onSuggestionsError(response, serviceName) {
	var serviceErrorMsg = getResponseNodeValueByName("Error");
	if (serviceErrorMsg != undefined && serviceErrorMsg.length > 0) {
		setTimeout(function () {
	        showServiceErrorsPopup(serviceErrorMsg, 200);
	    }, 1000);
	}
	
	suggestions_in_progress.splice(suggestions_in_progress.indexOf(serviceName), 1);
	stopSmallSpinner();
}

function getSuggestions(id, serviceName) {
	if (suggestions_in_progress.indexOf(serviceName) != -1) {
		console.log('Aborting: getSuggestions is already in progress!');
		return;
	}
	startSmallSpinner('Loading suggestions..');
	suggestions_in_progress.push(serviceName);
	callWebService(serviceName, prepareAutocompleteRequestParams(serviceName), undefined, onSuggestionsSuccess, onSuggestionsError, true, false);
	spinner().stop();
}

function initAutocompleteFocusTrigeer(id, serviceName) {
	var handler = function() {
		if (fired_suggestions.indexOf(serviceName) != -1) {
			return;
		}
		getSuggestions(id, serviceName);
	    fired_suggestions.push(serviceName);
	};
	
	var field = $('#' + id);
	if (field[0].nodeName === 'DIV') {
		$($('#' + id)[0].parentElement).click(handler);
	} else {
		$('#' + id).focusin(handler);
	}
}

function initAutocompleteButton(triggerId, serviceName) {
	$('#' + triggerId).click(function () {
		getSuggestions(triggerId, serviceName);
		setAutocomplete(serviceName, []);
	});
}

function prepareMobileLOV(options) {
	var isStaticLov = (options.webService === '');
	if (isStaticLov) {
		options.webService = '_static_lov_' + options.elementId;
	}
	
	autocomplete_config[options.webService] = options;
	
	if (isStaticLov) {
		var converter = 'convert_' + options.elementId;
		if (typeof window[converter] === 'function') {
			setAutocomplete(options.webService, window[converter](), true);
		} else {
			console.error('No converter seed function found for static lov: ' + id);
		}
	} else {
		initAutocompleteFocusTrigeer(options.elementId, options.webService);
		initAutocompleteButton(options.triggerId, options.webService);
	}
}
