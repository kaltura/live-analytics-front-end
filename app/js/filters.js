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


analyticsFilters.filter('formatAgg', [function() {
	var formatAgg = function formatAgg(agg) {
		var result = '';
		switch (agg.title) {
		case 'audience':
			result = agg.value;
			break;
		case 'seconds_viewed':
			result = Math.floor(agg.value/60); // actually returns minutes
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
	
	return formatAgg;
}]);

analyticsFilters.filter('time', [function() {
	var time = function time(val) {
		return formatTime(val, false, true);
	}; 
	
	return time;
}]);

analyticsFilters.filter('minutes', [function() {
	var minutes = function minutes(val) {
		return Math.floor(val/60);
	}; 
	
	return minutes;
}]);

analyticsFilters.filter('percents', [function() {
	// val is expected to be 0-1, return value has 2 digits after dec. (65.44)
	var percents = function percents(val) {
		return Math.floor(val * 10000) / 100;
	}; 
	
	return percents;
}]);
