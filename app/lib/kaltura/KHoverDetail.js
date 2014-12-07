var KHoverDetail = Rickshaw.Class.create(Rickshaw.Graph.HoverDetail, {
				
				initialize: function(args) {

					var graph = this.graph = args.graph;

					this.xFormatter = args.xFormatter || function(x) {
						// https://github.com/mbostock/d3/wiki/Time-Formatting
						return d3.time.format('%a %b %d %Y %X')(new Date(x * 1000));
					};

					this.yFormatter = args.yFormatter || function(y) {
						return y === null ? y : parseInt(y, 10).toFixed(2);
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

					//xLabel.className = 'x_label';
					//xLabel.innerHTML = formattedXValue;
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