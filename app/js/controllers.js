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
		 * number of entries in page
		 */
		var pageSize = 10;
		
		/**
		 * total number of pages
		 */
		var totalPages = 1;
		
		
		
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
				totalPages = Math.ceil(entryListResponse.totalCount/pageSize);
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
		
		
		/**
		 * dummy method to get mock data
		 */
		var getDummyEntries = function getDummyEntries(liveOnly, pageNumber) {
			$scope.entries = DashboardSvc.getDummyEntries(liveOnly, pageNumber).query();
			totalPages = 4;
		};
		
		
		/**
		 * get entries data by page
		 * @param e
		 * @param oldPage
		 * @param newPage
		 * 
		 */
		var doPaging = function doPaging(e,oldPage,newPage) {
			getDummyEntries(false, newPage);
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
		
		//getAllEntries(false).then(getLiveEntries);
		getDummyEntries(false, 1);
		
		var options = {
				bootstrapMajorVersion: 3,
				onPageChanged: doPaging,
				shouldShowPage:function(type, page, current){
	                switch(type) {
	                    case "first":
	                    case "last":
	                        return false;
	                    default:
	                        return true;
	                }
	            },
	            alignment: 'center',
	            currentPage: 1,
	            totalPages: totalPages
	    };

	    $('#pagination').bootstrapPaginator(options);
		
    }]);

analyticsControllers.controller('EntryCtrl', ['$scope', '$routeParams', 'EntrySvc', 
    function($scope, $routeParams, EntrySvc) {
		$scope.entryId = $routeParams.entryid;
		
		

		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates() {
			$scope.aggregates = EntrySvc.getAggregates($scope.entryId);
		};
		
		
		/**
		 * get data for the top referals table
		 */
		var getReferals = function getReferals() {
			$scope.referals = EntrySvc.getReferals($scope.entryId);
		};
		
		
		var getEntry = function getEntry() {
			return EntrySvc.getEntry($scope.entryId).then(function(entry){
				$scope.entry = entry;
				// set report dates:
				var d = new Date();
				d.setTime(entry.createdAt);
				$scope.reportStartTime = d;
				
				return entry;
			});
		};
		
		// report data:
		getAggregates($scope.entryId);
		getEntry($scope.entryId);
		getReferals($scope.entryId);
		
	}]);
