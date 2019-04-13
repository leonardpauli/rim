# lines

import re
from json import JSONEncoder

indent_start_re = re.compile(r'^([ \t]*)(.*)')

__global_line_id = 0
def get_global_line_id():
	global __global_line_id
	__global_line_id += 1
	return __global_line_id

class Line():
	def __init__(self, raw, linenr, filepath):
		self.raw = raw
		self.linenr = linenr
		self.filepath = filepath

		self.id = get_global_line_id()

		self.indentation_raw, self.text_raw = indent_start_re.match(self.raw).groups()
		self.indentation = len(re.sub('  ', '\t', self.indentation_raw))

		self.children = []
		# self.parent = None

	def __repr__(self):
		return f"<Line {self.linenr}:{self.indentation} \"{self.text_raw}\">"

class LineJSONEncoder(JSONEncoder):
	def default(self, obj):
		if isinstance(obj, Line):
			return {
				'id': obj.id,
				'linenr': obj.linenr,
				'indentation': obj.indentation,
				'text_raw': obj.text_raw,
				'children': [{'id': c.id} for c in obj.children]
			}
		return JSONEncoder.default(self, obj)



def text_to_line(text, filepath):
	parent_line = Line('# root', 0, filepath)
	parent_line.indentation = -1
	lines = [Line(raw, linenr+1, filepath) for linenr, raw in enumerate(text.split('\n'))]
	resolve_children(parent_line, lines)
	return (lines, parent_line)

def resolve_children(parent_line, lines):
	parents = [parent_line]
	for l in lines:
		# TODO: strict 1-level indent change only
		# TODO: better attachment of empty lines
		if len(l.text_raw) == 0:
			parents[-1].children.append(l)
			# l.parent = parents[-1]
		elif parents[-1].indentation < l.indentation:
			parents[-1].children.append(l)
			# l.parent = parents[-1]
			parents.append(l)
		else:
			while l.indentation < parents[-1].indentation:
				parents.pop()
			if parents[-1].indentation == l.indentation:
				parents.pop()
				parents[-1].children.append(l)
				# l.parent = parents[-1]
				parents.append(l)
			else: raise SyntaxError('panic')
