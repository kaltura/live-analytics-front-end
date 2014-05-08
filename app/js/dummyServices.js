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
		 		
		 		EntryDummySvc.ctLatlongCpy = null;
		 		
		 		EntryDummySvc.ctLatlong = [["zw","zikamanas village","Zikamanas Village","00","","-18.2166667","27.95"],
		 		                        ["zw","zimbabwe","Zimbabwe","07","","-20.2666667","30.9166667"],
		 		                       ["zw","zimre park","Zimre Park","04","","-17.8661111","31.2136111"],
		 		                       ["ye","subayrah","Subayrah","04","","15.2491667","48.3438889"],
		 		                       ["ye","subayrahlll","Subayrahlll","13","","13.84","44.5875"],
		 		                       ["ye","subleiha","Subleiha","17","","13.6833333","43.9666667"],
		 		                       ["us","leeds","Leeds","ME","","44.3033333","-70.1200000"],
		 		                       ["us","leeds junction","Leeds Junction","ME","","44.2063889","-70.0794444"],
		 		                       ["us","levant","Levant","ME","","44.8691667","-68.9352778"],
		 		                       ["us","lewiston","Lewiston","ME","36199","44.1002778","-70.2152778"],
		 		                       ["pl","sosna kozulki","Sosna Kozulki","78","","52.270542","22.230974"],
		 		                       ["pl","sosnia","Sosnia","81","","53.47861","22.586133"],
		 		                       ["pl","sosnica","Sosnica","72","","51.032867","16.78776"],
		 		                       ["na","linyanti","Linyanti","28","","-18.0666667","24.0166667"],
		 		                       ["na","lionga","Lionga","28","","-18.3","23.7333333"],
		 		                       ["na","lisikili","Lisikili","28","","-17.55","24.4333333"],
		 		                       ["na","litaba","Litaba","28","","-18.0666667","23.35"],
		 		                       ["mn","ugomoriin bayshing","Ugomoriin Bayshing","10","","46.0166667","95.0833333"],
		 		                       ["mn","ugorkhin khid","Ugörkhin khid","18","","46.7833333","104.7833333"],
		 		                       ["mn","ugtaaliin dugang","Ugtaaliin Dugang","18","","48.3833333","105.8"],
		 		                       ["mn","ugtaal suma","Ugtaal Suma","08","","46.0666667","107.5"],
		 		                       ["lv","akmenes muiza","Akmenes Muiza","17","","56.7166667","21.3833333"],
		 		                       ["lv","akmeni","Akmeni","29","","56.9166667","22.9666667"],
		 		                       ["lv","akmenmuiza","Akmenmuiza","29","","56.9166667","22.9666667"],
		 		                       ["lk","uttupitiya","Uttupitiya","30","","8.1166667","80.6166667"],
		 		                       ["lk","uturakanda","Uturakanda","33","","6.7","80.55"],
		 		                       ["lk","uturala","Uturala","33","","7.2166667","80.45"],
		 		                       ["la","ban namuangkay","Ban Namuangkay","17","","19.487778","102.012778"],
		 		                       ["la","ban namu","Ban Namu","14","","19.283333","103.1"],
		 		                       ["kr","ssaryeom","Ssaryeom","13","","37.609722","126.593333"],
		 		                       ["kr","ssaryom","Ssaryom","13","","37.609722","126.593333"],
		 		                       ["kr","sseumbae","Sseumbae","13","","37.409444","127.602778"],
		 		                       ["kr","ssiagol","Ssiagol","19","","36.3208","127.3192"],
		 		                       ["kp","puwolli","Puwolli","12","","38.7175","126.0852778"],
		 		                       ["kp","puwondong","Puwondong","06","","37.9755556","125.9241667"],
		 		                       ["kp","puyangni","Puyangni","06","","38.1027778","125.1922222"],
		 		                       ["ke","gatugi two","Gatugi Two","01","","-0.5333333","36.9666667"],
		 		                       ["ke","gatukuyu","Gatukuyu","01","","-0.9833333","36.9666667"],
		 		                       ["ke","gatumbi","Gatumbi","01","","-0.45","37.35"],
		 		                       ["ir","samjan","Samjan","04","","26.715217","61.479121"],
		 		                       ["ir","sam kandeh","Sam Kandeh","35","","36.6","53.166667"],
		 		                       ["ir","samk","Samk","41","","32.0582","59.5215"],
		 		                       ["in","khan alampur","Khan Alampur","36","","29.95","77.566667"],
		 		                       ["in","khana majra","Khana Majra","10","","30.2384","76.6429"],
		 		                       ["in","khanan","Khanan","12","","34.301389","74.931944"],
		 		                       ["in","khanapara","Khanapara","03","","26.1","91.816667"],
		 		                       ["ad","canillo","Canillo","02","3292","42.5666667","1.6"],
		 		                       ["ad","casas vila","Casas Vila","03","","42.5333333","1.5666667"],
		 		                       ["ad","certers","Certers","06","","42.4666667","1.5"]];
		 		
		 		EntryDummySvc.ctryLatlong = [["zw","zikamanas village","Zikamanas Village","00","","-18.2166667","27.95"],
					 		                       ["ye","subayrah","Subayrah","04","","15.2491667","48.3438889"],
					 		                       ["us","leeds","Leeds","ME","","44.3033333","-70.1200000"],
					 		                       ["pl","sosna kozulki","Sosna Kozulki","78","","52.270542","22.230974"],
					 		                       ["na","litaba","Litaba","28","","-18.0666667","23.35"],
					 		                       ["mn","ugomoriin bayshing","Ugomoriin Bayshing","10","","46.0166667","95.0833333"],
					 		                       ["lv","akmenes muiza","Akmenes Muiza","17","","56.7166667","21.3833333"],
					 		                       ["lk","uttupitiya","Uttupitiya","30","","8.1166667","80.6166667"],
					 		                       ["la","ban namu","Ban Namu","14","","19.283333","103.1"],
					 		                       ["kr","ssiagol","Ssiagol","19","","36.3208","127.3192"],
					 		                       ["kp","puwolli","Puwolli","12","","38.7175","126.0852778"],
					 		                       ["ke","gatugi two","Gatugi Two","01","","-0.5333333","36.9666667"],
					 		                       ["ir","samjan","Samjan","04","","26.715217","61.479121"],
					 		                       ["in","khan alampur","Khan Alampur","36","","29.95","77.566667"],
					 		                       ["ad","certers","Certers","06","","42.4666667","1.5"]];
		 		
		 		EntryDummySvc._getCityCoord = function _getCityCoord() {
		 			var n = Math.floor(Math.random() * EntryDummySvc.ctLatlongCpy.length);
		 			return EntryDummySvc.ctLatlongCpy.splice(n, 1)[0];
		 		};
		 		
		 		
		 		EntryDummySvc._getCountryCoord = function _getCountryCoord(ct) {
		 			var ctry = ct[0];
		 			for (var i = 0; i<EntryDummySvc.ctryLatlong.length; i++) {
		 				if (EntryDummySvc.ctryLatlong[i][0] == ctry) {
		 					return EntryDummySvc.ctryLatlong[i]; 
		 				}
		 			}
		 			return null;
		 		};
		 		
		 		EntryDummySvc.getMap = function getMap(entryId, time) {
		 			var dfd = $q.defer();
		 			var t = 49; //Math.floor(Math.random() * 500); // number of dots
		 			var ar = new Array();
		 			var stats, ct, ctry;
		 			EntryDummySvc.ctLatlongCpy = EntryDummySvc.ctLatlong.concat();
		 			while (t > 0) {
		 				ct = EntryDummySvc._getCityCoord();
		 				ctry = EntryDummySvc._getCountryCoord(ct);
		 				stats = {
		 						"objectType" : "KalturaGeoTimeLiveStats",
		 						"plays" : "",
		 						"audience" : Math.floor(Math.random() * 500),
		 						"secondsViewed" : "",
		 						"bufferTime" : "",
		 						"avgBitrate" : "",
		 						"timestamp" : time,
		 						"country" : {
		 							"objectType" : "KalturaGeoCoordinates",
		 							"name" : ctry[0],
		 							"latitude" : ctry[5], //Math.random() * 180 - 90, 
		 							"longitude" : ctry[6] //Math.random() * 360 - 180
		 						},
		 						"city" : {
		 							"objectType" : "KalturaGeoCoordinates",
		 							"name" : ct[2],
		 							"latitude" : ct[5], 
		 							"longitude" : ct[6] 
		 						}
		 				};
		 				ar.push(stats);
		 				t -= 1;
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




