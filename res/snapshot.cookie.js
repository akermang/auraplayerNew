var isWaitingForResponse = false;
var handlerMap = new Object();
window.lastFocusedElement = null;


function getHandlersByFilter(handlerMap, filter ){

	if (handlerMap == undefined) return new Array();
	return $(handlerMap).filter(function(index,handler){ return objFilter(handler, filter); });
}


//utility function, used by getHandlersByFilter
function objFilter(obj, filter){

	result = true;
	for ( key in filter ){
		result &= obj[key] == filter[key];
	}
	
	return result;
}

//show spinner in element
function showSpinner(show, parentElem){
	var focused;

	if (show){
		if (parentElem != undefined && $('#spinner').size() == 0){
			$(parentElem).append("<div id='spinner'></div>");
			$('#spinner').css('position','relative');
			$('#spinner').css('top','50%');
			$('#spinner').css('left','50%');
			$('#spinner').css('z-index','10000');
			$('#spinner').css('display','none');
			$('#spinner').css('background-image',"url('res/spinner.gif')");
			$('#spinner').css('height','40px');
			$('#spinner').css('width','40px');
			$('#spinner').css('background-repeat','no-repeat');
		}
		
//		focused = document.activeElement;		
		$('#spinner').show();
//		$("input").prop('disabled', true);
	}
	else{
		$('#spinner').hide();		
//		$("input").prop('disabled', false);
//		$(focused).focus();
	}

}


$(function(){

	//handle on-click event for buttons
	$("input[type='button']").on("click",function(){
		var buttonId = $(this).attr('id');
		var handlers = getHandlersByFilter(handlerMap, {"element" : buttonId });
		
		for (i in handlers){
			executeHandler(handlers[i]);
		}
	});
	
	//handle key-down event 
	$(document).keydown(function(e) {
		var keyId = e.which;
		window.lastFocusedElement = e.target;
		var targetId = e.target.id;
		var handlers = getHandlersByFilter(handlerMap, {"key" : keyId});
			
		for (var i = 0; i < handlers.length; i++){
			//element not specified, execute
			if (handlers[i]["element"] == undefined || 
					handlers[i]["element"] == ""){
					executeHandler(handlers[i]);
			}
			//element matches rule, execute
			else if ( handlers[i]["element"] == targetId){
					executeHandler(handlers[i]);				
			}
		}
		
		
	});
	

	var creationTimestamp = $('meta[name="Creation-Timestamp"]').attr("content");	
	var windowName = $('meta[name="Window-Name"]').attr("content");
	var jsonFile = 'handlerMap_' + creationTimestamp +'.json';
	

	//execute on-load action handlers
	$.ajax({
		url: '/ServiceManager/www/json/' + jsonFile,
		async: false,
		dataType: 'text',
		success: function (response){
			handlerMap = JSON.parse(response);			
			
			// execute onload functions
			var onloadFunctions = getHandlersByFilter(handlerMap, {"action" : "onload"});
			for ( var i in onloadFunctions ){
				executeHandler(onloadFunctions[i]);
			}
			
	  	}
	});	
	
	//put data from cookie into input fields
	setCookieValuesInFields();

});


function executeHandler(handler){
		var params;

		if (handler == undefined || isWaitingForResponse){
			return;
		}
		else if ( handler["action"] == "function" ){
			var funcName = handler['attr'];
			if ( window[funcName] == undefined ){
				alert("Undefined function" + funcName);
			}
			else{
				window[handler['attr']].call();		
			}
		}
		else if ( handler["action"] == "webservice" ){
			putAllFieldsIntoCookie();
			params = getCookiesAsQueryString();
			
			callWebService(handler['attr'],params, handler['errorHandler']);
		}
		else if ( handler["action"] == "onload" ){
			//TODO: check if webservice or function(?)	
			putAllFieldsIntoCookie();
			params = getCookiesAsQueryString();
			callWebService(handler['attr'],params, handler['errorHandler']);
		}
		else if ( handler["action"] == "navigate"  ){
			navigate(handler['attr']);
		}
		

}

function navigate(targetUrl){
	putAllFieldsIntoCookie();
	window.location = targetUrl;
}

//wait for window to load before showing
$(window).load(function(){
	$('body').show();
});

function clearTextFields(){

	$("input[type='text']").val("");

}


function getNodeValue(node)
{
    
    if(node==undefined) return "Undefined";
	value = node.textContent;
	if (value==undefined)
		value = node.text;
	return value;
}

function getElementsByTagNameSuffix(xmlNode, suffix){
	var result = new Array();

	return getElementsByTagNameSuffixHelper(xmlNode,suffix,result);
}


function getElementsByTagNameSuffixHelper(xmlNode, suffix, result){
	var childNodes = xmlNode.childNodes;

	if (childNodes.length == 0) return result;

	for(var i=0;i<childNodes.length;i++){ 
		var childNode = childNodes[i];
		if (childNode.tagName == undefined) continue;
		if (childNode.tagName.indexOf(suffix) > 0 &&
			childNode.tagName.indexOf(suffix) ==
				 childNode.tagName.length - suffix.length){
				result.push(childNode);
		}
		getElementsByTagNameSuffixHelper(childNode,suffix,result);

	}

	return result;
}

function analyzeXml(xml, errorHandler){

	//Checking for error field
	var errorMsg = getNodeValue(xml.getElementsByTagName("Error")[0]);
	var popupMsg = getNodeValue(xml.getElementsByTagName("PopupMessages")[0]);
	var statusBarMsg = getNodeValue(xml.getElementsByTagName("StatusBarMessages")[0]);

	if (errorHandler!=undefined)
	{
		//get the function by calling window[errorHanler]
		if (window[errorHandler]!=undefined && window[errorHandler]!=null)
		{
			window.xmlDoc = xml;
			window[errorHandler].call();
		}
	}
		
	//TODO: handle errors
	if (errorMsg.length>0)
		alert("Error in request");


	//Handle Elements
	var childNodes = getElementsByTagNameSuffix(xml,"Elements")[0].childNodes;
	if (childNodes==null || childNodes==undefined)
		alert("Error parsing childNodes response");
	var tempValue = "";
	var tempName = "";
	for(var i=0;i < childNodes.length; i++){
		tempName = childNodes[i].nodeName;
		//handle namespace
		//if (tempName.indexOf(":") > -1){
		//	tempName = tempName.substr(tempName.indexOf(":") + 1);
		//}
		if(childNodes[i].childNodes.length>0){
			tempValue= getNodeValue(childNodes[i].childNodes[0]);
			
			//add to cookie
			addToCookie(tempName, tempValue); 
			
			//populate fields
			if( $("input#"+tempName).length > 0 )
				$("input#"+tempName).val(tempValue);
			else if( $("#"+tempName).length > 0 )
				$("#"+tempName).text(tempValue);
				
		}
	}

	//Handle Array Items
	var tableNodes = getElementsByTagNameSuffix(xml,"ArrayItem");
	
	if(tableNodes.length>=0){
		for(var j=0;j<tableNodes.length;j++){ //row in table
			var cells = tableNodes[j].childNodes;
			for (var k=0; k < cells.length; k++){
				var cellName = cells[k].nodeName;
				
				//handle namespace
				//if (cellName.indexOf(":") > -1){
				//	cellName = tempName.substr(tempName.indexOf(":") + 1);
				//}
				
				cellName = cellName.substr(0,cellName.lastIndexOf('_') + 1);
				cellName += j;
				var cellValue = getNodeValue(cells[k]);
				
				//add to cookie
				addToCookie(cellName, cellValue); 
				
				//populate fields
				if ($('#' + cellName) != null ){
					$('#' + cellName).val(cellValue);
				}
			}
		}
	}
	return true;
}

function callWebService(webServiceUrl, params, errorHandler)
{
	var queryData=encodeURI(params)+'&randomSeed='+(Math.random()*1000000)+'&json=false';
					
	$.ajax({
			url: webServiceUrl,
			type: "POST",
			dataType: "xml", // expected format for response
	    	data: queryData,
			success: function(responseXML, textStatus, jqXHR) {
				if(!analyzeXml(responseXML, errorHandler)){
					//do something, there was an error
					//alert('Error receiving data from server');
				}
		  	},
			error: function() {
				//alert('Error receiving data from server');
			}
		});
}

function getCookiesAsQueryString(){

	var inputParams = new Array();

	var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        name = x.replace(/^\s+|\s+$/g, "");
		value = unescape(y);
		
		inputParams.push(name + "=" + value );        
    }

	return inputParams.join('&');

}

function getInputTextAsQueryString(){

	var inputParams = new Array();
	
	//TODO: append checkboxes with true, false
	//TODO: chrome, save as removes attirbute type='text'
	$("input[type='text']").each(
		function(index,item){
			inputParams.push($(item).attr('id') + "=" + $(item).val() );
		}
	);
	
	return inputParams.join('&');
}

function putAllFieldsIntoCookie(exdays)
{
	$("input[type='text']").each(
			function(){
				addToCookie(this.id, this.value);
			}
		);
}

function addToCookie(key, value, exdays){

    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
	var expires = ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());

    var c_value = escape(value) + expires;
    document.cookie = key + "=" + c_value;
}

function setCookieValuesInFields() {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        name = x.replace(/^\s+|\s+$/g, "");
        value = unescape(y);
        
        //set the fields in here
        if ( $("[id='"+name+"']") != null ){

        	$("[id='"+name+"']").val(value);        

        }
        else{
			var hiddenInput = $('<input/>',{type:'text',id:name,value:value, css:{'display':'none'}});
			hiddenInput.appendTo('body');
        }
    }
}
//runs function on window ready
$(function(){
	//putAllFieldsIntoCookie() - should be called when we get values from the web service call
	setCookieValuesInFields(); 
});



////////// LOV

var lov;	

//listen for key press when showing LOV
$(function(){
	$(document).keyup(function(e) {
		var keyId = e.which;
		if (lov != undefined && lov.isShowingLov()){

			if (keyId == 38){ //UP
				lov.changeLovItemSelction(false);
				e.preventDefault();
			}
			else if ( keyId == 40){ //DOWN
				lov.changeLovItemSelction(true);
				e.preventDefault();
			}
			else if ( keyId == 13){ //ENTER
				lov.select();
				e.preventDefault();
				lov = undefined;
			}

		}

	});

});


function appendLovDiv(){
	
	//first div style is enclosing whole window
	//copy style to new LOV div
	var style = $("body div:first").attr("style");
	var lovDiv = $("<div>");
	lovDiv.attr("id","LOV");
	lovDiv.attr("style",style);
	lovDiv.css("z-index",1005);
	lovDiv.css("display","none");

	//append LOV table
	lovDiv.append(
			$("<table>")
			.css("width","80%")
			.css("margin","auto")
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
		"} "+
		"#LOV .selected{ " +
			"color:white;" +
			"background-color: black;" +
		"}"+
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

function showLov(obj, caption, callback){
	
	if ( $("#LOV") == undefined || $("#LOV").length == 0 ){
		appendLovDiv();
	}
	
	lov = new LOV(window.lastFocusedElement.id);
	
	if (caption != undefined){
		lov.setCaption(caption);
	}
	
	lov.setItemsToLov(obj);
	lov.toggleLov();
	lov.select = lov.select.bind(lov,callback);
	
	return lov;
}


var LOV = function(elemId){

	this.selectedLovIndex = null;
	this.targetId = elemId;

 	this.initLov = function(){
		this.resetSelection();		
	};

	this.changeLovItemSelction = function(down){
		var lovSize = this.countItemsInLov();


		var selectedItem = $("#LOV tbody tr")[this.selectedLovIndex];
		$(selectedItem).removeClass("selected");
		
		if (down){
			this.selectedLovIndex++;
			if (this.selectedLovIndex == lovSize){
				this.selectedLovIndex = 0;
			}
		}
		else{
			this.selectedLovIndex--;
			if (this.selectedLovIndex == -1){
				this.selectedLovIndex = lovSize - 1;
			}
		}

		selectedItem = $("#LOV tbody tr")[this.selectedLovIndex];
		$(selectedItem).addClass("selected");

	};

	this.getSelectedItemValue = function(){
		return this.getLovItemValue(this.selectedLovIndex);
	};

	this.countItemsInLov = function(){
		return $("#LOV tbody tr").length;
	};

	this.setItemsToLov = function(obj){
		this.clearLovTable();
		for (key in obj){
			this.addItemToLov(key, obj[key]);
		}
	};
	
	this.setCaption = function(caption){
		$("#LOV table caption").remove();
		$("#LOV table").append("<caption>" + caption + "</caption>");
	};

	this.clearLovTable = function(){
		$("#LOV tbody").empty();		
	};

	this.addItemToLov = function(key, value){

		var lovSize = this.countItemsInLov();
		
		$("#LOV tbody").append(
				$("<tr>").append(
					$("<td id='LOV_key_"+lovSize+"'>").text(key)
				).append(
					$("<td id='LOV_value_"+lovSize+"'>").text(value)
				)
			);


		if (this.selectedLovIndex == null){
			this.selectedLovIndex = 0;
			var selectedItem = $("#LOV tbody tr")[this.selectedLovIndex];
			$(selectedItem).addClass("selected");
		}

	};

	this.getLovItemValue = function(index){
		return $("#LOV_key_" +index).text();
	};

	this.resetSelection = function(){
		if (this.countItemsInLov() > 0 ){
			$($("#LOV tbody tr")[this.selectedLovIndex]).removeClass("selected");
			this.selectedLovIndex = 0;
			$($("#LOV tbody tr")[this.selectedLovIndex]).addClass("selected");

		}
	};

	this.toggleLov = function(){
		$("#LOV").toggle();
		this.resetSelection();
	};

	this.isShowingLov = function(){
		return $("#LOV").css("display") == "block";	
	};

	this.select = function(callback){
		$("#"+this.targetId).val(this.getSelectedItemValue());
		this.toggleLov();
		
		if (callback != undefined)
			callback();
	};
	

};
	
