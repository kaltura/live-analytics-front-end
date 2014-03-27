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
		var pageSize = 5;
		
		/**
		 * total number of pages
		 */
		var totalPages = 1;
		
		var updatePagingControlRequired = true;
		
		
		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates(liveOnly) {
			$scope.aggregates = DashboardSvc.getAggregates(liveOnly).query();
		};
		
		
		/**
		 * @param liveOnly	fetch KalturaLive currently live (true) or all live entries (false)
		 * @param page		index of page to fetch
		 */
		var getEntries = function getEntries(liveOnly, page) {
			getDummyEntries(liveOnly, page);
		}
		
		
		/**
		 * get a list of all live entries according to required page
		 * @param pageNumber index of page to fetch
		 * @todo write to match description
		 */
		var getAllEntries = function getAllEntries(pageNumber) {
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
		 * get a list of entries that are currently live according to the required page
		 * @param pageNumber index of page to fetch
		 * @todo write to match description
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
			var result = DashboardSvc.getDummyEntries(liveOnly, pageNumber).query();
			result.$promise.then(function(data) {
				$scope.entries = data.objects;
				totalPages = Math.ceil(data.totalCount/pageSize);
				if (updatePagingControlRequired) {
					updatePagingControl(pageNumber, totalPages);
					updatePagingControlRequired = false;
				}
			});
		};
		
		
		/**
		 * get entries data by page
		 * @param e
		 * @param oldPage
		 * @param newPage
		 */
		var doPaging = function doPaging(e,oldPage,newPage) {
			getEntries($scope.boardType == "liveOnly", newPage);
		};
		
		
		/**
		 * update paging control
		 * @param current	index of current page
		 * @param total		total number of pages
		 */
		var updatePagingControl = function updatePagingControl(current, total) {
			var options = {
	                currentPage: current,
	                totalPages: total,
	            }
	        $('#pagination').bootstrapPaginator(options);
		}
		
		// (analytics) entry stats for live entries by ids 
		// (analytics) entry stats for not-live entries by ids
		// return:
		// [{entryId, name, audience, peakAudience, minutes, bufferTime, bitrate, startTime, isLive, thumbnailUrl}, ..]
		
		
		var screenSetup = function screenSetup() {
			// set report dates:
			var d = new Date();
			$scope.nowTime = d;
			d = new Date();
			d.setHours(d.getHours() - 36);
			$scope.reportStartTime = d;
			
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
		    
		    $scope.boardType = "all";
			$scope.$watch("boardType", function(newValue, oldValue) {
				getAggregates(newValue == "liveOnly");
	    		getEntries(newValue == "liveOnly", 1);
				updatePagingControlRequired = true;
			 });
		}
		
		screenSetup();
		
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
