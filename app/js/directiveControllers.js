'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers'); // get, don't create!!

/**
 * controller for KDP on entry page
 */
analyticsControllers.controller('KPlayerController', ['$scope', '$attrs', '$interval', 'EntrySvc',
    function($scope, $attrs, $interval, EntrySvc) {
		var self = this;
		this.playerElement = null;
		this.eventCuePoints = new Array();
  		this.canSeek = false; // true if list broadcast cuepoints was executed

  		this.init = function init (element) {
  			self.playerElement = element;
  		};


		/**
		 * calculate correct player time based on firstBroadcast and start/stop broadcast cuepoints
		 * @param realTime	the required "real" time
		 * @param firstBroadcast	time of entry first broadcast start
		 * @return the time in seconds the player has to seek to get to the required "real" time
		 */
		this.getPlayerTime = function getPlayerTime(realTime, firstBroadcast) {
			var targetTime = realTime - firstBroadcast;
			var lastStopCp = null;
			// find start followed by stop and reduce their values
			for (var i = 0; i<this.eventCuePoints.length; i++) {
				// stop when not relevant anymore
				if (this.eventCuePoints[i].startTime > realTime) {
					break;
				}

				if (this.eventCuePoints[i].eventType == 2/*EventType.BROADCAST_STOP*/) {
					lastStopCp = this.eventCuePoints[i];
				}
				else if (this.eventCuePoints[i].eventType == 1/*EventType.BROADCAST_START*/) {
					if (lastStopCp != null) {
						var temp = (this.eventCuePoints[i].startTime - lastStopCp.startTime);
						targetTime -= temp;
						lastStopCp = null;
					}
				}
			}
			return targetTime;
		}


  		$scope.$on('gotoTime', function (event, time) {
			var kdp = angular.element('#kplayer')[0];
			if (self.canSeek && kdp) {
				// translate timestamp to entry time, go to correct time.
				var playerTime = self.getPlayerTime(time, $scope.entry.firstBroadcast);
				kdp.sendNotification("doSeek", playerTime);
			}
  		});


  		$scope.$watch('playerEntryId', function( value ) {
  			function embedNow() {
  				kWidget.embed({
  					"targetId": "kplayer", 
  					"wid": "_" + $scope.pid, 
  					"uiconf_id": $scope.uiconfId, 
  					"entry_id": value, 
  					"flashvars": { 
  						"streamerType": "auto"
  					} 
  				});
  			};
  			if (value) {
  				if (value != -1) {
					// list broadcast cuepoints
					EntrySvc.listEventCuepoints($scope.entry.id).then(function(data) {
						// data is eventCuepointListResponse
						self.eventCuePoints = data.objects;
						self.canSeek = true;
					});
					// embed
  					if (window.playerLibLoaded) {
			  			embedNow();
  					}
  					else {
  						// setTimeout until loaded
  						$scope.playerIntervalPromise = $interval(function() {
  							if (window.playerLibLoaded) {
  								$interval.cancel($scope.playerIntervalPromise);
  								$scope.playerIntervalPromise = undefined;		
  								embedNow();
  							}
  						}, 500);
  					}
  				} else {
  					self.playerElement.html('<h3>Live Session Was Not Recorded</h3>');
  				}
  				$scope.playerEntryId = null;
	  		}
  		});
  		
  		$scope.$on('$destroy', function() {
			// Make sure that the interval is destroyed too
			if (angular.isDefined($scope.playerIntervalPromise)) {
				$interval.cancel($scope.playerIntervalPromise);
				$scope.playerIntervalPromise = undefined;
			}
		});
}]);

