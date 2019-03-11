class LetterGroup:
	def __init__(self, letter):
		self.letter = letter
		self.content = []

	def serialize(self):
		return {
			'letter': self.letter,
			'content': [c.serialize() for c in self.content]
		}

	def __repr__(self):
		c = "\n".join(repr(o) for o in self.content)
		return f'o\tLetter {self.letter}: \n{c}'