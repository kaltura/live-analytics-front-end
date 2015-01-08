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
	$routeProvider.when('/dashboard/:extra?',{	// "extra" is only used in dev to pass params on url
		templateUrl: 'partials/dashboard.html', 
		controller: 'DashboardCtrl'
	});
	$routeProvider.when('/entry/:entryid/:nonav?', {
		templateUrl: 'partials/entry.html', 
		controller: 'EntryCtrl'
	});
	$routeProvider.when('/login', {
		template: '<script>window.parent.kmc.functions.expired();</script><div class="page container"><br/><p>invalid ks</p></div>' 
	});
	$routeProvider.otherwise({redirectTo: '/dashboard'});
	
	// translates
	$translateProvider.translations('en_US', en_US_trans);
	$translateProvider.useStaticFilesLoader({
		prefix: 'locale/',
		suffix: '.json'
	});
		 
	//$translateProvider.fallbackLanguage('en_US'); //TODO return this when we localize the app
	//var lang = window.lang ? window.lang : 'en_US';
	var lang = 'en_US';
	$translateProvider.preferredLanguage(lang);
}]);

function navigateToFlashAnalytics(subtabName) {
	$("#kcms",parent.document)[0].gotoPage({moduleName: "analytics",subtab: subtabName});
}

String.prototype.formatArgs = function() {
    var args = arguments;

    return this.replace(/\{(\d+)\}/g, function() {
        return args[arguments[1]];
    });
};

