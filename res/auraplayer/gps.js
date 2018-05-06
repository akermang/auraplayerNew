// get location from GPS and pass results to callback function
// Object example: {street_number: "12", route: "Rambam Street", locality: "Tel Aviv", administrative_area_level_1: "Tel Aviv District", country: "Israel"} 
function getLocation(callback) {
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    var onSuccess = populatePosition.bind(this, callback);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(onSuccess, null, options);
    } else {
        msg = "Geolocation is not supported by this browser.";
        alert(msg)
    }
}

function populatePosition(callback, position) {

    var url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + position.coords.latitude + "," + position.coords.longitude + "&language=en&sensor=false";
    jQuery.getJSON(url, function (json) {
        var res = {};

        //normalize google repsponse
        $.each(json['results'][0]['address_components'], function (i, elem) {
            res[elem['types'][0]] = elem['long_name']
        });

        callback(res);
    });
}
