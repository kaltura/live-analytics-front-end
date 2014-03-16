'use strict';

/* Filters */

var analyticsFilters = angular.module('analyticsFilters', []);

analyticsFilters.filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);
