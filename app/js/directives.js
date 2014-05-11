'use strict';

/* Directives */

var analyticsDirectives = angular.module('analyticsDirectives', []);


analyticsDirectives.directive('kplayer', function() {
	return {
		restrict : 'E',
		controller: 'KPlayerController',
		replace : true,
		template: '<div id="kplayer" style="width:100%; height:100%;"></div>',
		link: function($scope, element, attrs, KPlayerController) {
			
			KPlayerController.init(element);
		}
	};
});

analyticsDirectives.directive('rgraph', function() {
	return {
		restrict : 'E',
		template : '<div style="width:100%;height:100%;"><div id="graph"></div><div id="preview"></div></div>',
		replace : true,
		link : function(scope, element, attrs) {
			var graph = null;
			var d = new Date();
			var series = [ 
			    {
					color : 'steelblue',
					data : [ {x:d.getTime(), y:0} ],
					name : "Line 1"
				}
			];

			
			/**
			 * remove all previous data and set new 
			 * @param value
			 */
			var resetGraphContent = function resetGraphContent(value) {
				var ar = series[0].data;
				while (ar.length > 0) {
					ar.pop();
				}
				for ( var i = 0; i < value.length; i++) {
					ar.push(value[i]);
				}
				graph.update();
			};
			
			
			/**
			 * add new data and purge oldest so we keep only 36 hrs
			 * @param value
			 */
			var updateGraphContent = function updateGraphContent(value) {
				var ar = series[0].data;
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
				graph.update();
			};

			/**
			 * set graph data as attribute
			 */
			scope.$watch(attrs.additionalgraphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					updateGraphContent(value);
				}
			});
			
			/**
			 * set graph data as attribute
			 */
			scope.$watch(attrs.graphdata, function(value) {
				if (graph != null && Array.isArray(value) && value.length > 0) {
					resetGraphContent(value);
				}
			});
			

			graph = new Rickshaw.Graph({
				element : element[0].children[0],
				width : element.width(),
				height : element.height() - 20,
				renderer : 'line',
				series : series
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
					var point = points.filter( function(p) { return p.active } ).shift();

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

					this.graph.onUpdate( function() { this.update() }.bind(this) );

					this.graph.element.addEventListener(
						'mouseout',
						function(e) {
							if (e.relatedTarget && !(e.relatedTarget.compareDocumentPosition(this.graph.element) & Node.DOCUMENT_POSITION_CONTAINS)) {
								this.hide();
							}
						}.bind(this),
						false
					);
					
					if (typeof this.onClick == 'function') {
						console.log("registering click");
						this.graph.element.addEventListener(
								'click',
								function(e) {
									// use data-time to go to correct time in player
									var time = this.element.getAttribute('data-time');
									console.log("executing onClick ", time);
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

		}
	};
});


analyticsDirectives.directive('olmap', function() {
	return {
		restrict : 'E',
		controller : 'OLMapController',
		template : '<div id="map"></div>',
		replace : true,
		link : function(scope, element, attrs, OLMapController) {
			OLMapController.init(element);
		}
	};
});
