/*
    Hansard Index view controller.

    R. Saxifrage.
*/

let tk = toolkit.create({debug: true});

let indexTemplates = {
    xref: (item) => {
        if (!item.target) {
            return <em>{ item.label }</em>
        }
        return <span>
            <a href={ '#' + item.target }>{ item.label }</a>
            { () => item.relation ? <em> { item.relation }</em> : '' }
            { () => item.related ? <span> { templates.xrefItem(item.related) }</span> : '' }
        </span>   
    },
    xrefs: (xrefs) => 
        <div class="x-ref">
            <em>{ xrefs.prefix }</em>
            { tk.comp(xrefs.content, (item) =>
                <span class="item"> { indexTemplates.xref(item) }</span>
            )}
        </div>,
    locator: (locator) =>
        <span class="locator">{ locator.target }</span>,
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
                <i class="fa fa-link icon link" title="Create Link"></i>
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
                        { tk.comp(level.xrefs, indexTemplates.xrefs) }
                    </div>
                }
            }}
            { () => {
                if (level.content.length) {
                    return <div class="content">
                        { tk.comp(level.content, indexTemplates.level) }
                    </div>
                }
            }}
            { () => {
                if (level.locators.length) {
                    return <div class="locators">
                        <i class="fa fa-chevron-circle-right icon"></i>
                        { tk.comp(level.locators, indexTemplates.locator) }
                    </div>
                }
            }}
        </div>
    },
    letter: (letter) => {
        if (letter.filtered){
			return <div class="not-present"></div>
		}
        return <div class="letter" data-letter={ letter.letter }>
			<h1>{ letter.letter }</h1>
			<div class="content">
				{ tk.comp(letter.content, (l1) => {
					if (!l1.filter) {
						return indexTemplates.level(l1);
					}
				})}
			</div>
		</div>
    },
    content: (letters) => {
		return <article class="content">
			{ tk.comp(letters, indexTemplates.letter) }
        </article>
    },
    root: (data) => {
        return <div class="index">
            { () => tk.comp(data.headers, (header) => {
                return tk.template(header.template).render()
            })}
            <div class="page-header">
				<img class="brand" src="../brand.svg"/>
			</div>
		</div>
    }
}

class IndexController {
    constructor(data) {
        tk.init(() => {
            this.initDOM();
        });

        this.data = data;
        this.template = tk.template(templates.content).data(this.data);
        
        this.contentNoFilter = null;
        this.highWater = 60;
    }
}

class Header {
    constructor(template) {
        this.template = template;
    }

    binding(el) {}
}

class NavHeader {
    
}