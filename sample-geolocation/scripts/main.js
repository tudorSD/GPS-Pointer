function id(element) {
	return document.getElementById(element);
}
 
document.addEventListener("deviceready", onDeviceReady, false); 
document.addEventListener('deviceready', initializeMap, false);

//var compassHeltper;

function onDeviceReady() {
	navigator.splashscreen.hide();
    geolocationApp = new geolocationApp();
	geolocationApp.run();
 //   compassHelper = new CompassHelper();
//	compassHelper.run();
    
}


// my stuff
var map = null;
var pushpin = null;
var compassHeading = null;
//var latitude = null;
//var longitude = null;
//var altitude = null;
//var pitch = null;

function geolocationApp() {
}
//function CompassHelper() {
//}

function initializeMap() {

	map = new L.Map('map');

    var osmUrl = 'http://b.tile.stamen.com/terrain/{z}/{x}/{y}.jpg';
    var osmAttrib = 'Map data © OpenStreetMap contributors';
    var stamenAttrib = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.';
    var osm = new L.TileLayer(osmUrl, { 
        								attribution: stamenAttrib,
        								detectRetina: true
                                      });

    map.setView(new L.LatLng(32.721216,-117.16896), 11);
    map.addLayer(osm);
    
    pushpin = L.marker([32.721216, -117.16896]).addTo(map);
}

function recenterOnPhonePositionLeaflet(latitude, longitude) { 
    var currentLocation = new L.LatLng(latitude, longitude); 
  
    pushpin.setLatLng(currentLocation); 
    map.setView(currentLocation); 
} 

/*CompassHelper.prototype = {
	//watchID : null,
    
	run: function() {
		var that = this,
		refreshButton = document.getElementById("refreshCompButton"),
		
		refreshButton.addEventListener("click", 
									   function() {
										   that._handleRefresh.apply(that, arguments)
									   }, 
									   false);
	},
    
	_handleRefresh: function() {
		var that = this;
		navigator.compass.getCurrentHeading(function() { 
			that._displayHeading.apply(that, arguments)
		});
	},
    
	_displayHeading: function(heading) {
		var that = this,
		magneticHeading = heading.magneticHeading,
		timestamp = heading.timestamp;
        
		var informationMessage = 'Magnetic field: ' + magneticHeading + '<br />' +
								 'Timestamp: ' + timestamp + '<br />' 
        
		that._clearCurrentNotification();
		that._writeNotification(informationMessage);
	},
    
    _writeNotification: function(text) {
		var result = document.getElementById("compresult");
		result.innerHTML = text;
	},
    
	_clearCurrentNotification: function() {
		var result = document.getElementById("compresult");
		result.innerText = "";
	}
}*/

geolocationApp.prototype = {
	_watchID:null,
    
	run:function() {
		var that = this;
		document.getElementById("refreshNavButton").addEventListener("click", function() {
			that._handleRefresh.apply(that, arguments);
		}, false);
	},
    
	_handleRefresh:function() {
		var options = {
			enableHighAccuracy: true
		},
		that = this;
		navigator.geolocation.getCurrentPosition(function() {
			that._onSuccess.apply(that, arguments);
		}, function() {
			that._onError.apply(that, arguments);
		}, options);
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
        
       // recenterOnPhonePositionLeaflet(position.coords.latitude, position.coords.longitude);
        
		this._setNavResults('Latitude: ' + position.coords.latitude + '<br />' +
						 'Longitude: ' + position.coords.longitude + '<br />' +
						 'Altitude: ' + position.coords.altitude + '<br />');
	},
    
	_onError:function(error) {
		this._setNavResults('code: ' + error.code + '<br/>' +
						 'message: ' + error.message + '<br/>');
	},
    
	_setNavResults:function(value) {
		if (!value) {
			document.getElementById("navresults").innerHTML = "";
		}
		else {
			document.getElementById("navresults").innerHTML = value;
		}
	}
}