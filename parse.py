#	coding utf-8
'''
Index parser.
'''

import re
import sys
import uuid
import json

from urllib.parse import quote

from datetime import datetime
from lxml import etree

# internal classes
from models.lettergroup import LetterGroup
from models.levelgroup import LevelGroup
from models.xref import XRef
from models.xreflist import XRefList
#from models.locator import Locator

class Locator:
	def __init__(self, target):
		self.target = target
		self.count =0

	def serialize(self):
		try:	
			issueNumber = ''
			url, datestring = get_path_for_page(int(self.target.split('-')[0]))
			
		except:
			issueNumber = self.target.split(':')[0]
			self.target=self.target[len(issueNumber)+1:]
			
			url, datestring = get_path_for_page(int(self.target.split('-')[0]))
			firstPartUrl = url.split('#')[0]
			url = firstPartUrl+'#'+issueNumber+':'+self.target
			
		return {
			'target': str(issueNumber)+':'+str(self.target),
			'url': url,
			'datestring': datestring
		}

	def __repr__(self):
		return f'Locator: {self.target}\n'

def load_pagemap():
	with open('testing/page_map_examples/PageMap2017HOUSE.txt') as f:
		data = f.read()

	ranges = []
	path_defn = re.search(r'PATH=(.*)', data)
	path = path_defn.group(1)

	for match in re.finditer(r'([0-9]+)-([0-9]+)\s(.*)', data):
		url = match.group(3).strip()
		pathmatch = re.search(r'([0-9]{8})([ap])m-Hansard-v([0-9]+)n([0-9]+)', url)

		mdate = datetime.strptime(pathmatch.group(1), '%Y%m%d')
		ranges.append({
			'bottom': int(match.group(1)),
			'top': int(match.group(2)),
			'path': url,
			'datestring': quote('%s<br>%s'%(
				'%s; %s Sitting'%(
					mdate.strftime('%A, %B %d, %Y'),
					'Morning' if pathmatch.group(2) == 'a' else 'Afternoon'
				),
				'Volume %s, Issue %s'%(
					pathmatch.group(3), 
					pathmatch.group(4)
				)
			))
		})
	return ranges, path

_page_ranges, _path = load_pagemap()
def get_path_for_page(page_no):
	for r in _page_ranges:
		if r['bottom'] <= page_no and r['top'] >= page_no:
			
			return '%s%s#%s'%(_path, r['path'], page_no), r['datestring']
	
	return None, None

def pretty_text(text):
	if text is None:
		return ''
	return re.sub('\s+', ' ', text).strip()

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
	with open('output/a.out', 'w') as f:
		f.writelines([repr(o) + '\n' for o in parsed])

	jstr = json.dumps([l.serialize() for l in parsed])#, indent=4).replace('    ', '\t')

	with open('output/a.json', 'w') as f:
		f.write(jstr)

	with open('output/a.js', 'w') as f:
		f.write('var indexID = "%s"; var data = %s'%(uuid.uuid4().hex, jstr))
