var ambulanceMarkers = {};	// Store ambulance markers

var statusWithMarkers = {}; //A JSON to map statuses with arrays of ambulances with that status.

// Initialize marker icons.
var ambulanceIcon = L.icon({
		iconUrl: '/static/icons/ambulance_icon.png',
		iconSize: [60, 60],
});
var ambulanceIconBlack = L.icon({
	iconUrl: '/static/icons/ambulance_icon_black.png',
	iconSize: [60, 60],
});
var hospitalIcon = L.icon({
		iconUrl: '/static/icons/hospital_icon.png',
		iconSize: [40, 40]
});

var ajaxUrl = "api/ambulances";



/**
 * This is a handler for when the page is loaded.
 */
$(document).ready(function() {
	var mymap = L.map('live-map').setView([32.5149, -117.0382], 12);


	// Add layer to map.
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoieWFuZ2Y5NiIsImEiOiJjaXltYTNmbTcwMDJzMzNwZnpzM3Z6ZW9kIn0.gjEwLiCIbYhVFUGud9B56w', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox.streets',
		accessToken: 'pk.eyJ1IjoieWFuZ2Y5NiIsImEiOiJjaXltYTNmbTcwMDJzMzNwZnpzM3Z6ZW9kIn0.gjEwLiCIbYhVFUGud9B56w'
	}).addTo(mymap);

	// Add hospital marker.
	L.marker([32.506787, -116.963839], {icon: hospitalIcon}).addTo(mymap);

    // Add the drawing toolbar and the layer of the drawings.
	var drawnItems = new L.FeatureGroup();
    mymap.addLayer(drawnItems);
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        }
    });
    mymap.addControl(drawControl);
    
    // Event handler for when something is drawn. Only handles 
    // when a new drawing is made for now.
    mymap.on(L.Draw.Event.CREATED, function (e) {
    	var type = e.layerType;
        layer = e.layer;
   		if (type === 'marker') {
       	// Do marker specific actions
   		}
   		// Do whatever else you need to. (save to db; add to map etc)
   		mymap.addLayer(layer);
	});

    // Update the ambulances on the map.
   	updateAmbulances(mymap);

    // Calling for ambulance updates every second.
	window.setInterval(function() {
		updateAmbulances(mymap);
	}, 1000);


	// Open popup on panel click.
	$('.ambulance-panel').click(function(){
		var id = $(this).attr('id');

		// Center icon on map
		var position = ambulanceMarkers[id].getLatLng();
		mymap.setView(position, 12);

		// Open popup for 2.5 seconds.
		ambulanceMarkers[id].openPopup();
		setTimeout(function(){
			ambulanceMarkers[id].closePopup();
		}, 2500);
	});


});

var firstUpdate = true; // Flags if this is the first update to the map (initial update).
var layergroups = {}; // The layer groups that will be part of the map.
/*
 * updateAmbulances updates the map with the new ambulance's status.
 * @param mymap is the map UI.
 * @return void.
 */
function updateAmbulances(mymap) {
	console.log('ajax request sent');
	console.log(ajaxUrl);
	$.ajax({
		type: 'GET',
		datatype: "json",
		url: ajaxUrl,
		success: function(arr) {
			statusWithMarkers = {}; // clear all statuses from previous ajax call.
			var i = 0;
			$.each(arr, function(index, item) {
				if(typeof ambulanceMarkers[item.id] == 'undefined' ){
					// set icon by status
					let coloredIcon = ambulanceIcon;
					if(item.status !== 'Active')
						coloredIcon = ambulanceIconBlack;

					ambulanceMarkers[item.id] = L.marker([item.location.latitude, item.location.longitude], {icon: coloredIcon})
					.bindPopup("<strong>Ambulance " + item.id + "</strong><br/>" + item.status).addTo(mymap);

			    	// Bind id to icons
					ambulanceMarkers[item.id]._icon.id = item.id;
					// Collapse panel on icon hover.
					ambulanceMarkers[item.id].on('mouseover', function(e){
							$('#collapse' + this._icon.id).collapse('show');
							this.openPopup().on('mouseout', function(e){
							$('#collapse' + this._icon.id).collapse('hide');
							this.closePopup();
						});
					}); 
			    }

			    // Update ambulance location
				ambulanceMarkers[item.id] = ambulanceMarkers[item.id].setLatLng([item.location.latitude, item.location.longitude]).update();
				ambulanceMarkers[item.id]._popup.setContent("<strong>Ambulance " + item.id + "</strong><br/>" + item.status);

				//Add to a map to differentiate the layers between statuses.
				if(statusWithMarkers[item.status]){
					statusWithMarkers[item.status].push(ambulanceMarkers[item.id]);
				}
				else{
					statusWithMarkers[item.status] = [ambulanceMarkers[item.id]];
				}


			 

			});
			
			// This is for the first update of the map.
			if(firstUpdate){

				// Add the checkbox on the top right corner for filtering.
				var container = L.DomUtil.create('div', 'filter-options');

				//Generate HTML code for checkboxes for each of the statuses.
				var filterHtml = "";
				$.get('api/status', function(statuses) {
					statuses.forEach(function(status){
						if(statusWithMarkers[status.name] !== undefined) {
							console.log(status.name);
							layergroups[status.name] = L.layerGroup(statusWithMarkers[status.name]);
							layergroups[status.name].addTo(mymap);
						}
						filterHtml += '<div class="checkbox"><label><input class="chk" data-status="' + status.name + '" type="checkbox" value="">' + status.name + "</label></div>";
					});
					// Append html code on success callback function
					container.innerHTML = filterHtml;
					// Initialize checked to true for all statuses.
					$('.chk').attr('checked', true);
				});

				// Add the checkboxes.
				var customControl = L.Control.extend({
 
  					options: {
    					position: 'topright' 
    					//control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  					},
 
  					onAdd: function (map) {
    					return container;
 					}
 
				 });
				 mymap.addControl(new customControl());

				 firstUpdate = false;

				 // Listener to see if a click on a checkbox leads to a check. If so,
				 // remove the layer from the map.
				 $('.chk').each(function(){
				 	console.log(this);
				 	$(this).change(function(){
				 		    console.log("Clicked!!!");
                			if(!($(this).is(':checked'))){
                				console.log("Clicked!");
                				var layersToRemove = statusWithMarkers[this.dataset.status];
                				console.log(layersToRemove);
                				for(var i = 0; i < layersToRemove.length; i++){
                					mymap.removeLayer(layersToRemove[i]);
                				}
                			}
				 	});

			    });


			}

			else{
				// Goes through each layer group and adds or removes accordingly.
				Object.keys(layergroups).forEach(function(key){
					layergroups[key].clearLayers();
					console.log(layergroups);
					for(var i = 0; i < statusWithMarkers[key].length; i++){
						// Add the ambulances in the layer if it is checked.
						if($(".chk[data-status='" + key + "']").is(':checked')){
							layergroups[key].addLayer(statusWithMarkers[key][i])
						}
						// Remove from layer if it is not checked.
						else{
							layergroups[key].removeLayer(statusWithMarkers[key][i]);
							mymap.removeLayer(statusWithMarkers[key][i]);
						}
					}

			});

			}
		

		}
	});
}