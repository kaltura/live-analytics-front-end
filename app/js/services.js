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
		['$http', '$q', '$location', 'SessionInfo',
		 	function KApiFactory ($http, $q, $location, SessionInfo) {
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
			 				if (data.code == "INVALID_KS") {
			 					console.log(data);
			 					$location.path("/login");
			 				}
			 				else {
			 					deferred.reject(data.message);
			 				}
			 			}
			 			else {
			 				deferred.resolve(data);
			 			}
			 		}).error(function(data, status) {
			 			console.log(data);
			 			$location.path("/login");
			 			//deferred.reject(data.message);
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
		 		 * always use 10 items in page
		 		 */ 
		 		DashboardSvc.pageSize = '10';
		 		
		 		/**
		 		 * get info for dashboard aggregates line - for all entries (live + dead, as dead) 
		 		 * @returns promise
		 		 */
		 		DashboardSvc.getDeadAggregates = function getDeadAggregates() {
		 			var postData = {
						'ignoreNull': '1',
						'filter:objectType': 'KalturaLiveReportInputFilter',
			            'filter:fromTime': '-129600',
			            'filter:toTime': '-2',
			            'filter:live': '0',
			            'pager:objectType': 'KalturaFilterPager',
			            'pager:pageIndex': '1',
			            'pager:pageSize': DashboardSvc.pageSize,
			            'reportType': 'PARTNER_TOTAL',
			            'service': 'livereports',
			            'action': 'getreport'
			        };
					
					return KApi.doRequest(postData);
		 		};
		 		
		 		/**
		 		 * get info for dashboard aggregates line - for currently live Kaltura-live entries 
		 		 * @returns promise
		 		 */
		 		DashboardSvc.getLiveAggregates = function getLiveAggregates() {
		 			/* MR:
		 			 * audience - 10 secs (now)
		 			 * minutes viewed - 36 hours
		 			 * buffertime - 1 minute
		 			 * bitrate - 1 minute
		 			 * */
		 			var postData = {
		 					'ignoreNull': '1',
		 					'service': 'multirequest',
		 					// 1 - audience - now
		 					'1:filter:objectType': 'KalturaLiveReportInputFilter',
		 					'1:filter:fromTime': '-60',
		 					'1:filter:toTime': '-60',
		 					'1:filter:live': '1',
		 					'1:pager:objectType': 'KalturaFilterPager',
		 					'1:pager:pageIndex': '1',
		 					'1:pager:pageSize': DashboardSvc.pageSize,
		 					'1:reportType': 'PARTNER_TOTAL',
		 					'1:service': 'livereports',
		 					'1:action': 'getreport',
	 						// 2 - minutes viewed - 36 hours
	 						'2:filter:objectType': 'KalturaLiveReportInputFilter',
	 						'2:filter:fromTime': '-129600',
	 						'2:filter:toTime': '-2',
	 						'2:filter:live': '1',
	 						'2:pager:objectType': 'KalturaFilterPager',
	 						'2:pager:pageIndex': '1',
	 						'2:pager:pageSize': DashboardSvc.pageSize,
	 						'2:reportType': 'PARTNER_TOTAL',
	 						'2:service': 'livereports',
	 						'2:action': 'getreport',
 							// 3 - buffertime, bitrate - 1 minute
 							'3:filter:objectType': 'KalturaLiveReportInputFilter',
 							'3:filter:fromTime': '-60',
 							'3:filter:toTime': '-2',
 							'3:filter:live': '1',
 							'3:pager:objectType': 'KalturaFilterPager',
 							'3:pager:pageIndex': '1',
 							'3:pager:pageSize': DashboardSvc.pageSize,
 							'3:reportType': 'PARTNER_TOTAL',
 							'3:service': 'livereports',
 							'3:action': 'getreport'
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
						'filter:objectType': 'KalturaLiveReportInputFilter',
			            'filter:orderBy': '-createdAt',
			            'filter:fromTime': '-129600',
			            'filter:toTime': '-2',
			            'pager:objectType': 'KalturaFilterPager',
			            'pager:pageIndex': pageNumber,
			            'pager:pageSize': DashboardSvc.pageSize,
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
				            'pager:pageSize': DashboardSvc.pageSize,
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
						'service': 'multirequest',
						// 1 - audience - now
						'1:filter:objectType': 'KalturaLiveReportInputFilter',
			            '1:filter:orderBy': '-createdAt',
			            '1:filter:entryIds': entryIds,
			            '1:filter:live': 1,
			            '1:filter:fromTime': '-60',
			            '1:filter:toTime': '-60',
			            '1:reportType': 'ENTRY_TOTAL',
			            '1:service': 'livereports',
			            '1:action': 'getreport',
			            // 2 - minutes viewed - 36 hours
			            '2:filter:objectType': 'KalturaLiveReportInputFilter',
			            '2:filter:orderBy': '-createdAt',
			            '2:filter:entryIds': entryIds,
			            '2:filter:live': 1,
			            '2:filter:fromTime': '-129600',
			            '2:filter:toTime': '-2',
			            '2:reportType': 'ENTRY_TOTAL',
			            '2:service': 'livereports',
			            '2:action': 'getreport',
			            // 3 - buffertime, bitrate - 1 minute
			            '3:filter:objectType': 'KalturaLiveReportInputFilter',
			            '3:filter:orderBy': '-createdAt',
			            '3:filter:entryIds': entryIds,
			            '3:filter:live': 1,
			            '3:filter:fromTime': '-60',
			            '3:filter:toTime': '-2',
			            '3:reportType': 'ENTRY_TOTAL',
			            '3:service': 'livereports',
			            '3:action': 'getreport'
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
							DashboardSvc._getLiveEntriesStats(ids).then(function(entryStatsMR) {
								// entryStats is MR with KalturaLiveStatsListResponse
								// take the 1st set of results, override with the results from the other sets, then add entry info
								if (entryStatsMR[0].objects) {
									var now = entryStatsMR[0].objects;
									var hours = entryStatsMR[1].objects; 
									var minute = entryStatsMR[2].objects;
									now.forEach(function (entryStat) {
										// secondsViewed - in 36 hours
										hours.every(function (entryStat2) {
											if (entryStat.entryId == entryStat2.entryId) {
												entryStat.secondsViewed = entryStat2.secondsViewed;
												return false;
											}
											return true;
										});

										// buffertime, bitrate - 1 minute
										minute.every(function (entryStat3) {
											if (entryStat.entryId == entryStat3.entryId) {
												entryStat.bufferTime = entryStat3.bufferTime;
												entryStat.avgBitrate = entryStat3.avgBitrate;
												return false;
											}
											return true;
										});
										// entry info
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
								deferred.resolve(entryStatsMR[0]);
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
						'filter:objectType': 'KalturaLiveReportInputFilter',
						'filter:fromTime': '-129600',
			            'filter:toTime': '-2',
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
						'filter:objectType': 'KalturaLiveReportInputFilter',
						'filter:fromTime': '-129600',
			            'filter:toTime': '-2',
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
						'filter:objectType': 'KalturaLiveReportInputFilter',
						'filter:fromTime': '-129600',
			            'filter:toTime': '-2',
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
						'filter:objectType': 'KalturaLiveReportInputFilter',
						'filter:fromTime': time,
			            'filter:toTime': time,
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




