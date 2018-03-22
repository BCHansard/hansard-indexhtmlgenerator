#	coding utf-8
'''
Index parser
'''

import re
import sys
import uuid
import json

from lxml import etree

def pretty_text(text):
	if text is None:
		return ''
	return re.sub('\s+', ' ', text).strip()

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

class Locator:
	
	def __init__(self, target):
		self.target = target

	def serialize(self):
		return {
			'target': self.target
		}

	def __repr__(self):
		return f'Locator: {self.target}\n'

def parse(filename):
	root = etree.parse(filename)

	def parse_level(level_node, depth, parent_level=None):
		#	Find heading.
		pretext = pretty_text(level_node.text)
		next_level = f'level{depth + 1}'
		if len(pretext) == 0:
			heading_tag = level_node.getchildren()[0]
			heading, tag = pretty_text(heading_tag.text), heading_tag.tag
		else:
			heading, tag = pretext, 'text'

		name_check = re.match('^\((.+)\)$', heading)
		was_respondent = name_check is not None
		if was_respondent:
			parent_level.respondents = True
			heading = name_check.group(1)
			tag = 'member'

		#	Create level.
		level = LevelGroup(depth, heading, tag)

		#	Consume xrefs.
		def eat_xref_type(cur):
			if cur is None or cur.tag != 'italic':
				return None, cur
			
			xrefl = XRefList(pretty_text(cur.text))
			cur = cur.getnext()
			while cur is not None and cur.tag == 'xref':
				label = pretty_text(' '.join(cur.itertext()))
				related, relation = None, None

				italic = cur.xpath('italic')
				if len(list(italic)) > 0:
					target = pretty_text(cur.text)
					if len(target.strip()) > 0:
						label = target
					relation = pretty_text(italic[-1].text)
					
					bold = cur.xpath('bold')
					if len(list(bold)) > 0:
						related = pretty_text(bold[-1].text)
				else:
					target = label
				if len(target.strip()) == 0:
					target = None
				
				if related is not None:
					related = XRef(related, related)

				xrefl.content.append(XRef(label, target, related, relation))
				cur = cur.getnext()
			return xrefl, cur

		children = level_node.getchildren()
		if children:
			if tag == 'text':
				cur = children[0]
			else:
				if len(children) > 1:
					cur = children[1]
				else:
					cur = None
			
			while cur is not None:
				xrefs, cur = eat_xref_type(cur)
				if xrefs is None:
					break
				level.xrefs.append(xrefs)

			#	Find locators.
			direct_locator_kids = [t for t in level_node.getchildren() if t.tag == 'locator']
			for locator_node in direct_locator_kids:
				level.locators.append(Locator(locator_node.text))

		for next_level_node in [t for t in level_node.getchildren() if t.tag == next_level]:
			level.content.append(parse_level(next_level_node, depth + 1, level))

		return level

	groups = []
	for group_node in root.xpath('//group'):

		#	Create group for letter
		group = LetterGroup(group_node.xpath('heading/bold')[0].text)
		
		for level1_node in group_node.xpath('level1'):
			group.content.append(parse_level(level1_node, 1))
		groups.append(group)

	XRef.resolve_all()
	return groups
		
if __name__ == '__main__':
	parsed = parse(sys.argv[1])
	with open('a.out', 'w') as f:
		f.writelines([repr(o) + '\n' for o in parsed])

	jstr = json.dumps([l.serialize() for l in parsed])#, indent=4).replace('    ', '\t')

	with open('a.json', 'w') as f:
		f.write(jstr)

	with open('a.js', 'w') as f:
		f.write('var data = ' + jstr)
