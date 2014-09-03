'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers'); // get, don't create!!

/**
 * controller for KDP on entry page
 */
analyticsControllers.controller('KPlayerController', ['$scope', '$attrs', '$interval', 
    function($scope, $attrs, $interval) {
		var self = this;
		this.playerElement = null;
  		
  		this.init = function init (element) {
  			self.playerElement = element;
  		};
  		
  		$scope.$on('gotoTime', function (event, time) {
  			// translate timestamp to entry time, go to correct time.
  			var playerTime = time - $scope.entry.firstBroadcast;
  			var kdp = angular.element('#kplayer')[0];
  			kdp.sendNotification("doSeek", playerTime);

  		});


  		$scope.$watch('playerEntryId', function( value ) {
  			function embedNow() {
  				kWidget.embed({
  					"targetId": "kplayer", 
  					"wid": "_" + $scope.pid, 
  					"uiconf_id": $scope.uiconfId, 
  					"entry_id": value, 
  					"flashvars": { 
  						"streamerType": "rtmp" //TODO should eventually be "auto"
  					} 
  				});
  			};
  			if (value) {
  				if (value != -1) {
  					if (window.playerLibLoaded) {
			  			embedNow();
  					}
  					else {
  						// setTimeout until loaded
  						$scope.playerIntervalPromise = $interval(function() {
  							if (window.playerLibLoaded) {
  								$interval.cancel($scope.playerIntervalPromise);
  								$scope.playerIntervalPromise = undefined;		
  								embedNow();
  							}
  						}, 500);
  					}
  				} else {
  					self.playerElement.html('<h3>Live Session Was Not Recorded</h3>');
  				}
  				$scope.playerEntryId = null;
	  		}
  		});
  		
  		$scope.$on('$destroy', function() {
			// Make sure that the interval is destroyed too
			if (angular.isDefined($scope.playerIntervalPromise)) {
				$interval.cancel($scope.playerIntervalPromise);
				$scope.playerIntervalPromise = undefined;
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
			self.map = new OpenLayers.Map('map', {theme: null});
	
			// create OSM layer
			var osm = new OpenLayers.Layer.OSM();
			
			
			self.map.addLayer(osm);
			self.map.zoomToMaxExtent();
			
			self.map.events.register('zoomend', this, function (event) {
				if (!self.citiesLayer) return; // if no layers no need to toggle.
				
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
			var t = Math.floor(d.getTime() / 1000);
			self.slider = angular.element('#mapslider');
			self.slider.slider({
				max: t, 
				min: t - 129600, // 36 hrs
				value: t, 
				step: 10,
				change: self.sliderChangeHandler
			});
		};
		
		
		/**
		 * event handler for the slider drag
		 */
		this.sliderChangeHandler = function sliderChangeHandler(event, ui) {
			self.getMapData(ui.value);
		};
		
		
		/**
		 * create a style map for the dots
		 * @param min the smallest data point value
		 * @param max the largest data point value
		 */
		this.createStyleMap = function createStyleMap(min, max) {
			var sRadius = 2;
			var lRadius = 10;
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
						// data point size normalization
						if (max == min) return lRadius;
						return lRadius - ((max - feature.attributes.data) * (lRadius - sRadius) / (max - min));
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
		 * @param time unix timestamp (seconds). if null, current time is used.
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
			// remove existing layers
			if (self.citiesLayer) {
				self.map.removeLayer(self.citiesLayer);
				self.citiesLayer = null;
			}
			if (self.countriesLayer) {
				self.map.removeLayer(self.countriesLayer);
				self.countriesLayer = null;
			}
			if (value) { 
				// process data to create new layers
				var countriesData = {};
				var features = new Array();
				var point;
				var min = 0;
				var max = 0;
				for ( var i = 0; i < value.length; i++) {
					var val = parseInt(value[i].audience, 10); // convert string to int
					// accumulate data for country-level layer
					if (!countriesData[value[i].country.name]) { 
						// init - keep whole value for lat/long
						countriesData[value[i].country.name] = value[i];
						countriesData[value[i].country.name]['audience'] = val; 
					}
					else {
						// sum audience
						countriesData[value[i].country.name]['audience'] += val;
					}
					point = new OpenLayers.Geometry.Point(value[i].city.longitude, value[i].city.latitude).transform('EPSG:4326', 'EPSG:3857');
					features[i] = new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : val,
								"text" : value[i].city.name
							}
							);
					
					// update cities min-max
					if (min == 0 || val < min) {
						min = val;
					}
					if (val > max) {
						max = val;
					}
				}
				
				// create cities layer
				var layer = self.citiesLayer = new OpenLayers.Layer.Vector('Cities', {
					"projection": "EPSG:3857",
					"visibility" : self.map.zoom > 3,
					"styleMap" : self.createStyleMap(min, max)
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				// create countries layer
				min = max = 0;
				features = new Array();
				for (var key in countriesData) {
					var val = parseInt(countriesData[key].audience, 10);
					point = new OpenLayers.Geometry.Point(countriesData[key].country.longitude, countriesData[key].country.latitude).transform('EPSG:4326', 'EPSG:3857');
					features.push(new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : val,
								"text" : countriesData[key].country.name
							}
							));
					// update countries min-max
					if (min == 0 || val < min) {
						min = val;
					}
					if (val > max) {
						max = val;
					}
				}
				
				// create countries layer
				layer = self.countriesLayer = new OpenLayers.Layer.Vector('Countries', {
					"projection": "EPSG:3857",
					"visibility" : self.map.zoom < 4,
					"styleMap" : self.createStyleMap(min, max)
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
		 * @param event
		 * @param timestamp (seconds)
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
		
		this.timeBoundsSetHandler = function timeBoundsSetHandler(event, start, end) {
			start = parseInt(start, 10);
			end = parseInt(end, 10);
			var val = self.slider.slider("option", "value"); // current slider value 
			var max = self.slider.slider("option", "max"); // max slider value
			if (val == max) {
				// we are at the right edge, stay there
				self.slider.slider("option", "max", end);
				self.slider.slider("option", "min", start);
				self.slider.slider("option", "value", end);
			}
			else {
				var updateVal = false;
				if (val < start) {
					val = start;
					updateVal = true; 
				}
				if (val > end) {
					val = end;
					updateVal = true;
				}
				self.slider.slider("option", "max", end);
				self.slider.slider("option", "min", start);
				if (updateVal) {
					self.slider.slider("option", "value", val);
				}
			}
		};
		
		$scope.$on('setupScreen', self.updateScreenHandler);
		$scope.$on('updateScreen', self.updateScreenHandler);
		$scope.$on('TimeBoundsSet', self.timeBoundsSetHandler);
		
}]);


/**
 * controller for (rickshaw) graph on entry page
 */
analyticsControllers.controller('RGraphController', ['$scope', '$attrs', 'EntrySvc', 
    function($scope, $attrs, EntrySvc) {
		var self = this;
		var graphElement = null; 	// HTML element showing the graph
		var graph = null;			// graph JS object
		var series = null;			// data container
		
		this.init = function init (element) {
			graphElement = element;
			var d = new Date();
			var t = d.getTime()/1000;
			series = [{
					color : 'steelblue',
					data : [ {x:t, y:0} ],
					name : "Line 1"
				}];

			graph = createGraph(series, element);
		};
		
		var isRecordedEntry = function isRecordedEntry() {
			return !$scope.entry.isLive && $scope.entry.recordedEntryId && $scope.entry.recordedEntryId != ''; 
		};
		
		var graphClickHandler = function graphClickHandler(time) {
			if (isRecordedEntry()) {
				// click - only for recorded entries that are not currently live
				$scope.$emit('gotoTime', time);
			}
		};
		
		/**
		 * create graph and its parts
		 * @param series
		 * @param element
		 * @return rickshaw graph 
		 */
		var createGraph = function createGraph(series, element) {
			var graph = new Rickshaw.Graph({
				element : element[0].children[0],
				width : element.width(),
				height : element.height() - 20,
				renderer : 'line',
				interpolation: 'linear',
				series : series
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
				onClick : graphClickHandler
			} );
			
			return graph;
		};
		
		
		/**
		 * @param str	info string
		 * @return array [{x, y}, ..]
		 */
		var parseData = function parseData(str) {
			var os = str.split(';');
			var objects = new Array();
			os.forEach(function (sLine) {
				if (sLine) {
					var vals = sLine.split(',');
					objects.push({'x':parseInt(vals[0], 10), 'timestamp':parseInt(vals[0], 10), 'y':parseInt(vals[1], 10)});
				}
			});
			return objects;
		};
		
		/**
		 * get graph data for the last 36 hrs 
		 * @param end of 36 hrs term (timestamp sec)
		 */
		var getGraph36Hrs = function getGraph36Hrs(toDate) {
			var fromDate = toDate - 129600; // 60 sec per minute * 60 minutes per hour * 36 hrs 
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				if (data[0] && data[0].data && graph != null) {
					// parse string into objects
					var objects = parseData(data[0].data);
					if (!$scope.entry.isLive) {
						var firstBroadcast = parseInt($scope.entry.firstBroadcast, 10);
						// trim data edges: 
						for (var i = 0; i<objects.length; i++) {
							if (objects[i].timestamp >= firstBroadcast) {
								break;
							}
						}
						for (var j = objects.length - 1; j>=0; j--) {
							if (objects[j].value != 0) {
								j++;
								break;
							}
						}
						objects = objects.slice(i, j);
						$scope.$emit('TimeBoundsSet', objects[0].timestamp, objects[objects.length - 1].timestamp);
					}
					resetGraphContent(objects);
				};
			});
		};
		
		
		/**
		 * get graph data for the last 30 secs 
		 * @param endTime (timestamp sec) get graph data for 30 secs up to this time
		 */
		var getGraph30Secs = function getGraph30Secs(endTime) {
			var toDate = -2;	//endTime;
			var fromDate = -60; //toDate - 40;
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				var objects = parseData(data[0].data);
				if (graph != null) {
					updateGraphContent(objects);
				}
			});
		};
		
		
		/**
		 * remove all previous data and set new 
		 * @param value
		 */
		var resetGraphContent = function resetGraphContent(value) {
			var ar = series[0].data;
			while (ar.length > 0) {
				ar.pop();
			}
			for ( var i = 0; i < value.length; i++) {
				ar.push(value[i]);
			}
			graph.update();
		};
		
		
		/**
		 * add new data and purge oldest so we keep only 36 hrs
		 * @param value
		 */
		var updateGraphContent = function updateGraphContent(value) {
			var ar = series[0].data; // already in the graph
			var lastArX = ar[ar.length-1].x;
			// first see if any existing values need to be updated
			for (var i = 0; i<value.length; i++) {
				var valX = value[i].x;
				if (valX <= lastArX) {
					for (var j = ar.length-1; j>0; j--) {
						if (ar[j].x == valX) {
							ar[j].y = value[i].y;
							break;
						}
						else if (ar[j].x < valX) {
							// j will only become smaller
							break;
						}
					}
				}
				else {
					// valX is out of ar bounds, will be so for any larger i
					break;
				}
			}
			// then shift/push for new ones
			while(i < value.length) {
				ar.shift();
				ar.push(value[i]);
				i++;
			}
			
			graph.update();
		};
		
		
		/**
		 * event handler for main screen setup event
		 * @param event
		 * @param time (timestamp sec)
		 */
		var setupScreenHandler = function setupScreenHandler(event, time) {
			getGraph36Hrs(time);
		};
		
		
		/**
		 * event handler for main screen update interval
		 * @param event
		 * @param time (timestamp sec)
		 */
		var updateScreenHandler = function updateScreenHandler(event, time) {
			getGraph30Secs(time);
		};
	
		$scope.$on('setupScreen', setupScreenHandler);
		$scope.$on('updateScreen', updateScreenHandler);
}]);