'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers', []);

/**
 * Dashboard Controller 
 */
analyticsControllers.controller('DashboardCtrl', ['$rootScope', '$scope', '$interval', '$timeout', '$translate', 'DashboardSvc',
    function($rootScope, $scope, $interval, $timeout, $translate, DashboardSvc) {
		
		$scope.Math = window.Math;
		
		/**
		 * entries currently on display
		 */
		var entries = [];
		
		/**
		 * number of entries in page
		 */
		var pageSize = DashboardSvc.pageSize;
		
		/**
		 * total number of pages
		 */
		var totalPages = 1;
		

		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates(liveOnly) {
			if (liveOnly) {
				DashboardSvc.getLiveAggregates().then (function(data) {
					/* 1 audience - 10 secs (now)
		 			 * 2 minutes viewed - 36 hours
		 			 * 3 buffertime, bitrate - 1 minute
		 			 * */
					var results = [
					           	{"title": "audience", "value": data[0].objects[0].audience + data[0].objects[0].dvrAudience, "tooltip": "agg_audience_tt"},
					        	{"title": "seconds_viewed", "value": data[1].objects[0].secondsViewed, "tooltip":"agg_secs_tt"},
					        	{"title": "buffertime", "value": data[2].objects[0].bufferTime, "tooltip":"agg_buffer_tt"},
					        	{"title": "bitrate", "value": data[2].objects[0].avgBitrate, "tooltip":"agg_bitrate_tt"}
					    ];

					$scope.aggregates = results;
					// reactivate tooltips
					$timeout(function() {$('.tooltip-wrap').tooltip();}, 0);
				});
			}
			else {
				DashboardSvc.getDeadAggregates().then (function(data) {
					var o;
					if (data.objects) o = data.objects[0];
					var results = [
					           	{"title" : "plays", 
					           		"value" : o ? o.plays : 0, 
					           		"tooltip" : "agg_plays_tt"},
					        	{"title": "seconds_viewed", "value": o ? o.secondsViewed : 0, "tooltip":"agg_secs_tt"},
					        	{"title": "buffertime", "value": o ? o.bufferTime : 0, "tooltip":"agg_buffer_tt"},
					        	{"title": "bitrate", "value": o ? o.avgBitrate : 0, "tooltip":"agg_bitrate_tt"}
						];

					$scope.aggregates = results;
					// reactivate tooltips
					$timeout(function() {$('.tooltip-wrap').tooltip();}, 0);
				});
			}
		};
		
		
		/**
		 * @param liveOnly	fetch KalturaLive currently live (true) or all live entries (false)
		 * @param pageNumber index of page to fetch
		 */
		var getEntries = function getEntries(liveOnly, pageNumber) {
			var result;
			if (liveOnly) {
				result = DashboardSvc.getLiveEntries(pageNumber); 
			}
			else {
				result = DashboardSvc.getAllEntries(pageNumber); 
			}
			 
			result.then(function(data) {
				$scope.entries = data.objects;
				totalPages = Math.ceil(data.totalCount/pageSize);

				updatePagingControl(pageNumber, totalPages);

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
			if (total < 1) total = 1; // it's only for display..
			var options = {
	                currentPage: current,
	                totalPages: total
	            };
	        $('#pagination').bootstrapPaginator(options);
		};
		
		
		/**
		 * trigger export to csv
		 */
		var export2csv = function export2csv() {
			var result = DashboardSvc.export2csv($scope.boardType == "liveOnly"); 
			result.then(function(data) {
				if (data.referenceJobId) {
					$translate('dashboard.export_success').then(function (msg) {
						bootbox.alert(msg.formatArgs([data.reportEmail]));
					});
				}
				else {
					$translate('dashboard.export_fail').then(function (msg) {
						bootbox.alert(msg);
					});
				}
			}, 
			function (error) {
				$translate('dashboard.export_fail').then(function (msg) {
					bootbox.alert(msg + "<br>" + error);
				});
			});
		};
		
		
		/**
		 * initial screen set up
		 */
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

			if ($rootScope.selectedBoard) {
				$scope.boardType = $rootScope.selectedBoard;
			}
			else {
				$scope.boardType = "all";
			}
			$scope.$watch("boardType", function(newValue, oldValue) {
				$rootScope.selectedBoard = newValue;
				$scope.entries = [];
				getAggregates(newValue == "liveOnly");
	    		getEntries(newValue == "liveOnly", 1);
			 });
			
			$scope.export2csv = export2csv;
			
			// set 30 secs update interval
			$scope.intervalPromise = $interval(function() {screenUpdate();}, 30000);
		};
		
		var screenUpdate = function screenUpdate() {
			
			$('.tooltip-wrap').tooltip('destroy');
			$('.panel-title').tooltip('destroy');
			
			var d = new Date();
			var t = d.getTime()/1000;
			
			$scope.nowTime = d;
			d = new Date();
			d.setHours(d.getHours() - 36);
			$scope.reportStartTime = d;
			getAggregates($scope.boardType == "liveOnly");
			var pages = $('#pagination').bootstrapPaginator('getPages');
			getEntries($scope.boardType == "liveOnly", pages.current);
		};
		
		
		$scope.$on('$destroy', function() {
			// Make sure that the interval is destroyed too
			if (angular.isDefined($scope.intervalPromise)) {
				$interval.cancel($scope.intervalPromise);
				$scope.intervalPromise = undefined;
			}
			// and tooltips
			$('.tooltip-wrap').tooltip('destroy');
			$('.panel-title').tooltip('destroy');
		});
		
		
		
		screenSetup();
		
    }]);


/**
 * General controller for the entry drill-down page
 */
analyticsControllers.controller('EntryCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', '$translate', 'SessionInfo', 'EntrySvc',  
    function($scope, $rootScope, $routeParams, $interval, $timeout, $translate, SessionInfo, EntrySvc) {
		$scope.intervalPromise = null; 			// use this to hold update interval
		$scope.entryId = $routeParams.entryid;	// current entry
		$scope.pid = SessionInfo.pid;
		$scope.uiconfId = SessionInfo.uiconfid;
		$scope.playerEntryId = '';				// entry that should be shown in player (live / vod)
		$rootScope.nonav = $routeParams.nonav == 'nonav';
		

		/**
		 * get data for the aggregates line
		 * @param isLive is the entry currently broadcasting
		 */
		var getAggregates = function getAggregates(isLive) {
			if (isLive) {
				EntrySvc.getLiveAggregates($scope.entryId).then (function(data) {
					// data is MR
					var o = {'audience' : 0,
							'plays' : 0,
							'secondsViewed' : 0,
							'bufferTime' : 0,
							'avgBitrate' : 0
						};
					// audience - now
					if (data[0].objects && data[0].objects.length > 0) {
						o.audience = data[0].objects[0].audience + data[0].objects[0].dvrAudience;
					}
					// seconds viewed - 36 hours
					if (data[1].objects && data[1].objects.length > 0) {
						o.secondsViewed = data[1].objects[0].secondsViewed;
					}
					// buffertime, bitrate - 1 minute
					if (data[2].objects && data[2].objects.length > 0) {
						o.bufferTime = data[2].objects[0].bufferTime;
						o.avgBitrate = data[2].objects[0].avgBitrate;
					}
					
					var results = [
					           	{"title": "audience", "value": o.audience, "tooltip": "agg_audience_tt"},
					        	{"title": "seconds_viewed", "value": o.secondsViewed, "tooltip":"agg_secs_tt"},
					        	{"title": "buffertime", "value": o.bufferTime, "tooltip":"agg_buffer_tt"},
					        	{"title": "bitrate", "value": o.avgBitrate, "tooltip":"agg_bitrate_tt"}
					        ]; 
					
					$scope.aggregates = results;
					// reactivate tooltips
					$timeout(function() {$('.tooltip-wrap').tooltip();}, 0);
					
					getReferrers(true, 0); // totalplays value is ignored for live entries
				});
			}
			else {
				EntrySvc.getDeadAggregates($scope.entryId).then (function(data) {
					var o;
					if (data.objects && data.objects.length > 0) {
						o = data.objects[0];
					}
					else {
						// create empty dummy object
						o = {'audience' : 0,
							'plays' : 0,
							'secondsViewed' : 0,
							'bufferTime' : 0,
							'avgBitrate' : 0
						};
					}
					var results = [
					           	{"title" : "plays", "value" : o.plays,"tooltip" : "agg_plays_tt"},
					        	{"title": "seconds_viewed", "value": o.secondsViewed, "tooltip":"agg_secs_tt"},
					        	{"title": "buffertime", "value": o.bufferTime, "tooltip":"agg_buffer_tt"},
					        	{"title": "bitrate", "value": o.avgBitrate, "tooltip":"agg_bitrate_tt"}
					        ]; 
					
					$scope.aggregates = results;
					
					getReferrers(false, o.plays);
				});
			}
		};
		
		
		
		/**
		 * get data for the top referrals table
		 * @param totalPlays
		 * @param isLive
		 */
		var getReferrers = function getReferrers(isLive, totalPlays) {
			if (isLive) {
				// need to get the non-live entry stats and use the totalplays from there
				EntrySvc.getDeadAggregates($scope.entryId).then (function(data) {
					var o;
					if (data.objects && data.objects.length > 0) {
						o = data.objects[0];
					}
					else {
						// create empty dummy object
						o = {'audience' : 0,
							'plays' : 0,
							'secondsViewed' : 0,
							'bufferTime' : 0,
							'avgBitrate' : 0
						};
					}
					getReferrers(false, o.plays);
				});
			}
			else {
				EntrySvc.getReferrers($scope.entryId).then (function(data) {
					var objects;
					if (data.objects && data.objects.length > 0) {
						objects = data.objects;
					}
					else {
						objects = [];
					}
					var results = [];
					var o;
					for (var i = 0; i<objects.length; i++) {
						o = {
								'domain': objects[i].referrer, 
								'visits': objects[i].plays, 
								'percents' : objects[i].plays / totalPlays
							}; 
						results.push(o);
					}
					$scope.referals = results;
					// reactivate tooltips
					$timeout(function() {$('.tooltip-wrap').tooltip();}, 0);
				});
			}
		};
		
		
		/**
		 * get the entry in question
		 */
		var getEntry = function getEntry() {
			return EntrySvc.getEntry($scope.entryId).then(function(entry){
				$scope.entry = entry;
				if (entry.isLive) {
					// live session - show live entry in player
					$scope.playerEntryId = entry.id;
					// set 30 secs update interval
					$scope.intervalPromise = $interval(function() {screenUpdate();}, 30000);
				}
				else if (entry.recordedEntryId && entry.recordedEntryId != '') {
					// session ended, got recording - show recorded entry in player
					$scope.playerEntryId = entry.recordedEntryId;
				}
				else {
					// show "no recording" in player
					$scope.playerEntryId = -1;
				}
				// set report dates:
				var d = new Date();
				$scope.nowTime = d;
				$rootScope.$broadcast('setupScreen', Math.floor(d.getTime()/10000)*10);
				d = new Date();
				d.setHours(d.getHours() - 36);
				$scope.reportStartTime = d;
				getAggregates(entry.isLive);
				
			});
		};
		
		
		/**
		 * trigger export to csv based on live/dead and required kind
		 * @param reportKind audience/location/syndication
		 */
		var export2csv = function export2csv(reportKind) {
			var reportType;
			if ($scope.entry.isLive) {
				switch (reportKind) {
				case "audience":
					reportType = 12;
					break;
				case "location":
					reportType = 22;
					break;
				case "syndication":
					reportType = 32;
					break;
				}
			}
			else {
				switch (reportKind) {
				case "audience":
					reportType = 11;
					break;
				case "location":
					reportType = 21;
					break;
				case "syndication":
					reportType = 31;
					break;
				}
			}
			
			var result = EntrySvc.export2csv(reportType, $scope.entry.id); 
			result.then(function(data) {
				if (data.referenceJobId) { 
					$translate('dashboard.export_success').then(function (msg) {
						bootbox.alert(msg.formatArgs([data.reportEmail]));
					});
				}
				else {
					$translate('entry.export_fail').then(function (msg) {
						bootbox.alert(msg);
					});
				}
			}, 
			function (error) {
				$translate('entry.export_fail').then(function (msg) {
					bootbox.alert(msg + "<br>" + error);
				});
			});
		};
		
		
		
		var screenSetup = function screenSetup() {
			$scope.exportReportType = "default";
			$scope.$watch("exportReportType", function(newValue, oldValue) {
				if (newValue != "default") {
					export2csv(newValue);
				}
				$scope.exportReportType = "default";
			 });
			// report data:
			getEntry();
		};
		
		var screenUpdate = function screenUpdate() {
			$('.tooltip-wrap').tooltip('destroy');
			
			var d = new Date();
			var t = Math.floor(d.getTime()/10000) * 10;
			
			$scope.nowTime = d;
			d = new Date();
			d.setHours(d.getHours() - 36);
			$scope.reportStartTime = d;
			getAggregates($scope.entry.isLive);
			$rootScope.$broadcast('updateScreen', t);
		};
		
		
		$scope.$on('$destroy', function() {
			// Make sure that the interval is destroyed too
			if (angular.isDefined($scope.intervalPromise)) {
				$interval.cancel($scope.intervalPromise);
				$scope.intervalPromise = undefined;
			}
			// and tooltips
			$('.tooltip-wrap').tooltip('destroy');
		});
		
		screenSetup();
}]);

/**
 * General controller for report download page
 */
analyticsControllers.controller('ExportCtrl', ['$scope', '$rootScope', '$routeParams', '$translate', 'SessionInfo', '$location', 'ReportSvc', 'KApi',
	function($scope, $rootScope, $routeParams, $translate, SessionInfo, $location, ReportSvc, KApi ) {
		$rootScope.nonav = true;

		SessionInfo.setServiceUrl($location.protocol() + "://" + $location.host());

		KApi.setRedirectOnInvalidKS(false);

		var reportId = $routeParams.id;


		/**
		 * test the given KS
		 */
		var getSession = function getSession(ks) {
			return ReportSvc.getSession(ks).then(function(sessionInfo){
				if (sessionInfo.code == 'INVALID_KS') {
					$translate('export.Expired').then(function (msg) {
						$scope.message = msg;
					});
				}
				else {
					$translate('export.Report_Ready').then(function (msg) {
						$scope.message = msg;
					});
					$scope.downloadLink = getDownloadLink();
					$scope.downloadName = getDownloadName();
					$translate('export.Download').then(function (msg) {
						$scope.downloadMsg = msg;
					});
				}
			});
		};

		var getDownloadLink = function getDownloadLink() {
			var url = KApi.getApiUrl();
			url += "/service/liveReports/action/serveReport";
			url += "/ks/" + SessionInfo.ks;
			url += "/id/" + reportId;
			url += "/" + getDownloadName();
			return url;
		}

		var getDownloadName = function getDownloadName() {
			var results = reportId.match(/^[\d+]_[\d]+_Export_[a-zA-Z0-9]+_([\w\-]+.csv)$/);
			return results[1];
		}


		var screenSetup = function screenSetup() {
			$scope.downloadMsg = '';
			$translate('export.Verifying').then(function (msg) {
				$scope.message = msg;
			});
			getSession($routeParams.ks);
		};


		screenSetup();
	}]);
