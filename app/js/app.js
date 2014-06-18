'use strict';


// Declare app level module which depends on filters, and services
var liveAnalytics = angular.module('liveAnalytics', [
	'ngRoute',
	'pascalprecht.translate',
	'analyticsFilters',
	'analyticsServices',
	'analyticsDirectives',
	'analyticsControllers',
	'analyticsFilters'
]);

liveAnalytics.config(['$routeProvider', '$translateProvider', function($routeProvider, $translateProvider) {
	// routes
	$routeProvider.when('/dashboard', {
		templateUrl: 'partials/dashboard.html', 
		controller: 'DashboardCtrl'
	});
	$routeProvider.when('/entry/:entryid', {
		templateUrl: 'partials/entry.html', 
		controller: 'EntryCtrl'
	});
	$routeProvider.when('/login', {
		template: '<div>Missing KS</div>' 
	});
	$routeProvider.otherwise({redirectTo: '/dashboard'});
	
	// translates
	$translateProvider.translations('en_US', en_US_trans);
	$translateProvider.useStaticFilesLoader({
		prefix: 'locale/',
		suffix: '.json'
	});
		 
	$translateProvider.fallbackLanguage('en_US');
	$translateProvider.preferredLanguage('en_US');
}]);

function navigateToFlashAnalytics(subtabName) {
	$("#kcms",parent.document)[0].gotoPage({moduleName: "analytics",subtab: "playersList"});
}