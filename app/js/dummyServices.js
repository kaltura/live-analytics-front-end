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


analyticsServices.factory('EntrySvc',
		['KApi', '$resource', 
		 	function EntrySvcFactory(KApi, $resource) {
		 		var EntrySvc = {};
		 		
		 		EntrySvc.getAggregates = function getAggregates(entryId) {
		 			var ar = [{'title': 'audience',
		 						'value': 36},
		 					{'title': 'minutes_viewed',
			 				'value': 512},
			 				{'title': 'buffertime',
				 			'value': 2},
				 			{'title': 'bitrate',
					 		'value': 10}
				 	];
		 			return ar;
		 		};
		 		
		 		EntrySvc.getReferals = function getReferals(entryId) {
		 			var ar = [
		 			          {'domain': 'www.domain1.com', 'visits': '36', 'percents' : '5.57'},
		 			          {'domain': 'www.domain2.com', 'visits': '12', 'percents' : '5.7'},
		 			          {'domain': 'www.domain3.com', 'visits': '45', 'percents' : '3.47'},
		 			          {'domain': 'www.domain4.com', 'visits': '76', 'percents' : '5.3'},
		 			          {'domain': 'www.domain5.com', 'visits': '12', 'percents' : '6.26'},
		 			          {'domain': 'www.domain6.com', 'visits': '65', 'percents' : '7.76'},
		 			          {'domain': 'www.domain7.com', 'visits': '87', 'percents' : '8.12'},
		 			          {'domain': 'www.domain8.com', 'visits': '23', 'percents' : '1.12'},
		 			          {'domain': 'www.domain9.com', 'visits': '76', 'percents' : '9.45'},
		 			          {'domain': 'www.domain10.com', 'visits': '34', 'percents' : '0.57'},
		 				
		 						];
		 			return ar;
		 		};
		 		
		 		EntrySvc.getEntry = function getEntry(entryId) {
		 			var postData = {
				            'entryId' : entryId,
				            'service': 'livestream',
				            'action': 'get'
				        };
					
					return KApi.doRequest(postData);
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




