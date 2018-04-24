/*
TODOS:
Cookies.
T + B text.
same delays on all ctx menus.

*/

window.tk = toolkit.create({debug: true});
let storage = window.localStorage || {getItem: () => {}, setItem: () => {}};

let templates = {
	xref: (item) => {
		if (item.target){
			return <span>
				<a href={ '#' + item.target }>{ item.label }</a>
				{ () => item.relation ? <em> { item.relation }</em> : '' }
				{ () => item.related ? <span> { templates.xref(item.related) }</span> : '' }
			</span>
		}
		return <em>{ item.label }</em>
	},
	xrefs: (xref) =>
		<div class="x-ref">
			<em>{ xref.prefix }</em>
			{ tk.comp(xref.content, (item) =>
				<span class="item"> { templates.xref(item) }</span>
			)}
		</div>,
	locator: (locator) =>
		<a class="locator" href={ locator.url } data-string={ locator.datestring }>{ locator.target }</a>,
	level: (level) => {
		if (level.filtered){
			return;
		}
		return <div class={ 
				"level level-" + level.level 
				+ (level.respondents ? ' respondents' : '')  
				+ ((
					level.level > 1 || 
					controller.expandAll || 
					controller.expanded.hasOwnProperty(level.id) ||
					controller.searchExpanded.hasOwnProperty(level.id)) ? '' : ' closed')
				+ (controller.pinMap.hasOwnProperty(level.id) ? ' pinned' : '')} 
		id={ level.id }>
			<div class={ "title " + level.heading_type }>{ () => {
				if (controller.re != null){
					let list = [], i = 0;
					level.heading.replace(controller.re, (m, m1, m2) => {
						list.push(m1);
						let highlight = <span class="search-highlight">{ m2 }</span>;
						controller.searchHits.push(highlight);
						list.push(highlight);
						i += m.length;
					});
					list.push(level.heading.substring(i));
					return list;
				}
				return level.heading;
			}}
				<i class="fa fa-link icon link" title="Create link"></i>
				<i class="fa fa-thumbtack icon pin" title="Pin"></i>
			</div>
			{ () => {
				if (level.content.length > 0 && level.level == 1){
					return <span class="right"> 
						<div class="info">({ level.content.length + ' ' + (level.content.length == 1 ? 'entry' : 'entries') })</div>
						<i class="fa fa-chevron-up closer"></i>
					</span>
				}
			}}
			{ () => {
				if (level.xrefs.length) {
					return <div class="x-refs">
						{ tk.comp(level.xrefs, templates.xrefs) }
					</div>
				}
			}}
			{ () => {
				if (level.content.length) {
					return <div class="content">
						{ tk.comp(level.content, templates.level) }
					</div>
				}
			}}
			{ () => {
				if (level.locators.length) {
					return <div class="locators">
						<i class="fa fa-chevron-circle-right icon"></i>
						{ tk.comp(level.locators, templates.locator) }
					</div>
				}
			}}
		</div>
	},
	letter: (letter) => {
		if (letter.filtered){
			return;
		}
		return <div class="letter" data-letter={ letter.letter }>
			<h1>{ letter.letter }</h1>
			<div class="content">
				{ tk.comp(letter.content, (l1) => {
					if (!l1.filter) {
						return templates.level(l1);
					}
				})}
			</div>
		</div>
	},
	content: (letters) =>
		<article class="content">
			{ tk.comp(letters, templates.letter) }
		</article>,
	root: (letters) =>
		<div class="index">
			<header class="nav-header" title="Navigation">
				<i class="fa fa-compass icon" title="Navigation"></i>
				<div class="content">
					{ tk.comp(letters, (letter) => <div class="letter">{ letter.letter }</div>) }
				</div>
			</header>
			<header class="search-header" title="Search">
				<div class="insider back"></div>
				<i class="fa fa-search icon" title="Search"></i>
				<div class="content">
					<i class="fa fa-times clear"></i>
					<input name="term" type="text" placeholder="Enter a term to search..."/>
				</div>
				<div class="insider front"></div>
			</header>
			<header class="pinned-header empty" title="Pins">
				<i class="fa fa-thumbtack icon"></i>
				<div class="content">
					<div class="help">
						<h4>You haven't pinned anything yet</h4>
						<p>When you do, it will show up here.</p>
					</div>
					<div class="list"></div>
				</div>
			</header>
			<header class="expand-header" title="Hide/Show All">
				<i class="fa fa-eye icon"></i>
				<div class="content"></div>
			</header>
			<header class="btt-header" title="Back to Top">
				<i class="fa fa-arrow-up icon"></i>
				<div class="content"></div>
			</header>
			<div class="page-header">
				<img class="brand" src="brand.svg"/>
			</div>
		</div>,
	pinnedItem: (item) =>
		<div class="item">
			<a href={ '#' + item.id }>{ () => {
				let nodes = [];
				tk.iter(item.titles, (title, k) => {
					nodes.push(<div class="part">{ title }</div>);
					if (k != item.titles.length - 1) {
						nodes.push(<i class="fa fa-chevron-right breadcrumb"></i>);
					}
				});
				return nodes;
			}}</a>
		</div>,
	searchTools: (resultsCount) =>
		<div class="search-tools">
			{ () => {
				if (resultsCount > 0) {
					return <aside>
						<span class="results-i"></span><span> of </span><span class="results-count">{ resultsCount }</span> 
						<div class="prev">
							<i class="fa fa-chevron-up"></i>
						</div>
						<div class="next">
							<i class="fa fa-chevron-down"></i>
						</div>
					</aside>
				}
				else {
					return <aside><span>No Results</span></aside>
				}
			}}
		</div>
}

class IndexController {
	constructor(data) {
		this.IeNjoYJAvAScrIpT = false;
		
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

		//	Attach DOM initialization callback.
		tk.init(() => {
			this.initDOM();
		});

	}

	scrollTo(target) {
		window.scrollTo(0, target.offset().y - this.highWater);
		target.children('.title, h1').first()
			.classify('search-highlight', true, 2000);
	}

	saveState() {
		let state = {
			pinned: this.pinned,
			expanded: this.expanded,
			search: tk('[name="term"]').value(),
			searchI: this.searchI,
			lockedHeaders: tk('header').comp((el) => el.is('.lock'))
		}
		storage.setItem(this.storageKey, JSON.stringify(state));
	}

	loadState() {
		let state = storage.getItem(this.storageKey);
		if (state) {
			this.loadedState = state = JSON.parse(state);
			this.pinned = state.pinned;
			this.expanded = state.expanded;
			tk('header').iter((el, i) => {
				el.classify('lock', state.lockedHeaders[i]);
			});
		}
	}

	//	Initialization.
	initDOM() {
		tk('body').append(
			tk.template(templates.root).data(this.data).render()
		);
		tk(window).on('beforeunload', () => {
			this.saveState();
		});

		tk('.nav-header .letter').on('click', (el) => {
			this.scrollTo(tk('[data-letter="' + el.text() + '"]'));
		});
		
		this.loadState();
		this.render();

		let onSearch = (el) => {
			if (this.currentSearchTimeout != null){
				clearTimeout(this.currentSearchTimeout);
				this.currentSearchTimeout = null;
			}
			this.currentSearchTimeout = tk.timeout(200, () => {
				this.filter(el.value());
				this.currentSearchTimeout = null;
			});
			if (el.first(false) !== document.activeElement){
				tk('.search-header').classify('lock', !!el.value());
			}
		}
		
		let searchEl = tk('[name="term"]').on({
			keyup: onSearch,
			focus: (el) => {
				el.parents('header').classify('lock');
			},
			focusout: (el) => {
				if (!el.value()){
					el.parents('header').classify('lock', false);
				}
			}
		});
		if (this.loadedState){
			searchEl.value(this.loadedState.search)
		}

		tk('.search-header .clear').on('click', () => {
			let field = tk('[name="term"]');
			field.value('');
			onSearch(field);
		});

		let closeNavTimeout = null;
		tk('.nav-header').on({
			mouseover: (el) => {
				if (closeNavTimeout != null){
					clearTimeout(closeNavTimeout);
					closeNavTimeout = null;
				}
				el.classify('open');
			},
			mouseleave: (el) => {
				let closeNavTimeout = tk.timeout(750, () => {
					el.classify('open', false);
					closeNavTimeout = null;
				});
			}
		});

		tk('header .icon').on('click', (el) => {
			el.parents('header').classify('lock', 'toggle');
		});

		tk('.btt-header .icon').on('click', (el) => {
			window.scrollTo(0, 0);
			tk.timeout(500, () => {
				el.parents('header').classify('lock', false);
			});
		});

		tk('.expand-header .icon').on('click', () => {
			this.expandAll = !this.expandAll;
			if (this.expandAll){
				tk('.level-1').classify('closed', false);
			}
			else {
				tk('.level-1').classify('closed', (el) => {
					//	todo isExpanded
					let id = el.attr('id');
					return !(this.expanded.hasOwnProperty(id) || this.searchExpanded.hasOwnProperty(id));
				});
			}
		});

		tk(window).on({
			scroll: () => { this.updateNav(); },
			hashchange: () => { 
				this.scrollTo(tk('[id="' + window.location.hash.substring(1) + '"]'))
			}
		});

		tk.timeout(500, () => {
			if (window.location.hash.length > 0){
				//	You can't simplify this because ID selectors can't start with numbers.
				let initTarget = tk('[id="' + window.location.hash.substring(1) + '"]');
				if (!initTarget.empty){
					this.scrollTo(initTarget);
				}
			}
		});

		if (this.loadedState){
			this.filter(this.loadedState.search, this.loadedState.searchI);
		}

		tk.listener(this.pinned)
			.added((item) => {
				let rendered = tk.template(templates.pinnedItem)
					.data(item)
					.render()
						.children('a')
						.on('click', (el, event) => {
							event.preventDefault();
							tk('[name="term"]').value('');
							//this.filter('');
							this.scrollTo(tk('[id="' + el.attr('href').substring(1) + '"]'));
						})
					.back();
				this.pinMap[item.id] = true;
				tk('.pinned-header .list').append(rendered);
				tk('.pinned-header').classify('empty', false);
			});
	}

	updateNav() {
		if (this.scrollLock){
			return;
		}
		this.scrollLock = true;

		let y = window.pageYOffset + this.highWater;
		let cur = null;
		tk('.content .letter').iter((el) => {
			if (el.offset().y > y){
				return false;
			}
			else {
				cur = el.attr('data-letter');
			}
		});
			
		tk('.nav-header .letter')
			.classify({
				current: false,
				show: false
			})
			.iter(el => {
				if (el.text() != cur){
					return;
				}
				
				el.classify({
					current: true,
					show: true
				});
				let prev = el.prev(), next = el.next();
				if (!prev.empty){
					prev.classify('show');
				}
				if (!next.empty){
					next.classify('show');
				}
				return false;
			});

		tk.timeout(500, () => this.scrollLock = false);
	}

	searchTools() {
		this.searchI = 0;

		let toolsEl = tk.template(templates.searchTools)
			.data(this.searchHits.length)
			.render();
		
		let toNext = (el) => {
			if (el.is('.disabled')){
				return;
			}
			let match = tk(this.searchHits[++this.searchI].result);
			tk('.search-tools .results-i').text((this.searchI + 1) + '');
			window.scrollTo(0, match.offset().y - this.highWater);
			tk('.search-highlight.current').classify('current', false);
			match.classify('current');

			tk('.search-tools .next').classify('disabled', this.searchI == this.searchHits.length - 1);
			tk('.search-tools .prev').classify('disabled', this.searchI == 0);
		}
		let toPrev = (el) => {
			if (el.is('.disabled')){
				return;
			}
			let match = tk(this.searchHits[--this.searchI].result);
			tk('.search-tools .results-i').text((this.searchI + 1) + '');
			window.scrollTo(0, match.offset().y - this.highWater);
			tk('.search-highlight.current').classify('current', false);
			match.classify('current');

			tk('.search-tools .next').classify('disabled', this.searchI == this.searchHits.length - 1);
			tk('.search-tools .prev').classify('disabled', this.searchI == 0);
		}

		toolsEl.children('.next').on('click', toNext);
		toolsEl.children('.prev').on('click', toPrev);

		tk('.search-header')
			.children('.search-tools').remove()
			.back().prepend(toolsEl);

		toNext(toolsEl.children('.next'));
	}

	//	Realize a filter on term.
	filter(term, i=0) {
		this.searchExpanded = {};
		this.searchHits = [];
		this.searchI = i;
		tk('.search-header .search-tools').remove();

		if (term) {
			this.re = new RegExp('(.*?)(' + term + ')', 'gi');
			this.time('Filter', () => this._filter(this.data));
			this.render(this.data);

			this.searchTools();
		}
		else {
			this.re = null;
			this._filter(this.data);
			this.place(this.contentNoFilter);
		}
	}

	//	Perform filtering logic.
	//
	//	Returns true if anything matched below.
	_filter(item, force=false) {
		let found = false;
		if (item instanceof Array) {
			tk.iter(item, (subitem) => {
				if (this._filter(subitem, force)){
					found = true;
				}
			});
		}
		else if (typeof item == 'object') {
			found = item.level && this.re && (this.re.test(item.heading));
			force = force || found;
			if (item.content && this._filter(item.content, force)){
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

	time(name, op) {
		let start = tk.time();
		let rv = op();
		let time = tk.time() - start;
		let str = name + ' in ' + time + 'ms';
		
		if (time > 200){
			console.warn(str);
		}
		else {
			console.log(str);
		}
		return rv;
	}

	//	Render with filtering.
	render() {
		let content = this.time('Render', () => this.template.render());

		this.place(content);
		if (!this.contentNoFilter) {
			this.contentNoFilter = content;
		}
		this.time('Binding', () => {
			tk('a:not(.locator)').off('click').on('click', (el, event) => {
				event.preventDefault();
				this.scrollTo(tk('[id="' + el.attr('href').substring(1) + '"]'));
			});

			tk('a.locator').off('click').on((() => {
				let tooltip = null;
				return {
					mouseover: (el, event) => {
						let pos = el.offset();
						tooltip = tk.tag('div', {class: 'tooltip'})
							.html(decodeURIComponent(el.attr('data-string')))
							.css({
								top: pos.y,
								left: pos.x
							});
						tk('.index').append(tooltip);
					},
					mouseleave: (el, event) => {
						if (tooltip) {
							tooltip.remove();
							tooltip = null;
						}
					}
				}
			})());
			
			tk('.level-1 > .title').off('click').on('click', (el) => {
				let level = el.parents('.level').first(),
					state = level.is('.closed'),
					id = level.attr('id');
				level.classify('closed', 'toggle');
				if (state) {
					this.expanded[id] = true;
				}
				else {
					delete this.expanded[id];
				}
			});

			tk('.pin').off('click').on('click', (el, event) => {
				tk('.pinned-header').classify('flash', true, 1000);
				let titles = el.parents('.level').reversed().comp((lel) => {
					return lel.children('.title').text();
				});
				el.parents('.level').first().classify('pinned');
				this.pinned.push({
					titles: titles,
					id: el.parents('[id]').attr('id')
				});
				event.stopPropagation();
			});
			
			tk('.link').off('click').on('click', (el) => {
				window.location.hash = el.parents('[id]').attr('id');
			});
		});
	}

	//	Place the content.
	place(el) {
		tk('article.content').remove();
		tk('.index').append(el);
	}
}

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

let createController = () => {
	let controller = new IndexController(data);
}
let waitHook = setInterval(() => {
	if (data) {
		createController();
		clearInterval(waitHook);
	}
}, 250);
