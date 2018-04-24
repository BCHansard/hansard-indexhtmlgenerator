'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
TODOS:
Cookies.
T + B text.
same delays on all ctx menus.

*/

window.tk = toolkit.create({ debug: true });
var storage = window.localStorage || { getItem: function getItem() {}, setItem: function setItem() {} };

var templates = {
	xref: function xref(item) {
		if (item.target) {
			return tk.template.tag(
				'span',
				null,
				tk.template.tag(
					'a',
					{ href: '#' + item.target },
					item.label
				),
				function () {
					return item.relation ? tk.template.tag(
						'em',
						null,
						' ',
						item.relation
					) : '';
				},
				function () {
					return item.related ? tk.template.tag(
						'span',
						null,
						' ',
						templates.xref(item.related)
					) : '';
				}
			);
		}
		return tk.template.tag(
			'em',
			null,
			item.label
		);
	},
	xrefs: function xrefs(xref) {
		return tk.template.tag(
			'div',
			{ 'class': 'x-ref' },
			tk.template.tag(
				'em',
				null,
				xref.prefix
			),
			tk.comp(xref.content, function (item) {
				return tk.template.tag(
					'span',
					{ 'class': 'item' },
					' ',
					templates.xref(item)
				);
			})
		);
	},
	locator: function locator(_locator) {
		return tk.template.tag(
			'a',
			{ 'class': 'locator', href: _locator.url, 'data-string': _locator.datestring },
			_locator.target
		);
	},
	level: function level(_level) {
		if (_level.filtered) {
			return;
		}
		return tk.template.tag(
			'div',
			{ 'class': "level level-" + _level.level + (_level.respondents ? ' respondents' : '') + (_level.level > 1 || controller.expandAll || controller.expanded.hasOwnProperty(_level.id) || controller.searchExpanded.hasOwnProperty(_level.id) ? '' : ' closed') + (controller.pinMap.hasOwnProperty(_level.id) ? ' pinned' : ''),
				id: _level.id },
			tk.template.tag(
				'div',
				{ 'class': "title " + _level.heading_type },
				function () {
					if (controller.re != null) {
						var list = [],
						    i = 0;
						_level.heading.replace(controller.re, function (m, m1, m2) {
							list.push(m1);
							var highlight = tk.template.tag(
								'span',
								{ 'class': 'search-highlight' },
								m2
							);
							controller.searchHits.push(highlight);
							list.push(highlight);
							i += m.length;
						});
						list.push(_level.heading.substring(i));
						return list;
					}
					return _level.heading;
				},
				tk.template.tag('i', { 'class': 'fa fa-link icon link', title: 'Create link' }),
				tk.template.tag('i', { 'class': 'fa fa-thumbtack icon pin', title: 'Pin' })
			),
			function () {
				if (_level.content.length > 0 && _level.level == 1) {
					return tk.template.tag(
						'span',
						{ 'class': 'right' },
						tk.template.tag(
							'div',
							{ 'class': 'info' },
							'(',
							_level.content.length + ' ' + (_level.content.length == 1 ? 'entry' : 'entries'),
							')'
						),
						tk.template.tag('i', { 'class': 'fa fa-chevron-up closer' })
					);
				}
			},
			function () {
				if (_level.xrefs.length) {
					return tk.template.tag(
						'div',
						{ 'class': 'x-refs' },
						tk.comp(_level.xrefs, templates.xrefs)
					);
				}
			},
			function () {
				if (_level.content.length) {
					return tk.template.tag(
						'div',
						{ 'class': 'content' },
						tk.comp(_level.content, templates.level)
					);
				}
			},
			function () {
				if (_level.locators.length) {
					return tk.template.tag(
						'div',
						{ 'class': 'locators' },
						tk.template.tag('i', { 'class': 'fa fa-chevron-circle-right icon' }),
						tk.comp(_level.locators, templates.locator)
					);
				}
			}
		);
	},
	letter: function letter(_letter) {
		if (_letter.filtered) {
			return;
		}
		return tk.template.tag(
			'div',
			{ 'class': 'letter', 'data-letter': _letter.letter },
			tk.template.tag(
				'h1',
				null,
				_letter.letter
			),
			tk.template.tag(
				'div',
				{ 'class': 'content' },
				tk.comp(_letter.content, function (l1) {
					if (!l1.filter) {
						return templates.level(l1);
					}
				})
			)
		);
	},
	content: function content(letters) {
		return tk.template.tag(
			'article',
			{ 'class': 'content' },
			tk.comp(letters, templates.letter)
		);
	},
	root: function root(letters) {
		return tk.template.tag(
			'div',
			{ 'class': 'index' },
			tk.template.tag(
				'header',
				{ 'class': 'nav-header', title: 'Navigation' },
				tk.template.tag('i', { 'class': 'fa fa-compass icon', title: 'Navigation' }),
				tk.template.tag(
					'div',
					{ 'class': 'content' },
					tk.comp(letters, function (letter) {
						return tk.template.tag(
							'div',
							{ 'class': 'letter' },
							letter.letter
						);
					})
				)
			),
			tk.template.tag(
				'header',
				{ 'class': 'search-header', title: 'Search' },
				tk.template.tag('div', { 'class': 'insider back' }),
				tk.template.tag('i', { 'class': 'fa fa-search icon', title: 'Search' }),
				tk.template.tag(
					'div',
					{ 'class': 'content' },
					tk.template.tag('i', { 'class': 'fa fa-times clear' }),
					tk.template.tag('input', { name: 'term', type: 'text', placeholder: 'Enter a term to search...' })
				),
				tk.template.tag('div', { 'class': 'insider front' })
			),
			tk.template.tag(
				'header',
				{ 'class': 'pinned-header empty', title: 'Pins' },
				tk.template.tag('i', { 'class': 'fa fa-thumbtack icon' }),
				tk.template.tag(
					'div',
					{ 'class': 'content' },
					tk.template.tag(
						'div',
						{ 'class': 'help' },
						tk.template.tag(
							'h4',
							null,
							'You haven\'t pinned anything yet'
						),
						tk.template.tag(
							'p',
							null,
							'When you do, it will show up here.'
						)
					),
					tk.template.tag('div', { 'class': 'list' })
				)
			),
			tk.template.tag(
				'header',
				{ 'class': 'expand-header', title: 'Hide/Show All' },
				tk.template.tag('i', { 'class': 'fa fa-eye icon' }),
				tk.template.tag('div', { 'class': 'content' })
			),
			tk.template.tag(
				'header',
				{ 'class': 'btt-header', title: 'Back to Top' },
				tk.template.tag('i', { 'class': 'fa fa-arrow-up icon' }),
				tk.template.tag('div', { 'class': 'content' })
			),
			tk.template.tag(
				'div',
				{ 'class': 'page-header' },
				tk.template.tag('img', { 'class': 'brand', src: 'brand.svg' })
			)
		);
	},
	pinnedItem: function pinnedItem(item) {
		return tk.template.tag(
			'div',
			{ 'class': 'item' },
			tk.template.tag(
				'a',
				{ href: '#' + item.id },
				function () {
					var nodes = [];
					tk.iter(item.titles, function (title, k) {
						nodes.push(tk.template.tag(
							'div',
							{ 'class': 'part' },
							title
						));
						if (k != item.titles.length - 1) {
							nodes.push(tk.template.tag('i', { 'class': 'fa fa-chevron-right breadcrumb' }));
						}
					});
					return nodes;
				}
			)
		);
	},
	searchTools: function searchTools(resultsCount) {
		return tk.template.tag(
			'div',
			{ 'class': 'search-tools' },
			function () {
				if (resultsCount > 0) {
					return tk.template.tag(
						'aside',
						null,
						tk.template.tag('span', { 'class': 'results-i' }),
						tk.template.tag(
							'span',
							null,
							' of '
						),
						tk.template.tag(
							'span',
							{ 'class': 'results-count' },
							resultsCount
						),
						tk.template.tag(
							'div',
							{ 'class': 'prev' },
							tk.template.tag('i', { 'class': 'fa fa-chevron-up' })
						),
						tk.template.tag(
							'div',
							{ 'class': 'next' },
							tk.template.tag('i', { 'class': 'fa fa-chevron-down' })
						)
					);
				} else {
					return tk.template.tag(
						'aside',
						null,
						tk.template.tag(
							'span',
							null,
							'No Results'
						)
					);
				}
			}
		);
	}
};

var IndexController = function () {
	function IndexController(data) {
		var _this = this;

		_classCallCheck(this, IndexController);

		this.IeNjoYJAvAScrIpT = false;

		//	Attach DOM initialization callback.
		tk.init(function () {
			_this.initDOM();
		});

		this.data = data;
		this.template = tk.template(templates.content).data(this.data);

		this.contentNoFilter = null;
		this.re = null;
		this.currentSearchTimeout = null;
		this.scrollLock = null;

		this.highWater = 60;
		this.storageKey = 'lhis_' + indexID;

		this.expandAll = false;

		this.pinned = [];
		this.pinMap = {};
		this.expanded = {};

		this.searchExpanded = {};
		this.searchHits = [];
		this.searchI = 0;

		this.loadedState = null;
	}

	_createClass(IndexController, [{
		key: 'scrollTo',
		value: function scrollTo(target) {
			window.scrollTo(0, target.offset().y - this.highWater);
			target.children('.title, h1').first().classify('search-highlight', true, 2000);
		}
	}, {
		key: 'saveState',
		value: function saveState() {
			var state = {
				pinned: this.pinned,
				expanded: this.expanded,
				search: tk('[name="term"]').value(),
				searchI: this.searchI,
				lockedHeaders: tk('header').comp(function (el) {
					return el.is('.lock');
				})
			};
			storage.setItem(this.storageKey, JSON.stringify(state));
		}
	}, {
		key: 'loadState',
		value: function loadState() {
			var state = storage.getItem(this.storageKey);
			if (state) {
				this.loadedState = state = JSON.parse(state);
				this.pinned = state.pinned;
				this.expanded = state.expanded;
				tk('header').iter(function (el, i) {
					el.classify('lock', state.lockedHeaders[i]);
				});
			}
		}

		//	Initialization.

	}, {
		key: 'initDOM',
		value: function initDOM() {
			var _this2 = this;

			tk('body').append(tk.template(templates.root).data(this.data).render());
			tk(window).on('beforeunload', function () {
				_this2.saveState();
			});

			tk('.nav-header .letter').on('click', function (el) {
				_this2.scrollTo(tk('[data-letter="' + el.text() + '"]'));
			});

			this.loadState();
			this.render();

			var onSearch = function onSearch(el) {
				if (_this2.currentSearchTimeout != null) {
					clearTimeout(_this2.currentSearchTimeout);
					_this2.currentSearchTimeout = null;
				}
				_this2.currentSearchTimeout = tk.timeout(200, function () {
					_this2.filter(el.value());
					_this2.currentSearchTimeout = null;
				});
				if (el.first(false) !== document.activeElement) {
					tk('.search-header').classify('lock', !!el.value());
				}
			};

			var searchEl = tk('[name="term"]').on({
				keyup: onSearch,
				focus: function focus(el) {
					el.parents('header').classify('lock');
				},
				focusout: function focusout(el) {
					if (!el.value()) {
						el.parents('header').classify('lock', false);
					}
				}
			});
			if (this.loadedState) {
				searchEl.value(this.loadedState.search);
			}

			tk('.search-header .clear').on('click', function () {
				var field = tk('[name="term"]');
				field.value('');
				onSearch(field);
			});

			var closeNavTimeout = null;
			tk('.nav-header').on({
				mouseover: function mouseover(el) {
					if (closeNavTimeout != null) {
						clearTimeout(closeNavTimeout);
						closeNavTimeout = null;
					}
					el.classify('open');
				},
				mouseleave: function mouseleave(el) {
					var closeNavTimeout = tk.timeout(750, function () {
						el.classify('open', false);
						closeNavTimeout = null;
					});
				}
			});

			tk('header .icon').on('click', function (el) {
				el.parents('header').classify('lock', 'toggle');
			});

			tk('.btt-header .icon').on('click', function (el) {
				window.scrollTo(0, 0);
				tk.timeout(500, function () {
					el.parents('header').classify('lock', false);
				});
			});

			tk('.expand-header .icon').on('click', function () {
				_this2.expandAll = !_this2.expandAll;
				if (_this2.expandAll) {
					tk('.level-1').classify('closed', false);
				} else {
					tk('.level-1').classify('closed', function (el) {
						//	todo isExpanded
						var id = el.attr('id');
						return !(_this2.expanded.hasOwnProperty(id) || _this2.searchExpanded.hasOwnProperty(id));
					});
				}
			});

			tk(window).on({
				scroll: function scroll() {
					_this2.updateNav();
				},
				hashchange: function hashchange() {
					_this2.scrollTo(tk('[id="' + window.location.hash.substring(1) + '"]'));
				}
			});

			tk.timeout(500, function () {
				if (window.location.hash.length > 0) {
					//	You can't simplify this because ID selectors can't start with numbers.
					var initTarget = tk('[id="' + window.location.hash.substring(1) + '"]');
					if (!initTarget.empty) {
						_this2.scrollTo(initTarget);
					}
				}
			});

			if (this.loadedState) {
				this.filter(this.loadedState.search, this.loadedState.searchI);
			}

			tk.listener(this.pinned).added(function (item) {
				var rendered = tk.template(templates.pinnedItem).data(item).render().children('a').on('click', function (el, event) {
					event.preventDefault();
					tk('[name="term"]').value('');
					//this.filter('');
					_this2.scrollTo(tk('[id="' + el.attr('href').substring(1) + '"]'));
				}).back();
				_this2.pinMap[item.id] = true;
				tk('.pinned-header .list').append(rendered);
				tk('.pinned-header').classify('empty', false);
			});
		}
	}, {
		key: 'updateNav',
		value: function updateNav() {
			var _this3 = this;

			if (this.scrollLock) {
				return;
			}
			this.scrollLock = true;

			var y = window.pageYOffset + this.highWater;
			var cur = null;
			tk('.content .letter').iter(function (el) {
				if (el.offset().y > y) {
					return false;
				} else {
					cur = el.attr('data-letter');
				}
			});

			tk('.nav-header .letter').classify({
				current: false,
				show: false
			}).iter(function (el) {
				if (el.text() != cur) {
					return;
				}

				el.classify({
					current: true,
					show: true
				});
				var prev = el.prev(),
				    next = el.next();
				if (!prev.empty) {
					prev.classify('show');
				}
				if (!next.empty) {
					next.classify('show');
				}
				return false;
			});

			tk.timeout(500, function () {
				return _this3.scrollLock = false;
			});
		}
	}, {
		key: 'searchTools',
		value: function searchTools() {
			var _this4 = this;

			this.searchI = 0;

			var toolsEl = tk.template(templates.searchTools).data(this.searchHits.length).render();

			var toNext = function toNext(el) {
				if (el.is('.disabled')) {
					return;
				}
				var match = tk(_this4.searchHits[++_this4.searchI].result);
				tk('.search-tools .results-i').text(_this4.searchI + 1 + '');
				window.scrollTo(0, match.offset().y - _this4.highWater);
				tk('.search-highlight.current').classify('current', false);
				match.classify('current');

				tk('.search-tools .next').classify('disabled', _this4.searchI == _this4.searchHits.length - 1);
				tk('.search-tools .prev').classify('disabled', _this4.searchI == 0);
			};
			var toPrev = function toPrev(el) {
				if (el.is('.disabled')) {
					return;
				}
				var match = tk(_this4.searchHits[--_this4.searchI].result);
				tk('.search-tools .results-i').text(_this4.searchI + 1 + '');
				window.scrollTo(0, match.offset().y - _this4.highWater);
				tk('.search-highlight.current').classify('current', false);
				match.classify('current');

				tk('.search-tools .next').classify('disabled', _this4.searchI == _this4.searchHits.length - 1);
				tk('.search-tools .prev').classify('disabled', _this4.searchI == 0);
			};

			toolsEl.children('.next').on('click', toNext);
			toolsEl.children('.prev').on('click', toPrev);

			tk('.search-header').children('.search-tools').remove().back().prepend(toolsEl);

			toNext(toolsEl.children('.next'));
		}

		//	Realize a filter on term.

	}, {
		key: 'filter',
		value: function filter(term) {
			var _this5 = this;

			var i = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			this.searchExpanded = {};
			this.searchHits = [];
			this.searchI = i;
			tk('.search-header .search-tools').remove();

			if (term) {
				this.re = new RegExp('(.*?)(' + term + ')', 'gi');
				this.time('Filter', function () {
					return _this5._filter(_this5.data);
				});
				this.render(this.data);

				this.searchTools();
			} else {
				this.re = null;
				this._filter(this.data);
				this.place(this.contentNoFilter);
			}
		}

		//	Perform filtering logic.
		//
		//	Returns true if anything matched below.

	}, {
		key: '_filter',
		value: function _filter(item) {
			var _this6 = this;

			var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			var found = false;
			if (item instanceof Array) {
				tk.iter(item, function (subitem) {
					if (_this6._filter(subitem, force)) {
						found = true;
					}
				});
			} else if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) == 'object') {
				found = item.level && this.re && this.re.test(item.heading);
				force = force || found;
				if (item.content && this._filter(item.content, force)) {
					found = true;
				}
				if (item.letter || item.level) {
					item.filtered = !(force || found);
				}
			}
			if (found) {
				this.searchExpanded[item.id] = true;
			}
			return found;
		}
	}, {
		key: 'time',
		value: function time(name, op) {
			var start = tk.time();
			var rv = op();
			var time = tk.time() - start;
			var str = name + ' in ' + time + 'ms';

			if (time > 200) {
				console.warn(str);
			} else {
				console.log(str);
			}
			return rv;
		}

		//	Render with filtering.

	}, {
		key: 'render',
		value: function render() {
			var _this7 = this;

			var content = this.time('Render', function () {
				return _this7.template.render();
			});

			this.place(content);
			if (!this.contentNoFilter) {
				this.contentNoFilter = content;
			}
			this.time('Binding', function () {
				tk('a:not(.locator)').off('click').on('click', function (el, event) {
					event.preventDefault();
					_this7.scrollTo(tk('[id="' + el.attr('href').substring(1) + '"]'));
				});

				tk('a.locator').off('click').on(function () {
					var tooltip = null;
					return {
						mouseover: function mouseover(el, event) {
							var pos = el.offset();
							tooltip = tk.tag('div', { class: 'tooltip' }).html(decodeURIComponent(el.attr('data-string'))).css({
								top: pos.y,
								left: pos.x
							});
							tk('.index').append(tooltip);
						},
						mouseleave: function mouseleave(el, event) {
							if (tooltip) {
								tooltip.remove();
								tooltip = null;
							}
						}
					};
				}());

				tk('.level-1 > .title').off('click').on('click', function (el) {
					var level = el.parents('.level').first(),
					    state = level.is('.closed'),
					    id = level.attr('id');
					level.classify('closed', 'toggle');
					if (state) {
						_this7.expanded[id] = true;
					} else {
						delete _this7.expanded[id];
					}
				});

				tk('.pin').off('click').on('click', function (el, event) {
					tk('.pinned-header').classify('flash', true, 1000);
					var titles = el.parents('.level').reversed().comp(function (lel) {
						return lel.children('.title').text();
					});
					el.parents('.level').first().classify('pinned');
					_this7.pinned.push({
						titles: titles,
						id: el.parents('[id]').attr('id')
					});
					event.stopPropagation();
				});

				tk('.link').off('click').on('click', function (el) {
					window.location.hash = el.parents('[id]').attr('id');
				});
			});
		}

		//	Place the content.

	}, {
		key: 'place',
		value: function place(el) {
			tk('article.content').remove();
			tk('.index').append(el);
		}
	}]);

	return IndexController;
}();

/*
class Header {
	constructor(template){
		this.template = template;
	}

	create(){
		let rendered = tk.template(this.template).render();
		rendered.on({
			mouseover: (el) => { el.classify('open'); },
			mouseleave: (el) => { el.classify('open', false); }
		});
		this.bindings(rendered);
		return rendered;
	}

	bindings(el){}
}

class SearchHeader {
	constructor() {
		super(() => 
			<header class="search" title="Search">
				<div class="insider back"></div>
				<i class="fa fa-search icon" title="Search"></i>
				<div class="content">
					<i class="fa fa-times clear"></i>
					<input name="term" type="text" placeholder="Enter a term..."/>
				</div>
				<div class="insider front"></div>
			</header>
		);
	}

	bindings(el) {
		
	}
}
*/

var createController = function createController() {
	var controller = new IndexController(data);
};
var waitHook = setInterval(function () {
	if (data) {
		createController();
		clearInterval(waitHook);
	}
}, 250);
