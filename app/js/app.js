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
	$translateProvider.translations('en_US', {
		// aggregates:
		'audience': 'Audience',
		'seconds_viewed': 'Minutes Viewed', // this is not a mistake, text should read minutes
		'buffertime': 'Buffering Time',
		'bitrate': 'Average Bitrate',
		
		// dashboard texts:
		'dashboard' : {
			'Live_Content_36': 'Live Content (in past 36 hours)',
			'Show_All_Entries': 'Show All Entries',
			'Show_Kaltura': 'Show Kaltura Live Now Only',
			'Audience': 'Audience',
			'Peak_Audience': 'Peak Audience',
			'Minutes_Viewed': 'Minutes Viewed',
			'Buffer_Time': 'Buffering Time',
			'Avg_Bitrate': 'Average Bitrate',
			'Investigate': 'Investigate'
		},
		
		// entry texts:
		'entry' : {
			'Live_Content': 'Live Content',
			'Investigate': 'Investigate',
			'Audience': 'Audience',
			'Location': 'Location',
			'Top_referals': 'Top referals',
			'Domain': 'Domain',
			'Visits': 'Visits',
			'of_total': '% of total'
		},
		
		// index texts:
		'main' : {
			// tab names should match names in KMC
			'Content_Reports': 'Content Reports',
			'Community_Reports': 'Users & Community Reports',
			'Storage_Reports': 'Bandwidth & Storage Reports',
			'System_Reports': 'System Reports',
			'Live_Reports': 'Live Reports'
		}
	});
		 
	$translateProvider.translations('de_DE', {
		'Show_All_Entries': 'Show_All_Entries in german',
		'FOO': 'Dies ist ein Paragraph'
	});
		 
	$translateProvider.preferredLanguage('en_US');
}]);

function navigateToFlashAnalytics(subtabName) {
	$("#kcms",parent.document)[0].gotoPage({moduleName: "analytics",subtab: "playersList"});
}