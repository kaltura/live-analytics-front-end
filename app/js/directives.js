'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);


analyticsDirectives.directive('kplayer', function() {
	return {
		
		restrict : 'E',
		scope: {
			entryid: '@',
			uiconf: '=',	
			pid: '='	
		},
		//replace : true,
		template: '<div id="kplayer" style="width:100%; height:100%;"></div>',
		link: function($scope, element, attrs) {
			kWidget.embed({
            	"targetId": "kplayer", 
            	"wid": "_" +$scope.pid, 
              	"uiconf_id": $scope.uiconf, 
              	"flashvars": { 
              		"streamerType": "auto" 
              	}, 
              	"cache_st": 1395933525, 
              	"entry_id": $scope.entryid 
              });
			
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
			var series = [ {
					color : 'steelblue',
					data : [ {x:0, y:0}, {x:1, y:3}, { x:2, y:2}, {x:3, y:4} ],
					name : "Line 1"
				}, {
					color : 'lightblue',
					data : [ {x:0, y:1}, {x:1, y:2}, {x:2, y:5}, {x:4, y:3} ],
					name : "Line 2"
				}
			];

			var replaceGraphContent = function replaceGraphContent(value) {
				while (graph.series.length > 0) {
					graph.series.pop();
				}
				for ( var i = 0; i < value.length; i++) {
					graph.series.push(value[i]);
				}
			};

			
			/**
			 * set graph data as attribute
			 */
			scope.$watch(attrs.graphdata, function(value) {
				if (graph != null && Array.isArray(value)) {
					replaceGraphContent(value);
					graph.update();
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