function id(element) {
	return document.getElementById(element);
}
 
document.addEventListener("deviceready", onDeviceReady, false); 
document.addEventListener('deviceready', initializeMap, false);

var compassHelper;

function onDeviceReady() {
	navigator.splashscreen.hide();
    geolocationApp = new geolocationApp();
	geolocationApp.run();
    compassHelper = new CompassHelper();
	compassHelper.run();
    
}


// my stuff
var map = null;
var pushpin = null;
var compassHeading = null;

function geolocationApp() {
}
function CompassHelper() {
}

function recenterOnPhonePositionBing(latitude, longitude) { 
    if (pushpin == null) 
    { 
        pushpin= new Microsoft.Maps.Pushpin(map.getCenter(), null); 
        map.entities.push(pushpin); 
    } 
    
    var currenLocation = new Microsoft.Maps.Location(latitude, longitude); 
  
    pushpin.setLocation(currenLocation); 
    map.setView({center: new Microsoft.Maps.Location(latitude, longitude)}); 
} 

function initializeBingMap() {
    var mapOptions = {
        credentials: "Ap3GmA3YzgPeVI3iSZ8yZWepLOfmyR1zR89sMmDYQUUqWmbo0uZIw9kS3WhlR7gt ",
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        center: new Microsoft.Maps.Location(32.721216,-117.16896),
        zoom: 11
    };
    map = new Microsoft.Maps.Map(document.getElementById("map"), mapOptions);
    
    
    // Add a pin to the center of the map
    pushpin = new Microsoft.Maps.Pushpin(mapOptions.center, {draggable: false});
	
    map.entities.push(pushpin);
}

function initializeMap() {

	map = new L.Map('map');

    //var osmUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png';
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

CompassHelper.prototype = {
	watchID : null,
    
	run: function() {
		var that = this,
		refreshButton = document.getElementById("refreshButton"),
		buttonWatch = document.getElementById("watchButton");
		
		buttonWatch.addEventListener("click", 
									 function() {
										 that._handleWatch.apply(that, arguments);
									 }, 
									 false);
		
		refreshButton.addEventListener("click", 
									   function() {
										   that._handleRefresh.apply(that, arguments)
									   }, 
									   false);
	},
    
	_handleRefresh: function() {
		var that = this;
		navigator.compass.getCurrentHeading(function() { 
			that._rotateCompassImage.apply(that, arguments);
			that._displayHeading.apply(that, arguments)
		},
											function() {
												that._onCompassWatchError.apply(that, arguments)
											});
	},
    
	_handleWatch: function() {
		var that = this,
		button = document.getElementById("watchButton");

		if (that.watchID !== null) {
			navigator.compass.clearWatch(that.watchID);
			that.watchID = null;
			button.innerHTML = "Start Compass";
			that._clearCurrentNotification();
		}
		else {
			var options = { frequency: 1000 };
			
			that._clearCurrentNotification();
			that._writeNotification("Waiting for compass information...");
			button.innerHTML = "Stop Compass";
            
			that.watchID = navigator.compass.watchHeading(function() { 
				that._displayHeading.apply(that, arguments)
				that._rotateCompassImage.apply(that, arguments);
			}, 
														  function() {
															  that._onCompassWatchError.apply(that, arguments)
														  }, 
														  options);
		}
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
    
	_onCompassWatchError: function(error) {
		var that = this,
		errorMessage,
		button = document.getElementById("watchButton");
		switch (error.code) {
			case 20:
				errorMessage = "Compass not supported";
				break;
			case 0:
				errorMessage = "Compass internal error";
				break;
			default:
				errorMessage = "Compass error";
		}
        
		button.innerHTML = "Start Compass";
		that.watchID = null;
		that._clearCurrentNotification();
		that._writeNotification(errorMessage);
	}
}

geolocationApp.prototype = {
	_watchID:null,
    
	run:function() {
		var that = this;
		document.getElementById("watchButton").addEventListener("click", function() {
			that._handleWatch.apply(that, arguments);
		}, false);
		document.getElementById("refreshButton").addEventListener("click", function() {
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
    
	_handleWatch:function() {
		var that = this,
		// If watch is running, clear it now. Otherwise, start it.
		button = document.getElementById("watchButton");
                     
		if (that._watchID != null) {
			that._setResults();
			navigator.geolocation.clearWatch(that._watchID);
			that._watchID = null;
                         
			button.innerHTML = "Start Geolocation Watch";
		}
		else {
			that._setResults("Waiting for geolocation information...");
			// Update the watch every second.
			var options = {
				frequency: 1000,
				enableHighAccuracy: true
			};
			that._watchID = navigator.geolocation.watchPosition(function() {
				that._onSuccess.apply(that, arguments);
			}, function() {
				that._onError.apply(that, arguments);
			}, options);
			button.innerHTML = "Clear Geolocation Watch";
            
		}
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
        
        recenterOnPhonePositionLeaflet(position.coords.latitude, position.coords.longitude);
        
		this._setResults('Latitude: ' + position.coords.latitude + '<br />' +
						 'Longitude: ' + position.coords.longitude + '<br />' +
						 'Altitude: ' + position.coords.altitude + '<br />' +
						 'Accuracy: ' + position.coords.accuracy + '<br />' +
						 'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br />' +
						 'Heading: ' + position.coords.heading + '<br />' +
						 'Speed: ' + position.coords.speed + '<br />' +
						 'Timestamp: ' + new Date(position.timestamp).toLocaleTimeString().split(" ")[0] + '<br />');
	},
    
	_onError:function(error) {
		this._setResults('code: ' + error.code + '<br/>' +
						 'message: ' + error.message + '<br/>');
	},
    
	_setResults:function(value) {
		if (!value) {
			document.getElementById("results").innerHTML = "";
		}
		else {
			document.getElementById("results").innerHTML = value;
		}
	},
}