'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers'); // get, don't create!!

/**
 * controller for KDP on entry page
 */
analyticsControllers.controller('KPlayerController', ['$scope', '$attrs',  
    function($scope, $attrs) {
		var self = this;
		this.playerElement = null;
  		
  		this.init = function init (element) {
  			self.playerElement = element;
  		};


  		$scope.$watch('playerEntryId', function( value ) {
  			if (value) {
  				if (value != -1) {
		  			kWidget.embed({
		            	"targetId": "kplayer", 
		            	"wid": "_" + $scope.pid, 
		              	"uiconf_id": $scope.uiconfId, 
		              	"entry_id": value, 
		              	"flashvars": { 
		              		"streamerType": "auto" 
		              	} 
		            });
  				} else {
  					self.playerElement.html('<h3>Live Session Was Not Recorded</h3>');
  				}
	  		}
  		});
}]);


/**
 * controller for map on entry page
 */
analyticsControllers.controller('OLMapController', ['$scope', '$attrs',  
    function($scope, $attrs) {
		var self = this;
		this.mapElement = null;
		this.map = null;
		this.citiesLayer = null;
		this.countriesLayer = null;
		
		this.init = function init (element) {
			self.mapElement = element;
			
			// create map
			self.map = new OpenLayers.Map('map');
	
			// create OSM layer
			var osm = new OpenLayers.Layer.OSM();
			
			
			self.map.addLayer(osm);
			self.map.zoomToMaxExtent();
			
			self.map.events.register('zoomend', this, function (event) {
		        var zLevel = self.map.getZoom();     
		        if( zLevel < 5)
		        {
		        	// show countries
		            self.citiesLayer.setVisibility(false);
		            self.countriesLayer.setVisibility(true);
		        }
		        else {
		        	// show cities
		        	self.citiesLayer.setVisibility(true);
		            self.countriesLayer.setVisibility(false);
		        }
		    });
		};
		
		
		this.createStyleMap = function createStyleMap() {
			// style
			var style = new OpenLayers.Style({
				pointRadius: "${radius}",
				fillColor: "#ffcc66",
				fillOpacity: 0.8,
				strokeColor: "#cc6633",
				strokeWidth: 2,
				strokeOpacity: 0.8,
				title : "${tooltip}"
			},
			{
				context: {
					radius: function(feature) {
						return feature.attributes.data / 100;
					},
					tooltip: function(feature) {
						return feature.attributes.text+ " " + feature.attributes.data;
					}
				}
			}
			);
			
			// create a styleMap with a custom default symbolizer
			var styleMap = new OpenLayers.StyleMap({
				"default": style,
				"select": {
					fillColor: "#8aeeef",
					strokeColor: "#32a8a9"
				}
			});
			
			return styleMap;
		};
		
		$scope.$watch('mapData', function( value ) {
			if (value) { // value is array of KalturaGeoTimeLiveStats
				// remove existing layers
				if (self.citiesLayer) {
					self.map.removeLayer(self.citiesLayer);
				}
				if (self.countriesLayer) {
					self.map.removeLayer(self.countriesLayer);
				}
				
				// process data to create new layers
				var countriesData = {};
				var features = new Array();
				var point;
				for ( var i = 0; i < value.length; i++) {
					// accumulate data for country-level layer
					if (!countriesData[value[i].country.name]) { 
						// init - keep whole value for lat/long
						countriesData[value[i].country.name] = value[i];  
					}
					else {
						// sum audience
						countriesData[value[i].country.name]['audience'] += value[i].audience;
					}
					point = new OpenLayers.Geometry.Point(value[i].city.longitude, value[i].city.latitude).transform('EPSG:4326', 'EPSG:3857');
					features[i] = new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : value[i].audience,
								"text" : value[i].city.name
							}
							);
				}
				
				// create cities layer
				var layer = self.citiesLayer = new OpenLayers.Layer.Vector('Cities', {
					"projection": "EPSG:3857",
					"visibility" : false,
					"styleMap" : self.createStyleMap()
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				// create countries layer
				features = new Array();
				for (var key in countriesData) {
					point = new OpenLayers.Geometry.Point(countriesData[key].country.longitude, countriesData[key].country.latitude).transform('EPSG:4326', 'EPSG:3857');
					features.push(new OpenLayers.Feature.Vector(
							point, 
							{
								"data" : countriesData[key].audience,
								"text" : countriesData[key].country.name
							}
							));
				}
				
				// create countries layer
				layer = self.countriesLayer = new OpenLayers.Layer.Vector('Countries', {
					"projection": "EPSG:3857",
					"styleMap" : self.createStyleMap()
				});
				layer.addFeatures(features);
				self.map.addLayer(layer);
				
				layer.refresh();
			}
		});
}]);


/**
 * controller for (rickshaw) graph on entry page
 */
analyticsControllers.controller('RGraphController', ['$scope', '$attrs',  
    function($scope, $attrs) {
		var self = this;
		this.graphElement = null; // HTML element showing the graph
		this.graph = null;	// graph JS object
		this.series = null;
		
		this.init = function init (element) {
			self.graphElement = element;
			var d = new Date();
			self.series = [ 
			    {
					color : 'steelblue',
					data : [ {x:d.getTime(), y:0} ],
					name : "Line 1"
				}
			];

			/**
			 * set graph data as attribute
			 */
			$scope.$watch($attrs.additionalgraphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					self.updateGraphContent(value);
				}
			});
			
			/**
			 * set graph data as attribute
			 */
			$scope.$watch($attrs.graphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					self.resetGraphContent(value);
				}
			});
			

			var graph = self.graph = new Rickshaw.Graph({
				element : element[0].children[0],
				width : element.width(),
				height : element.height() - 20,
				renderer : 'line',
				series : self.series
			});
			graph.render();

			var preview = new Rickshaw.Graph.RangeSlider({
				graph : graph,
				element : element[0].children[1]
			});

			var xAxis = new Rickshaw.Graph.Axis.Time({
				graph : graph,
				ticksTreatment : 'glow',
				timeFixture : new Rickshaw.Fixtures.Time.Local()
			});
			xAxis.render();

			var yAxis = new Rickshaw.Graph.Axis.Y({
				graph : graph,
				tickFormat : Rickshaw.Fixtures.Number.formatKMBT,
				ticksTreatment : 'glow'
			});
			yAxis.render();
			

			var Hover = Rickshaw.Class.create(Rickshaw.Graph.HoverDetail, {
				
				initialize: function(args) {

					var graph = this.graph = args.graph;

					this.xFormatter = args.xFormatter || function(x) {
						return new Date( x * 1000 ).toUTCString();
					};

					this.yFormatter = args.yFormatter || function(y) {
						return y === null ? y : y.toFixed(2);
					};

					var element = this.element = document.createElement('div');
					element.className = 'detail';

					this.visible = true;
					graph.element.appendChild(element);

					this.lastEvent = null;

					this.onShow = args.onShow;
					this.onHide = args.onHide;
					this.onRender = args.onRender;
					this.onClick = args.onClick;

					this.formatter = args.formatter || this.formatter;

					this._addListeners();
				},
				
				render: function(args) {

					var graph = this.graph;
					var points = args.points;
					var point = points.filter( function(p) { return p.active; } ).shift();

					if (point.value.y === null) return;

					var formattedXValue = point.formattedXValue;
					var formattedYValue = point.formattedYValue;

					this.element.innerHTML = '';
					this.element.style.left = graph.x(point.value.x) + 'px';
					this.element.setAttribute("data-time", point.value.x);  // add the x value as data property on detail node

					var xLabel = document.createElement('div');

					xLabel.className = 'x_label';
					xLabel.innerHTML = formattedXValue;
					this.element.appendChild(xLabel);

					var item = document.createElement('div');

					item.className = 'item';

					// invert the scale if this series displays using a scale
					var series = point.series;
					var actualY = series.scale ? series.scale.invert(point.value.y) : point.value.y;

					item.innerHTML = this.formatter(series, point.value.x, actualY, formattedXValue, formattedYValue, point);
					item.style.top = this.graph.y(point.value.y0 + point.value.y) + 'px';

					this.element.appendChild(item);

					var dot = document.createElement('div');

					dot.className = 'dot';
					dot.style.top = item.style.top;
					dot.style.borderColor = series.color;

					this.element.appendChild(dot);

					if (point.active) {
						item.classList.add('active');
						dot.classList.add('active');
					}

					// Assume left alignment until the element has been displayed and
					// bounding box calculations are possible.
					var alignables = [xLabel, item];
					alignables.forEach(function(el) {
						el.classList.add('left');
					});

					this.show();

					// If left-alignment results in any error, try right-alignment.
					var leftAlignError = this._calcLayoutError(alignables);
					if (leftAlignError > 0) {
						alignables.forEach(function(el) {
							el.classList.remove('left');
							el.classList.add('right');
						});

						// If right-alignment is worse than left alignment, switch back.
						var rightAlignError = this._calcLayoutError(alignables);
						if (rightAlignError > leftAlignError) {
							alignables.forEach(function(el) {
								el.classList.remove('right');
								el.classList.add('left');
							});
						}
					}

					if (typeof this.onRender == 'function') {
						this.onRender(args);
					}
				},
				
				_addListeners: function() {

					this.graph.element.addEventListener(
						'mousemove',
						function(e) {
							this.visible = true;
							this.update(e);
						}.bind(this),
						false
					);

					this.graph.onUpdate( function() { this.update(); }.bind(this) );

					this.graph.element.addEventListener(
						'mouseout',
						function(e) {
							if (e.relatedTarget && !(e.relatedTarget.compareDocumentPosition(this.graph.element) & Node.DOCUMENT_POSITION_CONTAINS)) {
								this.hide();
							}
						}.bind(this),
						false
					);
					
					// add click handler if required
					if (typeof this.onClick == 'function') {
						this.graph.element.addEventListener(
								'click',
								function(e) {
									// use data-time to go to correct time in player
									var time = this.element.getAttribute('data-time');
									this.onClick(time);
								}.bind(this),
								false
						);
						
					}
				}
			});

			var hoverDetail = new Hover( {
			    graph: graph,
			    formatter: function(series, x, y, formattedXValue, formattedYValue, point) {
			    	return y + ' views'; 
			    },
				onClick : function (time) {
					alert(time);
				}
			} );
		};
		
		/**
		 * remove all previous data and set new 
		 * @param value
		 */
		this.resetGraphContent = function resetGraphContent(value) {
			var ar = self.series[0].data;
			while (ar.length > 0) {
				ar.pop();
			}
			for ( var i = 0; i < value.length; i++) {
				ar.push(value[i]);
			}
			self.graph.update();
		};
		
		
		/**
		 * add new data and purge oldest so we keep only 36 hrs
		 * @param value
		 */
		this.updateGraphContent = function updateGraphContent(value) {
			var ar = self.series[0].data;
			// find matching point in 'ar'
			var lastX = ar[ar.length-1].x;
			for (var i = value.length-1; i>0; i--) {
				if (value[i].x == lastX) {
					break;
				}
			}
			// now i+1 is the index of the first element in 'value' that needs to be inserted to 'ar'
			// add required elements from value to ar, while removing elements from tail
			i++;
			while(i<value.length) {
				ar.shift();
				ar.push(value[i]);
				i++;
			}
			self.graph.update();
		};
		
		
}]);