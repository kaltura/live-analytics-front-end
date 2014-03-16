'use strict';

/* Filters */

var analyticsFilters = angular.module('analyticsFilters', []);

analyticsFilters.filter('textify', [function() {
	var textify = function textify(text) {
		var result = '';
		switch (text) {
		case 'audience':
			result = 'Audience';
			break;
		case 'minutes_viewed':
			result = 'Minutes Viewed';
			break;
		case 'buffertime':
			result = 'Buffering Time';
			break;
		case 'bitrate':
			result = 'Average Bitrate';
			break;
		}
		return result;
    }; 
    return textify;
  }]);

analyticsFilters.filter('formatValue', [function() {
	
	/**
	 * formats a time string without using Flash's Date object
	 * @param secs
	 * @param showHours		if hours is more than 0, show it
	 * @param showSeconds	show seconds (even if 0)
	 * @param forceHours	show hours even if 0
	 * @return given value, formatted as {HH}:MM:{SS }
	 */
	function formatTime(secs, showHours, showSeconds, forceHours) {
		var h = Math.floor(secs / 3600); // 60 * 60 = 3600
		var sh = h * 3600;	// hours in seconds
		var m = Math.floor((secs - sh) / 60);
		var sm = m * 60;	// minutes in seconds
		var s = secs - sh - sm;
		
		var result = '';
		if ((showHours && h>0) || forceHours) {
			result += addZero(h) + ':'; 
		}
		result += addZero(m);
		if (showSeconds) {
			result += ':' + addZero(s);
		}
		return result;
	};
	
	function addZero(n) {
		return (n<10 ? '0' : '') + n;
	};
	
	var formatValue = function formatValue(agg) {
		var result = '';
		switch (agg.title) {
		case 'audience':
		case 'minutes_viewed':
			result = agg.value;
			break;
		case 'buffertime':
			result = formatTime(agg.value, false, true);
			break;
		case 'bitrate':
			result = agg.value + 'mbs';
			break;
		}
		return result;
	}; 
	
	return formatValue;
}]);
