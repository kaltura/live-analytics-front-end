'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);

analyticsDirectives.directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);
