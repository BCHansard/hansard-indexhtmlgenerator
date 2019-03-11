from helpers import get_path_for_page

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