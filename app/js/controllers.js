'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers', []);

/**
 * Dashboard Controller 
 */
analyticsControllers.controller('DashboardCtrl', ['$scope', 'KApi', 'DashboardSvc', 
    function($scope, KApi, DashboardSvc) {
		
		/**
		 * entries currently on display
		 */
		var entries = [];
		
		/**
		 * number of entries in page
		 */
		var pageSize = 5;
		
		/**
		 * total number of pages
		 */
		var totalPages = 1;
		
		var updatePagingControlRequired = true;
		
		
		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates(liveOnly) {
			DashboardSvc.getAggregates(liveOnly).then (function(data) {
				var o = data.objects[0];
				var results = [
				           	{"title": "audience", "value": liveOnly ? o.audience : o.plays},
				        	{"title": "seconds_viewed", "value": o.secondsViewed},
				        	{"title": "buffertime", "value": o.bufferTime},
				        	{"title": "bitrate", "value": o.avgBitrate}
				        ]; 
				
				$scope.aggregates = results;
			});
		};
		
		
		/**
		 * @param liveOnly	fetch KalturaLive currently live (true) or all live entries (false)
		 * @param page		index of page to fetch
		 */
		var getEntries = function getEntries(liveOnly, pageNumber) {
			var result;
			if (liveOnly) {
				result = DashboardSvc.getLiveEntries(pageNumber); 
			}
			else {
				result = DashboardSvc.getAllEntries(pageNumber); 
			}
			 
			result.then(function(data) {
				$scope.entries = data.objects;
				totalPages = Math.ceil(data.totalCount/pageSize);
				if (updatePagingControlRequired) {
					updatePagingControl(pageNumber, totalPages);
					updatePagingControlRequired = false;
				}
			});
		}
		
		
		/**
		 * get entries data by page
		 * @param e
		 * @param oldPage
		 * @param newPage
		 */
		var doPaging = function doPaging(e,oldPage,newPage) {
			getEntries($scope.boardType == "liveOnly", newPage);
		};
		
		
		/**
		 * update paging control
		 * @param current	index of current page
		 * @param total		total number of pages
		 */
		var updatePagingControl = function updatePagingControl(current, total) {
			var options = {
	                currentPage: current,
	                totalPages: total,
	            }
	        $('#pagination').bootstrapPaginator(options);
		}
		
		// (analytics) entry stats for live entries by ids 
		// (analytics) entry stats for not-live entries by ids
		// return:
		// [{entryId, name, audience, peakAudience, minutes, bufferTime, bitrate, startTime, isLive, thumbnailUrl}, ..]
		
		
		var screenSetup = function screenSetup() {
			// set report dates:
			var d = new Date();
			$scope.nowTime = d;
			d = new Date();
			d.setHours(d.getHours() - 36);
			$scope.reportStartTime = d;
			
			var options = {
					bootstrapMajorVersion: 3,
					onPageChanged: doPaging,
					shouldShowPage:function(type, page, current){
		                switch(type) {
		                    case "first":
		                    case "last":
		                        return false;
		                    default:
		                        return true;
		                }
		            },
		            alignment: 'center',
		            currentPage: 1,
		            totalPages: totalPages
		    };
	
		    $('#pagination').bootstrapPaginator(options);
		    
		    $scope.boardType = "all";
			$scope.$watch("boardType", function(newValue, oldValue) {
				getAggregates(newValue == "liveOnly");
	    		getEntries(newValue == "liveOnly", 1);
				updatePagingControlRequired = true;
			 });
		}
		
		screenSetup();
		
    }]);

analyticsControllers.controller('EntryCtrl', ['$scope', '$routeParams', '$interval', 'EntrySvc', 
    function($scope, $routeParams, $interval, EntrySvc) {
		$scope.entryId = $routeParams.entryid;
		$scope.pid = 346151;
		$scope.uiconfId = 22767782;
		$scope.playerEntryId = '';
		$scope.graphdata = [];
		$scope.additionalgraphdata = [];
		
		

		/**
		 * get data for the aggregates line
		 * @param isLive is the entry currently broadcasting
		 */
		var getAggregates = function getAggregates(isLive) {
			EntrySvc.getAggregates($scope.entryId, isLive).then (function(data) {
				var o = data.objects[0];
				var results = [
				           	{"title": "audience", "value": isLive ? o.audience : o.plays},
				        	{"title": "seconds_viewed", "value": o.secondsViewed},
				        	{"title": "buffertime", "value": o.bufferTime},
				        	{"title": "bitrate", "value": o.avgBitrate}
				        ]; 
				
				$scope.aggregates = results;
				getReferrers(isLive ? o.audience : o.plays);
			});
		};
		
		
		/**
		 * get data for the top referrals table
		 */
		var getReferrers = function getReferrers(totalPlays) {
			EntrySvc.getReferrers($scope.entryId).then (function(data) {
				var objects = data.objects;
				var results = new Array();
				var o;
				for (var i = 0; i<objects.length; i++) {
					o = {
							'domain': objects[i].referrer, 
							'visits': objects[i].plays, 
							'percents' : objects[i].plays / totalPlays
						}; 
					results.push(o);
				}
				$scope.referals = results;
			});
		};
		
		
		/**
		 * get the entry in question
		 */
		var getEntry = function getEntry() {
			return EntrySvc.getEntry($scope.entryId).then(function(entry){
				$scope.entry = entry;
				$scope.mapData = 'lll'; 
				if (entry.isLive) {
					// live session - show live entry in player
					$scope.playerEntryId = entry.id;
					// set 30 secs update interval
					$interval(function() {screenUpdate()}, 30000);
				}
				else if (entry.recordedEntryId && entry.recordedEntryId != '') {
					// session ended, got recording - show recorded entry in player
					$scope.playerEntryId = entry.recordedEntryId;
					//TODO in graph, only show recorded duration (how ??)
				}
				else {
					// show "no recording" in player
					$scope.playerEntryId = -1;
					// set 30 secs update interval
					$interval(function() {screenUpdate()}, 30000);
				}
				// set report dates:
				var d = new Date();
				getMapData(d.getTime());
				d.setTime(entry.createdAt);
				$scope.reportStartTime = d;
				getAggregates(entry.isLive);
				
			});
		};
		
		
		/**
		 * get graph data for the last 36 hrs 
		 */
		var getGraph36Hrs = function getGraph36Hrs() {
			var d = new Date();
			var toDate = d.getTime();
			var fromDate = toDate - 129600000; // 60000 ms per minute * 60 minutes per hour * 36 hrs 
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				var objects = data.objects;
				objects.forEach(function (stat) {
					// re-shape data so rickshaw can understand it
					stat.y = stat.audience;
					stat.x = stat.timestamp;
				});
				$scope.graphdata = objects;
			});
		}
		
		
		/**
		 * get graph data for the last 30 secs 
		 * @param endTime (timestamp) get graph data for 30 secs up to this time
		 */
		var getGraph30Secs = function getGraph30Secs(endTime) {
			var toDate = endTime;
			var fromDate = toDate - 40000;
			EntrySvc.getGraph($scope.entryId, fromDate, toDate).then(function(data) {
				var objects = data.objects;
				objects.forEach(function (stat) {
					// re-shape data so rickshaw can understand it
					stat.y = stat.audience;
					stat.x = stat.timestamp;
				});
				$scope.additionalgraphdata = objects;
			});
		}
		
		
		/**
		 * get data to display on map
		 * @param time unix timestamp. if null, current time is used.
		 */
		var getMapData = function getMapData(time) {
			EntrySvc.getMap($scope.entryId, time).then(function(data) {
				$scope.mapData = data.objects;
			});
		}
		
		
		
		var screenSetup = function screenSetup() {
			// report data:
			getEntry();
			getGraph36Hrs();
		}
		
		var screenUpdate = function screenUpdate() {
			var d = new Date();
			var t = d.getTime();
			getGraph30Secs(t);
			getMapData(t);
		}
		
		screenSetup();
	}]);



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

analyticsControllers.controller('OLMapController', ['$scope', '$attrs',  
    function($scope, $attrs) {
		var self = this;
		this.mapElement = null;
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
		        if( zLevel < 5)
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
		}
		
		$scope.$watch('mapData', function( value ) {
			if (value) { // value is array of KalturaGeoTimeLiveStats
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
					"visibility" : false,
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
					"styleMap" : self.createStyleMap()
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				layer.refresh();
			}
		});
}]);