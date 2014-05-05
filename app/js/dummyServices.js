'use strict';

/* Services */

analyticsServices.factory('DashboardDummySvc',
		['KApi', '$resource', '$q',
		 	function DashboardDummySvc(KApi, $resource, $q) {
		 		var DashboardDummySvc = {};
		 		
		 		/**
		 		 * get info for dashboard aggregates line 
		 		 * @param liveOnly	aggregate only live-now-kaltura entries, or viewed during last 36 hrs all-live entries
		 		 * @returns {Array}
		 		 */
		 		DashboardDummySvc.getAggregates = function getAggregates(liveOnly) {
		 			var resource;
		 			if (liveOnly) {
		 				resource = $resource('data/dashboardLiveAggs.json', {}, {
		 			      query: {method:'GET', isArray:false}
		 			    });
		 			}
		 			else {
		 				resource = $resource('data/dashboardAllAggs.json', {}, {
		 					query: {method:'GET', isArray:false}
		 				});
		 			}
		 			var result = resource.query();
		 			return result.$promise;
		 		};
		 		
		 		
		 		
		 		/**
		 		 * @private
		 		 * for all live entries - get stats
		 		 */
				DashboardDummySvc._getAllEntriesStats = function _getAllEntriesStats(pageNumber) {
					return $resource('data/entries:page.json', {}, {
		 			      query: {method:'GET', params:{page:pageNumber}}
		 			});
		 		};

		 		
		 		DashboardDummySvc._getLiveEntriesStats = function _getLiveEntriesStats(entryIds) {
		 			var dfd = $q.defer();

                    // Mock entry stats
		 			var ids = entryIds.split(',');
		 			var objects = new Array();
		 			var stat;
		 			ids.forEach(function(entryId) {
		 				if (entryId) {
			 				var t = new Date();
			 				t = t.time - Math.floor(Math.random() * 12960000);
			 				stat = {
			 						"objectType" : "KalturaEntryLiveStats",
			 						"entryId" : entryId,
			 						"plays" : "",
			 						"audience" : Math.floor(Math.random() * 500),
			 						"secondsViewed" : Math.floor(Math.random() * 3600),
			 						"bufferTime" : Math.floor(Math.random() * 60),
			 						"avgBitrate" : Math.floor(Math.random() * 15),
			 						"startTime" : t,
			 						"timestamp" : ""
			 				};
			 				objects.push(stat);
		 				}
		 			});
		 			
		 			
                    dfd.resolve({
                        "objectType" : "KalturaLiveStatsListResponse",
                        "objects" : objects,
                        "totalCount" : ids.length
                    });

                    return dfd.promise;
		 		};
		 		
		 		
		 		return DashboardDummySvc;
		 	} 
	 	]);


analyticsServices.factory('EntryDummySvc',
		['KApi', '$resource', '$q', 
		 	function EntryDummySvcFactory(KApi, $resource, $q) {
		 		var EntryDummySvc = {};
		 		
		 		/**
		 		 * get aggregated stats data for this entry
		 		 * @param entryId
		 		 * @param isLive	is this entry currently broadcasting
		 		 * @returns KalturaEntryLiveStats 
		 		 */
		 		EntryDummySvc.getAggregates = function getAggregates(entryId, isLive) {
		 			var dfd = $q.defer();
		 			var stats = {
	 						"objectType" : "KalturaEntryLiveStats",
	 						"plays" : isLive ? "" : Math.floor(Math.random() * 500),
	 						"audience" : isLive ? Math.floor(Math.random() * 500) : "",
	 						"secondsViewed" : Math.floor(Math.random() * 3600),
	 						"bufferTime" : Math.floor(Math.random() * 60),
	 						"avgBitrate" : Math.floor(Math.random() * 15)
	 					};
		 			
		 			
		 			dfd.resolve({
		 				"objectType" : "KalturaLiveStatsListResponse",
		 				"objects" : new Array (stats),
		 				"totalCount" : "1"
		 			});
		 			
		 			return dfd.promise;
		 		};
		 		
		 		
		 		EntryDummySvc.getReferrers = function getReferrers(entryId) {
		 			var dfd = $q.defer();
		 			
		 			var ar = new Array();
		 			var stats;
		 			for (var i = 0; i<10; i++) {
		 				stats = {
	 						"objectType" : "KalturaEntryReferrerLiveStats",
	 						"plays" : Math.floor(Math.random() * 500),
	 						"audience" : "",
	 						"secondsViewed" : Math.floor(Math.random() * 3600),
	 						"bufferTime" : Math.floor(Math.random() * 60),
	 						"avgBitrate" : Math.floor(Math.random() * 15),
	 						"referrer" : "www.domain" + i + ".com"
	 					};
		 				ar.push(stats);
		 			}
		 			
		 			dfd.resolve({
		 				"objectType" : "KalturaLiveStatsListResponse",
		 				"objects" : ar,
		 				"totalCount" : "1"
		 			});
		 			return dfd.promise;
		 		};

		 		
		 		
		 		EntryDummySvc.getGraph = function getGraph(entryId, fromDate, toDate) {
		 			var dfd = $q.defer();
		 			var t = fromDate;
		 			var ar = new Array();
		 			var stats;
		 			var au = Math.floor(Math.random() * 500);
		 			while (t < toDate) {
		 				au += Math.floor(Math.random() * 10) - 5;
		 				au = Math.max(au, 0);
		 				stats = {
	 						"objectType" : "KalturaEntryLiveStats",
	 						"plays" : "",
	 						"audience" : au,
	 						"secondsViewed" : "",
	 						"bufferTime" : "",
	 						"avgBitrate" : "",
	 						"timestamp" : t /1000
	 							
	 					};
		 				ar.push(stats);
		 				t += 10000;
		 			}
		 			
		 			dfd.resolve({
		 				"objectType" : "KalturaLiveStatsListResponse",
		 				"objects" : ar,
		 				"totalCount" : ar.length
		 			});
		 			return dfd.promise;
		 		};
		 		
		 		return EntryDummySvc;
		 	} 
	 	]);




