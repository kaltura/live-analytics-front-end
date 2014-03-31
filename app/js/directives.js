'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);


analyticsDirectives.directive('kplayer', function() {
	return {
		
		restrict : 'E',
		scope: {
			entryid: '@',
			uiconf: '=',	
			pid: '='	
		},
		//replace : true,
		template: '<div id="kplayer" style="width:100%; height:100%;"></div>',
		link: function($scope, element, attrs) {
			console.log('s');
			kWidget.embed({
            	"targetId": "kplayer", 
            	"wid": "_" +$scope.pid, 
              	"uiconf_id": $scope.uiconf, 
              	"flashvars": { 
              		"streamerType": "auto" 
              	}, 
              	"cache_st": 1395933525, 
              	"entry_id": $scope.entryid 
              });
			
		}
	};
});

