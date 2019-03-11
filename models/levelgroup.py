import uuid

class LevelGroup:
	_created = []

	def __init__(self, level, heading, heading_tag):
		self.level = level
		self.heading = heading
		self.heading_tag = heading_tag
		self.respondents = False
		self.xrefs = []
		self.content = []
		self.locators = []

		self.id = uuid.uuid4().hex

		self.__class__._created.append(self)
	
	def serialize(self):
		return {
			'id': self.id,
			'filter': False,
			'level': self.level,
			'heading': self.heading,
			'heading_type': self.heading_tag,
			'xrefs': [x.serialize() for x in self.xrefs],
			'content': [c.serialize() for c in self.content],
			'locators': [l.serialize() for l in self.locators],
			'respondents': self.respondents
		}

	def __repr__(self):
		tabs = '\t'*(self.level + 1)
		child_tabs = f'{tabs}\t'

		if self.xrefs:
			xref_repr = f'x{child_tabs}X-refs:\n{child_tabs}\t' + (f'{child_tabs}\t'.join(repr(o) for o in self.xrefs))
		else:
			xref_repr = f'-{child_tabs}[No x-refs]\n'

		if self.locators:
			locator_repr = f'l{child_tabs}Locators:\n{child_tabs}\t' + (f'{child_tabs}\t'.join(repr(o) for o in self.locators))
		else:
			locator_repr = f'-{child_tabs}[No locators]\n'

		if self.content:
			content_repr = '\n'.join(repr(o) for o in self.content)
		else:
			content_repr = f'-{child_tabs}[No content]\n'
		
		return f'''
			|{tabs}Level ({self.level}): {self.heading} ({self.heading_tag})\n{xref_repr}{locator_repr}{content_repr}
		'''.strip()