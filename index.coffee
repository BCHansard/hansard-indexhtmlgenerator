window.tk = toolkit.create
	debug: true

templates = 
	xref: (xref) ->
		<div class="x-ref">
			<em>{ xref.prefix }</em>
			<ul>
				{ <li><a href={ '#' + item.target }>{ item.label }</a></li> for item in xref.content }
			</ul>
		</div>
	locator: (locator) ->
		<span class="locator">{ locator.target }</span>
	level: (level) ->
		<div class={ "level level-" + level.level } id={ level.id }>
			<div class={ "title " + level.heading_type }>{ level.heading }</div>
			{ if level.content.length > 0 and level.level == 1 then <div class="info">{ level.content.length + ' ' + (if level.content.length == 1 then 'entry' else 'entries') }</div> }
			{
				if level.xrefs.length
					<div class="x-refs">
						{ templates.xref xref for xref in level.xrefs }
					</div>
			}
			{
				if level.content.length
					<div class="content">
						{ templates.level nextLevel for nextLevel in level.content }
					</div>
			}
			{
				if level.locators.length
					<div class="locators">
						{ templates.locator locator for locator in level.locators }
					</div>
			}
		</div>
	letter: (letter) ->
		<div class="letter">
			<h1>{ letter.letter }</h1>
			<div class="content">
				{
					templates.level l1 for l1 in letter.content when not l1.filter
				}
			</div>
		</div>

tk.init () ->
	start = tk.time()
	el = tk.template templates.letter
		.source data
		.render()

	tk.log 'Rendered in ' + (tk.time() - start) + 'ms'

	tk 'body' 
		.append tk.tag 'div',
			class: 'index'
		.append tk.tag 'img',
			class: 'brand'
			src: 'brand.svg'
		.back()
		.append el
	