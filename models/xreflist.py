class XRefList:
	def __init__(self, prefix):
		self.prefix = prefix
		self.content = []

	def serialize(self):
		return {
			'prefix': self.prefix,
			'content': [c.serialize() for c in self.content]
		}

	def __repr__(self):
		return f'XRefList: ({self.prefix}) {", ".join([repr(o) for o in self.content])}\n'