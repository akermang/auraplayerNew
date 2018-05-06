var map, geocoder, marker;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
    	center: {lat: 40.7115648, lng: -74.0038266},
    	zoom: 12,
    	gestureHandling: "cooperative",
    	fullscreenControl: false,
    	streetViewControl: false
    });
    geocoder = new google.maps.Geocoder();
    
    var initialAddress = generateAddress();
    if (!initialAddress || initialAddress.length == 0) {
    	initialAddress = defaultValues['Map'].value;
    	document.getElementById('map_address').innerHTML = initialAddress;
	}
    geocodeAddress(initialAddress);
    
	document.getElementById('map_navigate_button').addEventListener('click', function() {
		var address = document.getElementById('map_address').innerHTML;
		var url = 'https://www.google.com/maps/search/?api=1&query=' + address.replace(' ', '+');
		window.open(url, '_blank');
	});
    document.getElementById('map_locate_button').addEventListener('click', function() {
    	geocodeAddress(generateAddress(), true);
	});
}

function generateAddress() {
	var address = window['convert_map']();
	document.getElementById('map_address').innerHTML = address;
	return address.trim();
}

function geocodeAddress(address, isButtonTriggered) {
	if (marker !== undefined) {
		marker.setMap(null);
	}
	if (!address || address.length == 0) {
		return;
	}
	geocoder.geocode({'address': address}, function(results, status) {
		if (status === 'OK') {
			map.setCenter(results[0].geometry.location);
			marker = new google.maps.Marker({
				map: map,
				position: results[0].geometry.location
			});
		} else {
			if (isButtonTriggered) {
				showInfoPopup('Map', 'Unable to resolve address: ' + status);
			}
		}
	});
}
