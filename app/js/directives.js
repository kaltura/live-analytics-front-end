'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);


analyticsDirectives.directive('kplayer', function() {
	return {
		restrict : 'E',
		controller: 'KPlayerController',
		replace : true,
		template: '<div id="kplayer" style="width:100%; height:100%;"></div>',
		link: function($scope, element, attrs, KPlayerController) {
			
			KPlayerController.init(element);
		}
	};
});

analyticsDirectives.directive('rgraph', function() {
	return {
		restrict : 'E',
		template : '<div style="width:100%;height:100%;"><div id="graph"></div><div id="preview"></div></div>',
		replace : true,
		link : function(scope, element, attrs) {
			var graph = null;
			var d = new Date();
			var series = [ 
			    {
					color : 'steelblue',
					data : [ {x:d.getTime(), y:0} ],
					name : "Line 1"
				}
			];

			
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
				var ar = series[0].data;
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
				graph.update();
			};

			/**
			 * set graph data as attribute
			 */
			scope.$watch(attrs.additionalgraphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					updateGraphContent(value);
				}
			});
			
			/**
			 * set graph data as attribute
			 */
			scope.$watch(attrs.graphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					resetGraphContent(value);
				}
			});
			

			graph = new Rickshaw.Graph({
				element : element[0].children[0],
				width : element.width(),
				height : element.height() - 20,
				renderer : 'line',
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

		}
	};
});


analyticsDirectives.directive('olmap', function() {
	return {
		restrict : 'E',
		template : '<div id="map"></div>',
		replace : true,
		link : function(scope, elem, attrs) {
			
			// create map
			var map = new OpenLayers.Map('map');

			// create OSM layer
			var osm = new OpenLayers.Layer.OSM();
			
			
			
			// style
			var style = new OpenLayers.Style({
				pointRadius: "${radius}",
				fillColor: "#ffcc66",
				fillOpacity: 0.8,
				strokeColor: "#cc6633",
				strokeWidth: 2,
				strokeOpacity: 0.8
			},
			{
				context: {
					radius: function(feature) {
						return feature.attributes.type;
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
			
			// create 20 random features with a random type attribute.
			var features = new Array(201);
			var point;
			for ( var i = 0; i < 200; i++) {
				point = new OpenLayers.Geometry.Point(Math.random() * 360 - 180, Math.random() * 180 - 90).transform('EPSG:4326', 'EPSG:3857');
				features[i] = new OpenLayers.Feature.Vector(
						point, 
						{
							"type" : parseInt(Math.random() * 10)+2
						}
						);
			}
			// jerusalem - test case
			point = new OpenLayers.Geometry.Point(35.2330372, 31.7818734).transform('EPSG:4326', 'EPSG:3857');
			features[200] = new OpenLayers.Feature.Vector(
					point, 
					{
						"type" : parseInt(Math.random() * 10)
					}
					);
			
			var layer = new OpenLayers.Layer.Vector('Points', {
				"projection": "EPSG:3857",
				"strategies": [new OpenLayers.Strategy.Cluster()], 
				"styleMap" : styleMap
			});
			layer.addFeatures(features);
			map.addLayers([osm, layer]);
			map.zoomToMaxExtent();
			layer.refresh();
		}
	};
});
