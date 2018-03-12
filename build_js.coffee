coffee = require 'coffeescript'
babel = require 'babel-core'
fs = require 'fs'

opts =
	presets: 'es2015'
	plugins: [
		[
			'transform-react-jsx',
				pragma: 'tk.template.tag'
		]
	]

src = fs.readFileSync './index.coffee', 'utf-8'
jsx = babel.transform (coffee.compile src), opts

fs.writeFileSync './index.js', jsx.code
