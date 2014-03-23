'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers', []);

/**
 * Dashboard Controller 
 */
analyticsControllers.controller('DashboardCtrl', ['$scope', 'KApi', 'DashboardSvc', 
    function($scope, KApi, DashboardSvc) {
	
		/**
		 * entries currently on display
		 */
		var entries = [];
		
		
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
		var getAllEntries = function getAllEntries(liveOnly) {
			return DashboardSvc.getAllEntries(liveOnly).then(function(entryListResponse){
				entries = entryListResponse.objects;
				var ids = '';
				entries.forEach(function (entry) {
					ids += entry.id + ',';
				});
				return ids;
			});
		};
		
		
		/**
		 * get the entries that are currently live from the given list
		 * @param ids of entries in question
		 */
		var getLiveEntries = function getLiveEntries(entryIds){
			return DashboardSvc.getLiveEntries(entryIds).then(function(entryListResponse){
				entries.forEach(function (entry) {
					entry.isLive = false;
					entryListResponse.objects.forEach(function (liveEntry) {
						if (entry.id == liveEntry.id) {
							entry.isLive = true;
						};
					});
				});
				entries[0].isLive = true;
				$scope.entries = entries;
				return entries;
			});
		};
		
		
		// (analytics) entry stats for live entries by ids 
		// (analytics) entry stats for not-live entries by ids
		// return:
		// [{entryId, name, audience, peakAudience, minutes, bufferTime, bitrate, startTime, isLive, thumbnailUrl}, ..]
		
		// set report dates:
		var d = new Date();
		$scope.nowTime = d;
		d = new Date();
		d.setHours(d.getHours() - 36);
		$scope.reportStartTime = d;
		
		// report data:
		getAggregates();
		
		getAllEntries(false).then(getLiveEntries);
		
    }]);

