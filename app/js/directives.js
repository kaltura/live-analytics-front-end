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
		template : '<div id="map"></div><div id="mapctrls"><div id="sliderticks"></div><div id="maptip" class="hidden tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div><div id="mapslider"></div></div>',
		replace : false,
		link : function(scope, element, attrs, OLMapController) {
			OLMapController.init(element);
		}
	};
});

analyticsDirectives.directive('ellipsis', ['$timeout', function($timeout) {
	return {
		restrict : 'A',
		link : function(scope, element, attrs) {
			var func = function() {
				if (element[0].offsetWidth < element[0].scrollWidth) {
					element.attr('title', element[0].innerHTML);
					element.addClass('ellipsis');
					element.tooltip();
				} 
			};
			$timeout(func, 0);
		}
	};
}]);

analyticsDirectives.directive('fitfontsize', function() {
	return {
		restrict : 'A',
		link : function(scope, element, attrs) {
			var update = function(value) {
				element.text(value);
				var fontSize = element.css('font-size');
				fontSize = fontSize.substr(0, fontSize.length - 2);
				var maxWidth = 200;
				var textWidth;
				do {
					element.css('font-size', fontSize + "px");
					textWidth = element.width();
					fontSize -= 1;
				} while ((textWidth > maxWidth) && fontSize > 3);
			}
			attrs.$observe('fitfontsize', function(value){
				update(value);
			});
		}
	}
});