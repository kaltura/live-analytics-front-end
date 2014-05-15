'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers'); // get, don't create!!

/**
 * controller for KDP on entry page
 */
analyticsControllers.controller('KPlayerController', ['$scope', '$attrs',  
    function($scope, $attrs) {
		var self = this;
		this.playerElement = null;
  		
  		this.init = function init (element) {
  			self.playerElement = element;
  		};


  		$scope.$watch('playerEntryId', function( value ) {
  			if (value) {
  				if (value != -1) {
		  			kWidget.embed({
		            	"targetId": "kplayer", 
		            	"wid": "_" + $scope.pid, 
		              	"uiconf_id": $scope.uiconfId, 
		              	"entry_id": value, 
		              	"flashvars": { 
		              		"streamerType": "auto" 
		              	} 
		            });
  				} else {
  					self.playerElement.html('<h3>Live Session Was Not Recorded</h3>');
  				}
	  		}
  		});
}]);


/**
 * controller for map on entry page
 */
analyticsControllers.controller('OLMapController', ['$scope', '$attrs',  'EntrySvc',
    function($scope, $attrs, EntrySvc) {
		var self = this;
		this.mapElement = null;
		this.slider = null;
		this.map = null;
		this.citiesLayer = null;
		this.countriesLayer = null;
		
		this.init = function init (element) {
			self.mapElement = element;
			
			// create map
			self.map = new OpenLayers.Map('map');
	
			// create OSM layer
			var osm = new OpenLayers.Layer.OSM();
			
			
			self.map.addLayer(osm);
			self.map.zoomToMaxExtent();
			
			self.map.events.register('zoomend', this, function (event) {
		        var zLevel = self.map.getZoom();     
		        if( zLevel < 4)
		        {
		        	// show countries
		            self.citiesLayer.setVisibility(false);
		            self.countriesLayer.setVisibility(true);
		        }
		        else {
		        	// show cities
		        	self.citiesLayer.setVisibility(true);
		            self.countriesLayer.setVisibility(false);
		        }
		    });
			
			// create slider
			var d = new Date();
			var t = d.getTime();
			self.slider = angular.element('#mapslider');
			self.slider.slider({
				max: t, 
				min: t - 129600000, 
				value: t, 
				step: 10000,
				change: self.sliderChangeHandler
			});
		};
		
		
		/**
		 * event handler for the slider drag
		 */
		this.sliderChangeHandler = function sliderChangeHandler(event, ui) {
			self.getMapData(ui.value);
		};
		
		this.createStyleMap = function createStyleMap() {
			// style
			var style = new OpenLayers.Style({
				pointRadius: "${radius}",
				fillColor: "#ffcc66",
				fillOpacity: 0.8,
				strokeColor: "#cc6633",
				strokeWidth: 2,
				strokeOpacity: 0.8,
				title : "${tooltip}"
			},
			{
				context: {
					radius: function(feature) {
						return feature.attributes.data / 100;
					},
					tooltip: function(feature) {
						return feature.attributes.text+ " " + feature.attributes.data;
					}
				}
			}
			);
			
			// create a styleMap with a custom default symbolizer
			var styleMap = new OpenLayers.StyleMap({
				"default": style,
				"select": {
					fillColor: "#8aeeef",
					strokeColor: "#32a8a9"
				}
			});
			
			return styleMap;
		};
		
		
		/**
		 * get data to display on map
		 * @param time unix timestamp. if null, current time is used.
		 */
		this.getMapData = function getMapData(time) {
			EntrySvc.getMap($scope.entryId, time).then(function(data) {
				self.displayData(data.objects);
			});
			
		};
		
		
		/**
		 * recreate data layers on map
		 * @param value array of KalturaGeoTimeLiveStats
		 */
		this.displayData = function displayData(value) {
			if (value) { 
				// remove existing layers
				if (self.citiesLayer) {
					self.map.removeLayer(self.citiesLayer);
				}
				if (self.countriesLayer) {
					self.map.removeLayer(self.countriesLayer);
				}
				
				// process data to create new layers
				var countriesData = {};
				var features = new Array();
				var point;
				for ( var i = 0; i < value.length; i++) {
					// accumulate data for country-level layer
					if (!countriesData[value[i].country.name]) { 
						// init - keep whole value for lat/long
						countriesData[value[i].country.name] = value[i];  
					}
					else {
						// sum audience
						countriesData[value[i].country.name]['audience'] += value[i].audience;
					}
					point = new OpenLayers.Geometry.Point(value[i].city.longitude, value[i].city.latitude).transform('EPSG:4326', 'EPSG:3857');
					features[i] = new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : value[i].audience,
								"text" : value[i].city.name
							}
							);
				}
				
				// create cities layer
				var layer = self.citiesLayer = new OpenLayers.Layer.Vector('Cities', {
					"projection": "EPSG:3857",
					"visibility" : self.map.zoom > 3,
					"styleMap" : self.createStyleMap()
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				// create countries layer
				features = new Array();
				for (var key in countriesData) {
					point = new OpenLayers.Geometry.Point(countriesData[key].country.longitude, countriesData[key].country.latitude).transform('EPSG:4326', 'EPSG:3857');
					features.push(new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : countriesData[key].audience,
								"text" : countriesData[key].country.name
							}
							));
				}
				
				// create countries layer
				layer = self.countriesLayer = new OpenLayers.Layer.Vector('Countries', {
					"projection": "EPSG:3857",
					"visibility" : self.map.zoom < 4,
					"styleMap" : self.createStyleMap()
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				layer.refresh();
			}
		};
		
		
		this.adjustSlider = function adjustSlider(oldmax, newmax, val) {
			var n = newmax - oldmax;
			var min = self.slider.slider("option", "min");
			self.slider.slider("option", "max", newmax);
			self.slider.slider("option", "min", min + n);
			if (val) {
				self.slider.slider("option", "value", val);
			}
		};
		
		
		/**
		 * event handler for main screen update interval
		 */
		this.updateScreenHandler = function updateScreenHandler(event, time) {
			var val = self.slider.slider("option", "value"); // current slider value 
			var max = self.slider.slider("option", "max"); // max slider value
			if (val == max) {
				// we are at the right edge, auto update
				self.getMapData(time);
				// update scrollbar and handle (keep handle on right edge)
				self.adjustSlider(max, time, time);
			}
			else {
				// update range 
				self.adjustSlider(max, time);
			}
		};
		
		$scope.$on('setupScreen', self.updateScreenHandler);
		$scope.$on('updateScreen', self.updateScreenHandler);
		
}]);


/**
 * controller for (rickshaw) graph on entry page
 */
analyticsControllers.controller('RGraphController', ['$scope', '$attrs', 'EntrySvc', 
    function($scope, $attrs, EntrySvc) {
		var self = this;
		this.graphElement = null; // HTML element showing the graph
		this.graph = null;	// graph JS object
		this.series = null;
		
		this.init = function init (element) {
			self.graphElement = element;
			var d = new Date();
			self.series = [ 
			    {
					color : 'steelblue',
					data : [ {x:d.getTime(), y:0} ],
					name : "Line 1"
				}
			];


			var graph = self.graph = new Rickshaw.Graph({
				element : element[0].children[0],
				width : element.width(),
				height : element.height() - 20,
				renderer : 'line',
				series : self.series
			});
			graph.render();

			var preview = new Rickshaw.Graph.RangeSlider({
				graph : graph,
				element : element[0].children[1]
			});

			var xAxis = new Rickshaw.Graph.Axis.Time({
				graph : graph,
				ticksTreatment : 'glow',
				timeFixture : new Rickshaw.Fixtures.Time.Local()
			});
			xAxis.render();

			var yAxis = new Rickshaw.Graph.Axis.Y({
				graph : graph,
				tickFormat : Rickshaw.Fixtures.Number.formatKMBT,
				ticksTreatment : 'glow'
			});
			yAxis.render();
			

			

			var hoverDetail = new KHoverDetail( {
			    graph: graph,
			    formatter: function(series, x, y, formattedXValue, formattedYValue, point) {
			    	return y + ' views'; 
			    },
				onClick : function (time) {
					alert(time);
				}
			} );
		};
		
		
		/**
		 * get graph data for the last 36 hrs 
		 * @param end of 36 hrs term (timestamp)
		 */
		this.getGraph36Hrs = function getGraph36Hrs(toDate) {
			var fromDate = toDate - 129600000; // 60000 ms per minute * 60 minutes per hour * 36 hrs 
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				if (data.objects.length > 0 && self.graph != null) {
					var objects = data.objects;
					objects.forEach(function (stat) {
						// re-shape data so rickshaw can understand it
						stat.y = stat.audience;
						stat.x = stat.timestamp;
					});
					self.resetGraphContent(objects);
				};
			});
		};
		
		
		/**
		 * get graph data for the last 30 secs 
		 * @param endTime (timestamp) get graph data for 30 secs up to this time
		 */
		var getGraph30Secs = function getGraph30Secs(endTime) {
			var toDate = endTime;
			var fromDate = toDate - 40000;
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				var objects = data.objects;
				if (data.objects.length > 0) {
					objects.forEach(function (stat) {
						// re-shape data so rickshaw can understand it
						stat.y = stat.audience;
						stat.x = stat.timestamp;
					});
				};
				
				if (self.graph != null) {
					self.updateGraphContent(objects);
				}
			});
		};
		
		
		/**
		 * remove all previous data and set new 
		 * @param value
		 */
		this.resetGraphContent = function resetGraphContent(value) {
			var ar = self.series[0].data;
			while (ar.length > 0) {
				ar.pop();
			}
			for ( var i = 0; i < value.length; i++) {
				ar.push(value[i]);
			}
			self.graph.update();
		};
		
		
		/**
		 * add new data and purge oldest so we keep only 36 hrs
		 * @param value
		 */
		this.updateGraphContent = function updateGraphContent(value) {
			var ar = self.series[0].data;
			// find matching point in 'ar'
			var lastX = ar[ar.length-1].x;
			for (var i = value.length-1; i>0; i--) {
				if (value[i].x == lastX) {
					break;
				}
			}
			// now i+1 is the index of the first element in 'value' that needs to be inserted to 'ar'
			// add required elements from value to ar, while removing elements from tail
			i++;
			while(i<value.length) {
				ar.shift();
				ar.push(value[i]);
				i++;
			}
			self.graph.update();
		};
		
		
		/**
		 * event handler for main screen setup event
		 */
		this.setupScreenHandler = function setupScreenHandler(event, time) {
			self.getGraph36Hrs(time);
		};
		
		
		/**
		 * event handler for main screen update interval
		 */
		this.updateScreenHandler = function updateScreenHandler(event, time) {
			getGraph30Secs(time);
		};
	
		$scope.$on('setupScreen', self.setupScreenHandler);
		$scope.$on('updateScreen', self.updateScreenHandler);
}]);