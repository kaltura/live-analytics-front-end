'use strict';

/* Services */

var analyticsServices = angular.module('analyticsServices', [ 'ngResource' ]);


analyticsServices.factory('SessionInfo',
		['$location',
		 	function SessionInfoFactory($location) {
		 		var sessionInfo = {};
		 		sessionInfo.ks = '';
		 		sessionInfo.pid = '';
		 		sessionInfo.uiconfid = '';
		 		
		 		sessionInfo.setKs = function setKs(value) {
		 			sessionInfo.ks = value;
		 		};
		 		sessionInfo.setPid = function setPid(value) {
		 			sessionInfo.pid = value;
		 		};
		 		sessionInfo.setUiconfId = function setUiconfId(value) {
		 			sessionInfo.uiconfid = value;
		 		};
		 		
		 		try {
	                var kmc = window.parent.kmc;
	                if (kmc && kmc.vars) {
	                    if (kmc.vars.ks)
	                        sessionInfo.ks = kmc.vars.ks;
	                    if (kmc.vars.partner_id)
	                    	sessionInfo.pid = kmc.vars.partner_id;
	                    if (kmc.vars.service_url) 
	                    	sessionInfo.service_url = kmc.vars.service_url;
	                    if (kmc.vars.liveanalytics) 
	                    	sessionInfo.uiconfid = kmc.vars.liveanalytics.player_id;
	                }
	            } catch (e) {
	                console.log('Could not locate parent.kmc: ' + e);
	            }
	            
	            if (!sessionInfo.ks) { //navigate to login
	                $location.path("/login");
	            } 
	            
		 		return sessionInfo;
		 	} 
	 	]);

		
		
analyticsServices.factory('KApi',
		['$http', '$q', 'SessionInfo',
		 	function KApiFactory ($http, $q, SessionInfo) {
		 		var KApi = {};
		 		
		 		KApi.IE = (!!window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;
		 		/**
		 		 * @param request 	request params
		 		 * @returns	promise object
		 		 */
		 		KApi.doRequest = function doRequest (request) {
		 			// Creating a deferred object
		            var deferred = $q.defer();
			 		// add required params
		            request.ks = SessionInfo.ks;
		            var method = "post";
			 		var sParams;
			 		var params;
			 		if (KApi.IE < 10) {
	                    request['callback'] = 'JSON_CALLBACK';
	                    request['format'] = '9';
	                    params = request;
	                    method = 'jsonp';
	                }
			 		else {
			 			params = {'format' : '1'};
			 			sParams = this.serializeParams(request);
			 		}
			 		
			 		$http({
			 			data: sParams,
			 			url: SessionInfo.service_url + "/api_v3/index.php",
				 		method: method,
			 			params: params,
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
		['KApi', '$resource', '$q',  
		 	function DashboardSvcFactory(KApi, $resource, $q) {
		 		var DashboardSvc = {};
		 		
		 		/**
		 		 * get info for dashboard aggregates line 
		 		 * @param liveOnly	aggregate only live-now-kaltura entries, or viewed during last 36 hrs all-live entries
		 		 * @returns promise
		 		 */
		 		DashboardSvc.getAggregates = function getAggregates(liveOnly) {
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:hoursBefore': '36',
			            'filter:live': liveOnly ? '1' : '0',
			            'pager:objectType': 'KalturaFilterPager',
			            'pager:pageIndex': '1',
			            'pager:pageSize': '10',
			            'reportType': 'PARTNER_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		
		 		/**
		 		 * @private
		 		 * for all live entries - get stats
		 		 */
		 		DashboardSvc._getAllEntriesStats = function _getAllEntriesStats(pageNumber) {
					var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:orderBy': '-createdAt',
			            'filter:hoursBefore': '36',
			            
			            'pager:objectType': 'KalturaFilterPager',
			            'pager:pageIndex': pageNumber,
			            'pager:pageSize': '10',
			            'reportType': 'ENTRY_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
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
						if (entryStats.totalCount > 0) {
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
											entryStat.startTime = entry.firstBroadcast * 1000; // API returns secs, we need ms
											return false;
										}
										return true;
									});
								});
								deferred.resolve(entryStats);
							});
						}
						else {
							// no entries returned stats, resolve.
							deferred.resolve(entryStats);
						}
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
					var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:orderBy': '-createdAt',
			            'filter:entryIds': entryIds,
			            'filter:live': 1,
			            'filter:hoursBefore': '36',
			            'reportType': 'ENTRY_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
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
						if (entries.totalCount > 0) {
							entries.objects.forEach(function(entry) {
								ids += entry.id + ","; 
							}); 
							ids = ids.substr(0, ids.length - 1);
							DashboardSvc._getLiveEntriesStats(ids).then(function(entryStats) {
								// entryStats is KalturaLiveStatsListResponse
								if (entryStats.objects) {
									entryStats.objects.forEach(function (entryStat) {
										// add entry name to stats object
										entries.objects.every(function (entry) {
											if (entryStat.entryId == entry.id) {
												entryStat.name = entry.name;
												entryStat.thumbnailUrl = entry.thumbnailUrl;
												entryStat.startTime = entry.firstBroadcast * 1000; // API returns secs, we need ms
												return false;
											}
											return true;
										});
									});
								}
								deferred.resolve(entryStats);
							});
						}
						else {
							// no currently live entries, resolve with empty data
							deferred.resolve({
		                        "objectType" : "KalturaLiveStatsListResponse",
		                        "objects" : null,
		                        "totalCount" : '0'
		                    });
						}
					});
			 		
			 		// Returning the promise object
		            return deferred.promise;
				};
		 		
		 		
		 		return DashboardSvc;
		 	} 
	 	]);


analyticsServices.factory('EntrySvc',
		['KApi', '$resource', '$q', 
		 	function EntrySvcFactory(KApi, $resource, $q) {
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
		 				mr[0].sessionStartTime = mr[0].createdAt + 60;
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
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:hoursBefore': '36',
			            'filter:entryIds': entryId,
			            'filter:live': isLive ? '1' : '0',
			            'reportType': 'ENTRY_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		
		 		/**
		 		 * 
		 		 * @param entryId
		 		 * @returns
		 		 */
		 		EntrySvc.getReferrers = function getReferrers(entryId) {
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:hoursBefore': '36',
			            'filter:entryIds': entryId,
			            'pager:objectType': 'KalturaFilterPager',
			            'pager:pageIndex': '1',
			            'pager:pageSize': '10',
			            'reportType': 'ENTRY_SYNDICATION_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		
		 		
		 		/**
		 		 * get graph data for base 36 hours
		 		 * @param entryId
		 		 * @param fromDate (timestamp sec)
		 		 * @param toDate (timestamp sec)
		 		 * @returns
		 		 */
		 		EntrySvc.getGraph = function getGraph(entryId, fromDate, toDate) {
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:fromTime': fromDate,
			            'filter:toTime': toDate,
			            'filter:entryIds': entryId,
			            'reportType': 'ENTRY_TIME_LINE',
			            'service': 'livereports',
			            'action': 'getevents'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		
		 		
		 		/**
		 		 * get map data for required time
		 		 * @param entryId
		 		 * @param time	(timestamp sec)
		 		 * @returns
		 		 */
		 		EntrySvc.getMap = function getMap(entryId, time) {
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportsInputFilter',
			            'filter:eventTime': time,
			            'filter:entryIds': entryId,
			            'reportType': 'ENTRY_GEO_TIME_LINE',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		
		 		return EntrySvc;
		 	} 
	 	]);




