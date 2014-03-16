'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers', []);

/**
 * Dashboard Controller 
 */
analyticsControllers.controller('DashboardCtrl', ['$scope', 'KApi', 'DashboardSvc', 
    function($scope, KApi, DashboardSvc) {
		
		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates() {
			$scope.aggregates = DashboardSvc.getAggregates();
		};
		
		
		/**
		 * get the list of entries to show
		 * @param liveOnly	if true, only get entries that are currently live
		 */
		var getEntries = function getEntries(liveOnly) {
			// liveEntry.list to get all entries
			// liveEntry.list by isLive to know which ones are currently live
			// (analytics) entry stats for live entries by ids 
			// (analytics) entry stats for not-live entries by ids
			// return:
			// [{entryId, name, audience, peakAudience, minutes, bufferTime, bitrate, startTime}, ..]
		};
		
		getAggregates();
		
    }]);

