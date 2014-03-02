function id(element) {
	return document.getElementById(element);
}
 
document.addEventListener("deviceready", onDeviceReady, false); 
document.addEventListener('deviceready', initializeMap, false);
document.addEventListener("touchstart", function() {}, false);

var compassHelper;
var accelerometerHelper;

function onDeviceReady() {
	navigator.splashscreen.hide();
    geolocationApp = new geolocationApp();
	geolocationApp.run();
    compassHelper = new CompassHelper();
	compassHelper.run();
    accelerometerHelper = new AccelerometerApp();
	accelerometerHelper.run();
    
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
function CompassHelper() {
}
function AccelerometerApp() {
}

function initializeMap() {

	map = new L.Map('map');

    var stamenUrl = 'http://b.tile.stamen.com/terrain/{z}/{x}/{y}.jpg';
    var stamenAttrib = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.';
    var osm = new L.TileLayer(stamenUrl, { 
        								attribution: stamenAttrib,
        								detectRetina: true
                                      });

    map.setView(new L.LatLng(32.721216,-117.16896), 11);
    map.addLayer(osm);
    
    pushpin = L.marker([32.721216, -117.16896]).addTo(map);
}

function recenterOnPhonePosition(latitude, longitude) { 
    var currentLocation = new L.LatLng(latitude, longitude); 
  
    pushpin.setLatLng(currentLocation); 
    map.setView(currentLocation); 
} 

CompassHelper.prototype = {
	run: function() {
		var that = this;
        
		var refreshButton = document.getElementById("refreshCompButton");
		
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
}

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
        
        recenterOnPhonePosition(position.coords.latitude, position.coords.longitude);
        
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

AccelerometerApp.prototype = {
	watchID : null,
	spanX : null,
	spanY: null,
	spanZ: null,
	spanTimeStamp: null,
    
	run:function() {
		var that = this;
		document.getElementById("refreshAccButton").addEventListener("click", function() {
			that._handleRefresh.apply(that, arguments);
		}, false);
	},
    
	_handleRefresh:function() {
		var that = this;
		navigator.accelerometer.getCurrentAcceleration(function() { 
			that._displayAcceleration.apply(that, arguments)
		});
	},    
 
    _displayAcceleration: function(acceleration) {
		var that = this;
		x_acceleration = acceleration.x;
		y_acceleration = acceleration.y;
        z_acceleration = acceleration.z;
        
		var informationMessage = 'X: ' + x_acceleration.toFixed(2) +
								 ' Y: ' + y_acceleration.toFixed(2) +
								 ' Z: ' + z_acceleration.toFixed(2); 
        
		that._clearCurrentNotification();
		that._writeNotification(informationMessage);
	},
    
    _writeNotification: function(text) {
		var result = document.getElementById("accresult");
		result.innerHTML = text;
	},
    
	_clearCurrentNotification: function() {
		var result = document.getElementById("accresult");
		result.innerText = "";
	}
}