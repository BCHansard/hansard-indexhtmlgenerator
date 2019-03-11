from parse import _page_ranges

def get_path_for_page(page_no):
	for r in _page_ranges:
		if r['bottom'] <= page_no and r['top'] >= page_no:
			
			return '%s%s#%s'%(_path, r['path'], page_no), r['datestring']
	
	return None, None