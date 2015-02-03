'use strict';


/**
 * controller for map on entry page
 */
analyticsControllers.controller('OLMapController', ['$scope', '$attrs',  '$location', 'EntrySvc',
    function($scope, $attrs, $location, EntrySvc) {
		var self = this;
		this.mapElement = null;
		this.slider = null;
		this.sliderTicks = null;
		this.map = null;
		this.citiesLayer = null;
		this.countriesLayer = null;
		
		this.init = function init (element) {
			self.mapElement = element;
			
			// create map
			self.map = new OpenLayers.Map('map', {theme: null});
	
			// create OSM layer
			var osm = new OpenLayers.Layer.OSM();
			// add target so we won't try to open in frame
			osm.attribution = "&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors";
			osm.url = [
			           $location.protocol() + '://a.tile.openstreetmap.org/${z}/${x}/${y}.png',
			           $location.protocol() + '://b.tile.openstreetmap.org/${z}/${x}/${y}.png',
			           $location.protocol() + '://c.tile.openstreetmap.org/${z}/${x}/${y}.png'
			           ];
			
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
				change: self.sliderChangeHandler,
				slide: function (event, ui) {
					d = new Date(ui.value*1000);
					angular.element('#maptip .tooltip-inner').text(self.formatTime(d));
					angular.element('#maptip').css('left', $(ui.handle).css('left'));
					angular.element('#maptip').removeClass('hidden');
			    }
			});

			angular.element('#mapslider .ui-slider-handle').mouseleave(function() {
				angular.element('#maptip').addClass('hidden');
				angular.element('#maptip .tooltip-inner').text("");
				angular.element('#maptip').css('left', $(this).css('left'));
			});
		
			// create ticks
			self.sliderTicks = angular.element('#sliderticks');
			self.createSliderTicks(t-12960, t);
			
		};


		$scope.$on('gotoTime', function (event, time) {
			// show required time data on map
			self.slider.slider("option", "value", time);
		});



		/**
		 * event handler for the slider drag
		 */
		this.sliderChangeHandler = function sliderChangeHandler(event, ui) {
			angular.element('#maptip').addClass('hidden');
			angular.element('#maptip .tooltip-inner').text("");
			self.getMapData(ui.value);
		};
		
		
		/**
		 * @param min, max - timestamp (seconds)
		 */
		this.createSliderTicks = function createSliderTicks(min, max) {
			// remove existing ticks
			self.sliderTicks.html('');
			// create new ticks
			var step, left, label, range = max-min, cnt = 6;
			for (var i = 0; i<cnt; i++) {
				step = i / cnt;
				label = min + range * step;
				var d = new Date(Math.floor(label*1000));
				label = self.formatTime(d);
				left = step * 100;
				self.createSliderTick(left + '%', label);
			}

		};
		
		
		this.createSliderTick = function createSliderTick(left, txt) {
			var element = document.createElement('div');
			element.style.left = left;
			element.classList.add('slidertick');
			var title = document.createElement('div');
			title.classList.add('title');
			title.innerHTML = txt;
			element.appendChild(title);
			self.sliderTicks[0].appendChild(element);
		};
		
		this.formatTime = function formatTime(d) {
			return d.toString().match(/(\d+:\d+:\d+)/)[1];
		};
		
		
		/**
		 * create a style map for the dots
		 * @param min the smallest data point value
		 * @param max the largest data point value
		 */
		this.createStyleMap = function createStyleMap(min, max) {
			var sRadius = 4;
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
					if (val == 0) continue; // leave out points where audience is zero - we got them because they have plays)
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
			self.createSliderTicks(min+n, newmax);
		};
		
		
		/**
		 * event handler for main screen update interval
		 * @param event
		 * @param timestamp (seconds)
		 */
		this.updateScreenHandler = function updateScreenHandler(event, time) {
			time -= 60; // we only have data about 60 seconds back, so we adjust what we got  
			var val = self.slider.slider("option", "value"); // current slider value 
			var max = self.slider.slider("option", "max"); // max slider value
			if (val == max) {
				// we are at the right edge, auto update
				//self.getMapData(time); // adjusting the slider will also trigger the update
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
			self.createSliderTicks(start, end);
		};
		
		$scope.$on('setupScreen', self.updateScreenHandler);
		$scope.$on('updateScreen', self.updateScreenHandler);
		$scope.$on('TimeBoundsSet', self.timeBoundsSetHandler);
		
}]);

