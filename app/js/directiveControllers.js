'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers'); // get, don't create!!

/**
 * controller for KDP on entry page
 */
analyticsControllers.controller('KPlayerController', ['$scope', '$attrs', '$interval', 
    function($scope, $attrs, $interval) {
		var self = this;
		this.playerElement = null;
  		
  		this.init = function init (element) {
  			self.playerElement = element;
  		};
  		
  		$scope.$on('gotoTime', function (event, time) {
  			// translate timestamp to entry time, go to correct time.
  			var playerTime = time - $scope.entry.firstBroadcast;
  			var kdp = angular.element('#kplayer')[0];
  			kdp.sendNotification("doSeek", playerTime);

  		});


  		$scope.$watch('playerEntryId', function( value ) {
  			function embedNow() {
  				kWidget.embed({
  					"targetId": "kplayer", 
  					"wid": "_" + $scope.pid, 
  					"uiconf_id": $scope.uiconfId, 
  					"entry_id": value, 
  					"flashvars": { 
  						"streamerType": "rtmp" //TODO should eventually be "auto"
  					} 
  				});
  			};
  			if (value) {
  				if (value != -1) {
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

