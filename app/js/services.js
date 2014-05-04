'use strict';

/* Services */

var analyticsServices = angular.module('analyticsServices', [ 'ngResource' ]);


analyticsServices.factory('KS',
		['$location',
		 	function KSFactory($location) {
				//TODO remove this!!
		 		var ks = 'M2Q5M2NjNDM2NDAzNGRiNTFlZTA0ZGUxYjVkNjc3OGZmNjdmYjU4M3wzNDYxNTE7MzQ2MTUxOzM1NDI0NDk4NTI7MjsxMzk0OTY2MjA1LjcwMTQ7YXRhci5zaGFkbWlAa2FsdHVyYS5jb207Ozs=';
		 		try {
	                var kmc = window.parent.kmc;
	                if (kmc && kmc.vars) {
	                    // got ks from KMC - save to local storage
	                    if (kmc.vars.ks)
	                        ks = kmc.vars.ks;
	                }
	            } catch (e) {
	                console.log('Could not located parent.kmc: ' + e);
	            }
	            
	            if (!ks) { //navigate to login
	                $location.path("/login");
	                return false;
	            } 
		 		
		 		return ks;
		 	} 
	 	]);
		
		
analyticsServices.factory('KApi',
		['$http', '$q', 'KS',
		 	function KApiFactory ($http, $q, KS) {
		 		var KApi = {};
		 		
		 		/**
		 		 * @param request 	request params
		 		 * @returns	promise object
		 		 */
		 		KApi.doRequest = function doRequest (request) {
		 			// Creating a deferred object
		            var deferred = $q.defer();
		            
			 		// add required params
		            request.ks = KS;
			 		var sParams = this.serializeParams(request);
			 		$http({
			 			data: sParams,
			 			url: "http://www.kaltura.com/api_v3/index.php",
				 		method: "POST",
			 			params: {'format' : '1'},
			 			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			 		}).success(function (data, status) {
			 			if (data.objectType === "KalturaAPIException") {
			 				deferred.reject(data.message);
			 			}
			 			else {
			 				deferred.resolve(data);
			 			}
			 		}).error(function(data, status) {
			 			deferred.reject(data.message);
			 		});
			 		
			 		// Returning the promise object
		            return deferred.promise;
		 		};
		 		
		 		
		 		/**
		 		 * format params as &key1=val1&key2=val2
		 		 * @param params
		 		 * @returns {String}
		 		 */
		 		KApi.serializeParams = function serializeParams(params) {
		 			var s = '';
		 			for (var key in params) {
		 				s += '&' + key + '=' + params[key];
		 			}
		 			return s;
		 		};
		 		
		 		return KApi;
		 	}
		]);

analyticsServices.factory('DashboardSvc',
		['KApi', '$resource', '$q', 'DashboardDummySvc', 
		 	function DashboardSvcFactory(KApi, $resource, $q, DashboardDummySvc) {
		 		var DashboardSvc = {};
		 		
		 		/**
		 		 * get info for dashboard aggregates line 
		 		 * @param liveOnly	aggregate only live-now-kaltura entries, or viewed during last 36 hrs all-live entries
		 		 * @returns promise
		 		 */
		 		DashboardSvc.getAggregates = function getAggregates(liveOnly) {
		 			// liveReportInputFilter = KalturaLiveReportsInputFilter
		 			// liveReportInputFilter.hoursBefore = 36;
		 			// liveReportInputFilter.isLive = liveOnly;
		 			// KalturaFilterPager = null;
		 			// LiveReports.getReport(LiveReportType.PARTNER_TOTAL, liveReportInputFilter, KalturaFilterPager) 
		 			return DashboardDummySvc.getAggregates(liveOnly);
		 		};
		 		
		 		
		 		/**
		 		 * @private
		 		 * for all live entries - get stats
		 		 */
		 		DashboardSvc._getAllEntriesStats = function _getAllEntriesStats(pageNumber) {
		 			return DashboardDummySvc._getAllEntriesStats(pageNumber).query().$promise;
//					var postData = {
//						'ignoreNull': '1',
//						'filter:objectType': 'KalturaLiveReportsInputFilter',
//			            'filter:orderBy': '-createdAt',
//			            'pager:objectType': 'KalturaFilterPager',
//			            'pager:pageIndex': pageNumber,
//			            'pager:pageSize': '10',
//			            'service': 'livereports',
//			            'action': 'getreport'
//			        };
//					
//					return KApi.doRequest(postData);
		 		};
		 		
		 		/**
		 		 * @private
		 		 * for all live entries - get entry objects (by ids)
		 		 */
		 		DashboardSvc._getAllEntriesEntries = function _getAllEntriesEntries(entryIds) {
		 			var postData = {
							'ignoreNull': '1',
							'filter:objectType': 'KalturaLiveStreamEntryFilter',
							'filter:entryIdsIn': entryIds,
				            'filter:orderBy': '-createdAt',
				            'service': 'livestream',
				            'action': 'list'
				        };
					return KApi.doRequest(postData);
		 		};
		 		
		 		/**
				 * get the list of entries to show
				 * @param pageNumber
				 */
		 		DashboardSvc.getAllEntries = function getAllEntries(pageNumber) {
		 			// get page from reports API, then use entry ids to get entry names from API
		 			
		 			// Creating a deferred object
		            var deferred = $q.defer();
		            
		            DashboardSvc._getAllEntriesStats(pageNumber).then(function (entryStats) {
						// entryStats is KalturaLiveStatsListResponse
						var ids = '';
						entryStats.objects.forEach(function(entry) {
							ids += entry.entryId + ","; 
						}); 
						DashboardSvc._getAllEntriesEntries(ids).then(function(entries) {
							// entries is LiveStreamListResponse
							entryStats.objects.forEach(function (entryStat) {
								// add entry name to stats object
								entries.objects.every(function (entry) {
									if (entryStat.entryId == entry.id) {
										entryStat.name = entry.name;
										entryStat.thumbnailUrl = entry.thumbnailUrl;
										return false;
									}
									return true;
								});
							});
							deferred.resolve(entryStats);
						});
					});
			 		
			 		// Returning the promise object
		            return deferred.promise;
				};
				
				
				/**
				 * @private
				 * @param pageNumber
				 */
				DashboardSvc._getLiveEntriesEntries = function _getLiveEntriesEntries(pageNumber) {
					var postData = {
				            'filter:orderBy': '-createdAt',
				            'filter:objectType': 'KalturaLiveStreamEntryFilter',
				            'filter:isLive': '1',
				            'ignoreNull': '1',
				            'pager:objectType': 'KalturaFilterPager',
				            'pager:pageIndex': pageNumber,
				            'pager:pageSize': '10',
				            'service': 'livestream',
				            'action': 'list'
				        };
					
					return KApi.doRequest(postData);
				};
				
				/**
				 * @private
				 * @param entryIds
				 */
				DashboardSvc._getLiveEntriesStats = function _getLiveEntriesStats(entryIds) {
					return DashboardDummySvc._getLiveEntriesStats(entryIds);
//					var postData = {
//						'ignoreNull': '1',
//						'filter:objectType': 'KalturaLiveReportsInputFilter',
//			            'filter:orderBy': '-createdAt',
//			            'service': 'livereports',
//			            'action': 'getreport'
//			        };
//					
//					return KApi.doRequest(postData);
				};
				
				/**
				 * of the given list, get the entries that are currently live
				 */
				DashboardSvc.getLiveEntries = function getLiveEntries(pageNumber) {
					// liveEntry.list by isLive to know which ones are currently live, then use entry ids in reports API
					
					// Creating a deferred object
		            var deferred = $q.defer();
		            
		            DashboardSvc._getLiveEntriesEntries(pageNumber).then(function (entries) {
						// entries is LiveStreamListResponse 
						var ids = '';
						entries.objects.forEach(function(entry) {
							ids += entry.id + ","; 
						}); 
						DashboardSvc._getLiveEntriesStats(ids).then(function(entryStats) {
							// entryStats is KalturaLiveStatsListResponse 
							entryStats.objects.forEach(function (entryStat) {
								// add entry name to stats object
								entries.objects.every(function (entry) {
									if (entryStat.entryId == entry.id) {
										entryStat.name = entry.name;
										entryStat.thumbnailUrl = entry.thumbnailUrl;
										return false;
									}
									return true;
								});
							});
							deferred.resolve(entryStats);
						});
					});
			 		
			 		// Returning the promise object
		            return deferred.promise;
				};
		 		
		 		
		 		return DashboardSvc;
		 	} 
	 	]);


analyticsServices.factory('EntrySvc',
		['KApi', '$resource', '$q', 'EntryDummySvc',
		 	function EntrySvcFactory(KApi, $resource, $q, EntryDummySvc) {
		 		var EntrySvc = {};
		 		
		 		/**
		 		 * get the entry, add isLive info
		 		 * @param entryId
		 		 */
		 		EntrySvc.getEntry = function getEntry(entryId) {
		 			var dfd = $q.defer();
		 			var postData = {
		 					'service': 'multirequest',
		 					'1:service': 'liveStream',
				            '1:entryId' : entryId,
				            '1:action': 'get',
				            '2:service': 'liveStream',
				            '2:action': 'islive',
				            '2:id': '{1:result:id}',
				            '2:protocol': 'hds'
				        };
					
		 			KApi.doRequest(postData).then(function (mr) {
		 				mr[0].isLive = mr[1];
		 				dfd.resolve(mr[0]);
		 			});
		 			
					return dfd.promise;
		 		};
		 		
		 		
		 		/**
		 		 * get aggregated stats data for this entry
		 		 * @param entryId
		 		 * @param isLive	is this entry currently broadcasting
		 		 * @returns KalturaEntryLiveStats 
		 		 */
		 		EntrySvc.getAggregates = function getAggregates(entryId, isLive) {
		 			// liveReportInputFilter = KalturaLiveReportsInputFilter
		 			// liveReportInputFilter.hoursBefore = 36;
		 			// liveReportInputFilter.isLive = isLive;
		 			// liveReportInputFilter.entryIds = entryId;
		 			// KalturaFilterPager = null;
		 			// LiveReports.getReport(LiveReportType.ENTRY_TOTAL, liveReportInputFilter, KalturaFilterPager) 
		 			return EntryDummySvc.getAggregates(entryId, isLive);
		 		};
		 		
		 		
		 		/**
		 		 * 
		 		 * @param entryId
		 		 * @returns
		 		 */
		 		EntrySvc.getReferrers = function getReferrers(entryId) {
		 			// liveReportInputFilter = KalturaLiveReportsInputFilter
		 			// liveReportInputFilter.hoursBefore = 36;
		 			// liveReportInputFilter.entryIds = entryId;
		 			// liveReportInputFilter.orderBy = ???;
		 			// KalturaFilterPager.pageSize = 10;
		 			// KalturaFilterPager.pageIndex = 1;
		 			// LiveReports.getReport(LiveReportType.ENTRY_SYNDICATION_TOTAL, liveReportInputFilter, KalturaFilterPager) 
		 			return EntryDummySvc.getReferrers(entryId);
		 		};
		 		
		 		
		 		
		 		
		 		EntrySvc.getGraph = function getGraph(entryId) {
		 			return $resource('data/graph.json', {}, {
	 					query: {method:'GET'}
	 				});
		 		};
		 		
		 		EntrySvc.updateGraph = function updateGraph(entryId) {
		 			var d = new Date();
		 			var s = String(d.getTime());
		 			s = s.substr(0, s.length - 4);
		 			s += "0";
		 			var s1 = parseInt(s) + 10;
		 			var s2 = parseInt(s1) + 10;
		 			var ar = [
		 			          {"x" : s, "y" : Math.floor(Math.random()*100)},
		 			          {"x" : s1, "y" : Math.floor(Math.random()*100)},
		 			          {"x" : s2, "y" : Math.floor(Math.random()*100)},
		 			          ];
		 			return ar;
		 		};
		 		
		 		return EntrySvc;
		 	} 
	 	]);




