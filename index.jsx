window.tk = toolkit.create({
	debug: true
});

let templates = {
	xref: (xref) =>
		<div class="x-ref">
			<em>{ xref.prefix }</em>
			<ul>
				{ tk.comp(xref.content, (item) =>
					<li><a href={ '#' + item.target }>{ item.label }</a></li> 
				)}
			</ul>
		</div>,
	locator: (locator) =>
		<span class="locator">{ locator.target }</span>,
	level: (level) =>
		<div class={ "level level-" + level.level } id={ level.id }>
			<div class={ "title " + level.heading_type }>{ level.heading }</div>
			{ () => {
				if (level.content.length > 0 && level.level == 1){
					return <div class="info">{ level.content.length + ' ' + (level.content.length == 1 ? 'entry' : 'entries') }</div> 
				}
			}}
			{ () => {
				if (level.xrefs.length) {
					<div class="x-refs">
						{ tk.comp(level.xrefs, templates.xref) }
					</div>
				}
			}}
			{ () => {
				if (level.content.length) {
					<div class="content">
						{ tk.comp(level.content, templates.level) }
					</div>
				}
			}}
			{ () => {
				if (level.locators.length) {
					<div class="locators">
						{ tk.comp(level.locators, templates.locator) }
					</div>
				}
			}}
		</div>,
	letter: (letter) =>
		<div class="letter">
			<h1>{ letter.letter }</h1>
			<div class="content">
				{
					tk.comp(letter.content, (l1) => {
						if (!l1.filter) {
							return templates.level(l1);
						}
					})
				}
			</div>
		</div>
}

tk.init(() => {
	let start = tk.time();
	let content = tk.template(templates.letter)
		.source(data)
		.render()

	tk.log('Rendered content in ' + (tk.time() - start) + 'ms');

	let wrap = tk.template(() => 
		<div class="index">
			<img class="brand" src="brand.svg"/>
		</div>
	);

	tk('body').append(wrap).append(content);
});