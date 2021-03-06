function id(element) {
	return document.getElementById(element);
}

document.addEventListener("deviceready", onDeviceReady, false); 
document.addEventListener("touchstart", function() {}, false);

function onDeviceReady() {
	navigator.splashscreen.hide();
    
    var shake = new Shake({
            frequency: 300,                                                //milliseconds between polls for accelerometer data.
            waitBetweenShakes: 1000,                                       //milliseconds to wait before watching for more shake events.
            threshold: 12,                                                 //how hard the shake has to be to register.
            success: onShakeDetected, 										//callback when shake is detected. "this" will be the "shake" object.
            failure: function() {},                                        //callback when watching/getting acceleration fails. "this" will be the "shake" object.
        });    
    
    shake.startWatch();
    
    initializeMap();
 /*   geolocationApp = new geolocationApp();
	geolocationApp.run();
    compassHelper = new CompassHelper();
	compassHelper.run();
    accelerometerHelper = new AccelerometerApp();
	accelerometerHelper.run();*/
}

function initializeMap() {

	checkConnection();

//<a href="#" onclick="var ref = window.open('http://openstreetmap.org', '_blank');">OpenStreetMap</a>, under <a href="#" onclick="var ref = window.open('http://creativecommons.org/licenses/by-sa/3.0', '_blank');">CC BY SA</a>.'<a href="#">CC BY SA</a>.'
    
    var stamenUrl = 'http://b.tile.stamen.com/terrain/{z}/{x}/{y}.jpg';
	var stamenAttrib = 'Map tiles by <a href=\"#\" onclick=\"var ref = window.open(\'http://stamen.com\', \'_blank\');\">Stamen Design</a>, under <a href="#" onclick=\"var ref = window.open(\'http://creativecommons.org/licenses/by/3.0\', \'_blank\');\">CC BY 3.0</a>. Data by <a href="#" onclick="var ref = window.open(\'http://openstreetmap.org\', \'_blank\');">OpenStreetMap</a>, under <a href="#" onclick="var ref = window.open(\'http://creativecommons.org/licenses/by-sa/3.0\', \'_blank\');">CC BY SA</a>.';
    var stamen = new L.TileLayer(stamenUrl, { 
        								attribution: stamenAttrib,
        								detectRetina: true
                                      });

    //var googleStreets = new L.Google('ROADMAP');
    //var googleTerrain = new L.Google('TERRAIN');
    //var googleSatellite = new L.Google('HYBRID');
   
   // var bingLayer = new L.BingLayer("Ap3GmA3YzgPeVI3iSZ8yZWepLOfmyR1zR89sMmDYQUUqWmbo0uZIw9kS3WhlR7gt");
    var BingLayer = L.TileLayer.extend({
        getTileUrl: function (tilePoint) {
            this._adjustTilePoint(tilePoint);
            return L.Util.template(this._url, {
                s: this._getSubdomain(tilePoint),
                q: this._quadKey(tilePoint.x, tilePoint.y, this._getZoomForUrl())
            });
        },
        _quadKey: function (x, y, z) {
            var quadKey = [];
            for (var i = z; i > 0; i--) {
                var digit = '0';
                var mask = 1 << (i - 1);
                if ((x & mask) != 0) {
                    digit++;
                }
                if ((y & mask) != 0) {
                    digit++;
                    digit++;
                }
                quadKey.push(digit);
            }
            return quadKey.join('');
        }
    });    
    
    var bingLayer = new BingLayer('http://t{s}.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1398', {
        subdomains: ['0', '1', '2', '3', '4'],
        attribution: '&copy; <a href="#" onclick=\"var ref = window.open(\'http://bing.com/maps\', \'_blank\');\">Bing Maps</a>'
    });
    
    map = new L.Map('map',{
        //layers: [stamen, googleStreets, googleTerrain, googleSatellite],  // adds all of these at once
        fadeAnimation: true,
        doubleClickZoom: false,
       // zoomAnimation: false,
        zoomControl: false   
    });
    map.addLayer(bingLayer);

    var baseMaps = {
        "Road/Terrain": stamen,
        //"Streets": googleStreets,
        //"Terrain": googleTerrain,
        //"Satellite": googleSatellite,
        "Satellite": bingLayer
	};
    L.control.layers(baseMaps).addTo(map);
    
    map.on('contextmenu', function(e) {
       // var marker = L.marker(e.latlng).addTo(map);
       // marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
		get_elevation(e.latlng);
    });
    
    map.on('dblclick', update_all_sensors);
    
    map.setView(new L.LatLng(32.721216,-117.16896), 11);
  
     //https://github.com/lvoogdt/Leaflet.awesome-markers
    target_pin = L.marker([32.721216, -117.16896], {icon: L.AwesomeMarkers.icon({icon: 'bullseye',  prefix: 'fa',markerColor: 'red'}) }).addTo(map);
    sensor_pin = L.marker([32.721216, -117.16896], {icon: L.AwesomeMarkers.icon({icon: 'fa-location-arrow',  prefix: 'fa',markerColor: 'green'}) }).addTo(map);
}

function checkConnection() {
    var networkState = navigator.network.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.NONE]     = 'No network connection';

    if (networkState == Connection.NONE)
        alert("A data connection is required to load the map.");
    //alert('Connection type: ' + states[networkState]);
}

// my stuff
var map = null;
var sensor_pin = null;
var target_pin = null;
var compass_heading = null;
var latitude = null;
var longitude = null;
var altitude = null;
var current_position_ground_elevation = null;
var pitch = null;

var acc_valid = false;
var nav_valid = false;
var comp_valid = false;
var elevation_valid = false;

var markers_array = new Array();

function onShakeDetected(magnitude, accelerationDelta, timestamp) {
	delete_all_markers();
};

function onShakeError() {
	delete_all_markers();
};

function delete_all_markers() {
    for(i=0;i<markers_array.length;i++) {
        map.removeLayer(markers_array[i]);
    }  
}

function update_all_sensors(){
    acc_valid = false;
    comp_valid=false;
    nav_valid = false;
    elevation_valid = false;
    
    var options = {enableHighAccuracy: true};
    navigator.geolocation.getCurrentPosition(navSuccess, navError, options);
    navigator.compass.getCurrentHeading(compassSuccess, compassError);
    navigator.accelerometer.getCurrentAcceleration(accelerometerSuccess, accelerometerError);
}

function accelerometerSuccess(acceleration) {
    var x_acceleration = acceleration.x;
    var y_acceleration = acceleration.y;
    var z_acceleration = acceleration.z;
    
    var informationMessage = 'X: ' + x_acceleration.toFixed(2) +
        ' Y: ' + y_acceleration.toFixed(2) +
        ' Z: ' + z_acceleration.toFixed(2); 
    
    acc_valid = true;
    
    var GRAVITY = 9.80665;
    
    var X = x_acceleration/GRAVITY;
    var Y = y_acceleration/GRAVITY;
    var Z = z_acceleration/GRAVITY;
    
    pitch = Math.atan2(Y, Math.sqrt(X*X + Z*Z));
    check_for_all_returns();
    
    // var roll_deg = roll * 180/Math.PI;
    var pitch_deg = pitch * 180/Math.PI;
    // var message = "R: " + roll_deg.toFixed(2) + " - P: " + pitch_deg.toFixed(2);
}
function accelerometerError() {}
 
function compassSuccess(heading){
    var magneticHeading = heading.magneticHeading;
    
    comp_valid = true;
    compass_heading = heading.magneticHeading * (Math.PI/180);
    check_for_all_returns();    
}
function compassError(){}

function navSuccess(position){
    // Successfully retrieved the geolocation information. Display it all.
    
    recenterOnPhonePosition(position.coords.latitude, position.coords.longitude);
    nav_valid = true;
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    altitude = position.coords.altitude;// + position.coords.altitudeAccuracy;
    
    // make webservice call. 
    var url = "http://ec2-54-193-71-90.us-west-1.compute.amazonaws.com:8090/elevation/" + latitude + "/" + longitude;
    update_elevation(url);
    
    check_for_all_returns();
}
function navError(){}

function check_for_all_returns(){
    
    if (acc_valid && nav_valid && comp_valid && elevation_valid){
       // clearMessage();
    
		checkConnection();
        
        if (altitude < current_position_ground_elevation)
            altitude = current_position_ground_elevation + 1;
        
        // make webservice call. 
		var url = "http://ec2-54-193-71-90.us-west-1.compute.amazonaws.com:8090/ground_intersection/" + latitude + "/" + longitude + "/" + altitude + "/0.0/" + pitch + "/" + compass_heading;																	
        update_position(url, latitude, longitude);
        
        // form attitude string
        var message = "Heading: " + (compass_heading * (180/Math.PI)).toFixed(2) + "</br>Pitch: " + (pitch * (180/Math.PI)).toFixed(4);
        writeMessage(message, "resultscenter");
        
      //  navigator.notification.beep(2);
        navigator.notification.vibrate(500);
    }    
    else{
       // clearMessage();
      //  writeMessage("Waiting...");
    }
}

var ground_target;
var sensor_location;
function update_position(url, lat, lon) {
    writeMessage("Elev: - m</br> Range: - m", "resultsright");
    $.ajax({
        url: url,
        dataType: 'json',
        //error:  function(jqXHR, textStatus, errorThrown) {
        //	    alert(jqXHR.status);
        //	},
        success: function(dataWeGotViaJsonp){
            var target_latitude = dataWeGotViaJsonp["lat"];
            var target_longitude = dataWeGotViaJsonp["lng"];
            var target_elevation = dataWeGotViaJsonp["elevation"];
            var target_range = dataWeGotViaJsonp["range"];
            writeMessage("Elev: " + target_elevation.toFixed(1) + "m</br> Range: " + target_range.toFixed(1) + "m", "resultsright");
            writeMessage("SensorAlt: " + altitude.toFixed(1) + "m</br>GroundAlt: " + current_position_ground_elevation.toFixed(1) + "m", "resultsleft")

            if (target_latitude != 0 && target_longitude != 0){
                if (!target_pin) {
                    target_pin = L.marker([target_latitude,target_longitude]).addTo(map);
                }
                    
                var marker = L.marker([target_latitude,target_longitude], {icon: L.AwesomeMarkers.icon({icon: 'circle',  prefix: 'fa',markerColor: 'blue'}) }).addTo(map);
               // var marker = L.marker([target_latitude,target_longitude]).addTo(map);
                marker.bindPopup(target_elevation.toFixed(1) + " m").openPopup();
                marker.on('contextmenu', function(e) {
                    map.removeLayer(marker);
                });
                markers_array.push(marker);
                
                target_pin.setLatLng([target_latitude,target_longitude]).update();
                target_pin.setZIndexOffset(1000);
                
                if (!sensor_pin) {
                    sensor_pin = L.marker([lat,lon]).addTo(map);
                }
                sensor_pin.setLatLng([lat,lon]).update();
                target_pin.setZIndexOffset(999);
        
              //  if(target_latitude == 0 && target_longitude == 0)
                    map.setView([lat,lon]);
              //  else
              //      map.fitBounds([[lat,lon],[target_latitude,target_longitude]]);
            }
        }
    });
}

function update_elevation(url) {
    $.ajax({
        url: url,
        dataType: 'json',
        //error:  function(jqXHR, textStatus, errorThrown) {
        //	    alert(jqXHR.status);
        //	},
        success: function(dataWeGotViaJsonp){
            current_position_ground_elevation = dataWeGotViaJsonp["elevation"];
            elevation_valid = true;
            check_for_all_returns();
        }
    });
}

function get_elevation(latlng) {
    var url = "http://ec2-54-193-71-90.us-west-1.compute.amazonaws.com:8090/elevation/" + latlng.lat + "/" + latlng.lng;
    //update_elevation(url);
    $.ajax({
        url: url,
        dataType: 'json',
        //error:  function(jqXHR, textStatus, errorThrown) {
        //	    alert(jqXHR.status);
        //	},
        success: function(dataWeGotViaJsonp){
            current_position_ground_elevation = dataWeGotViaJsonp["elevation"];
            /*navigator.notification.alert(
                current_position_ground_elevation.toFixed(1) + " m",
                null, // Specify a function to be called 
                'Elevation:',
                "OK"
            );*/
          /*  var popup = L.popup()
                .setLatLng(latlng)
                .setContent(current_position_ground_elevation.toFixed(1) + " m")
                .openOn(map);*/
            var marker = L.marker(latlng, {icon: L.AwesomeMarkers.icon({icon: 'circle',  prefix: 'fa',markerColor: 'orange'}) }).addTo(map);
          	//var marker = L.marker(latlng).addTo(map);
      		marker.bindPopup(current_position_ground_elevation.toFixed(1) + " m").openPopup();
            marker.on('contextmenu', function(e) {
                map.removeLayer(marker);
            });
            markers_array.push(marker);
        }
    });
}

function writeMessage(text, id) {
    var result = document.getElementById(id);
    result.innerHTML = text;
}
    
function clearMessage(id) {
    var result = document.getElementById(id);
    result.innerText = "";
}

function recenterOnPhonePosition(latitude, longitude) { 
    var currentLocation = new L.LatLng(latitude, longitude); 
  
    sensor_pin.setLatLng(currentLocation); 
    map.setView(currentLocation); 
} 


