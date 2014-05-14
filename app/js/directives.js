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
		controller: 'RGraphController',
		template : '<div style="width:100%;height:100%;"><div id="graph"></div><div id="preview"></div></div>',
		replace : true,
		link : function(scope, element, attrs, RGraphController) {
			RGraphController.init(element);
			
		}
	};
});


analyticsDirectives.directive('olmap', function() {
	return {
		restrict : 'E',
		controller : 'OLMapController',
		template : '<div ><div id="map"></div><div id="mapslider"></div></div>',
		replace : true,
		link : function(scope, element, attrs, OLMapController) {
			OLMapController.init(element);
		}
	};
});
