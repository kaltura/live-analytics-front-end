'use strict';

/* Filters */


var analyticsFilters = angular.module('analyticsFilters', []);

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
	if (h>0 || m>0) {
		if ((showHours && h>0) || forceHours) {
			result += addZero(h) + ':'; 
		}
		result += addZero(m);
		if (showSeconds) {
			result += ':' + addZero(s);
		}
	}
	else {
		// only seconds, maybe
		if (showSeconds) {
			result = addZero(s);
		}
		else {
			return '00';
		}
	}
	return result;
};

function addZero(n) {
	return (n<10 ? '0' : '') + n;
};


analyticsFilters.filter('formatAgg', [ '$filter', function($filter) {
	var formatAgg = function formatAgg(agg) {
		var result = '';
		switch (agg.title) {
		case 'audience':
		case 'audience_inc_dvr':
		case 'plays':
			result = $filter('number')(agg.value, 0);
			break;
		case 'seconds_viewed':
			result = $filter('number')(agg.value/60, 0); // actually returns minutes
			break;
		case 'buffertime':
			result = $filter('number')(agg.value, 2);
			if (result.indexOf('.') > 4) {
				// if we have 4 digits number, we only want a single digit after the dec point
				result = $filter('number')(agg.value, 1);
			}
			break;
		case 'bitrate':
			result = $filter('number')(agg.value, 2);
			if (result.indexOf('.') > 4) {
				// if we have 4 digits number, we only want a single digit after the dec point
				result = $filter('number')(agg.value, 1);
			}
			break;
		}
		return result;
	}; 
	
	return formatAgg;
}]);

analyticsFilters.filter('time', [function() {
	var time = function time(val) {
		return formatTime(val, false, true);
	}; 
	
	return time;
}]);

analyticsFilters.filter('percents', [function() {
	// val is expected to be 0-1, return value has 2 digits after dec. (65.44)
	var percents = function percents(val) {
		return Math.floor(val * 10000) / 100;
	}; 
	
	return percents;
}]);

analyticsFilters.filter('avgBitrate', [function() {
	var avgBitrate = function avgBitrate(val) {
		return parseFloat(val);
	}; 
	
	return avgBitrate;
}]);
