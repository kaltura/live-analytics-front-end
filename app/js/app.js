'use strict';


// Declare app level module which depends on filters, and services
var liveAnalytics = angular.module('liveAnalytics', [
	'ngRoute',
	'analyticsFilters',
	'analyticsServices',
	'analyticsDirectives',
	'analyticsControllers',
	'analyticsFilters'
]);

liveAnalytics.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/dashboard', {
		templateUrl: 'partials/dashboard.html', 
		controller: 'DashboardCtrl'
	});
	$routeProvider.when('/login', {
		template: '<div>Missing KS</div>' 
	});
	$routeProvider.otherwise({redirectTo: '/dashboard'});
}]);
