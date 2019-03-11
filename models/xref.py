from models.levelgroup import LevelGroup

class XRef:
	_created = []

	def __init__(self, label, target, related=None, relation=None):
		self.label = label
		self.target = target
		#
		#		A <relation=under> <association=B>
		#
		self.related = related
		self.relation = relation
		self.to_id = None

		self.__class__._created.append(self)

	@classmethod
	def resolve_all(cls):
		print(f'Resolving {len(cls._created)} x-refs against {len(LevelGroup._created)} potential targets')

		ordered_targets = sorted(LevelGroup._created, key=lambda o: o.level)

		missed = 0
		for xref in cls._created:
			found = None
			for level in ordered_targets:
				if level.heading == xref.target:
					found = level
					break
			if not found:
				missed += 1
				print(f'Missed target for x-ref {xref.label}')
			else:
				xref.to_id = found.id

		print(f'Missed {missed}/{len(cls._created)}')

	def serialize(self):
		ser = {
			'label': self.label,
			'target': self.to_id,
		}
		if self.relation is not None:
			ser['relation'] = self.relation

			if self.related is not None:
				ser['related'] = self.related.serialize()
		
		return ser

	def __repr__(self):
		return f'XRef -> {self.label} (locked on {self.to_id})\n'