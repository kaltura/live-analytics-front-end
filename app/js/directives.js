'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);


analyticsDirectives.directive('kplayer', function() {
	return {
		restrict : 'A',
		controller: 'KPlayerController',
		replace : false,
		template: '<div id="kplayer" class="full-width full-height"></div>',
		link: function($scope, element, attrs, KPlayerController) {
			KPlayerController.init(element);
		}
	};
});

analyticsDirectives.directive('rgraph', function() {
	return {
		restrict : 'A',
		controller: 'RGraphController',
		template : '<div id="graph"></div><div id="preview"></div>',
		replace : false,
		link : function(scope, element, attrs, RGraphController) {
			RGraphController.init(element);
			
		}
	};
});


analyticsDirectives.directive('olmap', function() {
	return {
		restrict : 'A',
		controller : 'OLMapController',
		template : '<div id="map"></div><div id="mapslider"></div>',
		replace : false,
		link : function(scope, element, attrs, OLMapController) {
			OLMapController.init(element);
		}
	};
});
