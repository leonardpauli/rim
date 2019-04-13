# lines

import re
from json import JSONEncoder

indent_start_re = re.compile(r'^([ \t]*)(.*)')

__global_line_id = 0
def get_global_line_id():
	global __global_line_id
	__global_line_id += 1
	return __global_line_id

__global_node_id = 0
def get_global_node_id():
	global __global_node_id
	__global_node_id += 1
	return __global_node_id

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

		self.tokens = []

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
		if isinstance(obj, Node):
			return {
				'id': obj.id,
				'line': self.default(obj.line),
				# 'children': [self.default(c) for c in obj.children],
				'children': [{'id': c.id} for c in obj.children]
			}
		return JSONEncoder.default(self, obj)



class Node():
	def __init__(self, line, child_line_context):
		self.id = get_global_node_id()
		self.line = line
		self.child_line_context = child_line_context
		self.children = []
	def __repr__(self):
		return f"<Node {repr(self.line)}>"

class NodeContext():
	def tokenize(self, line):
		tokens = []
		return tokens
	def parse(self, line):
		node = Node(line, NodeContext())
		fail_subtree = False
		return (node, fail_subtree)

def root_node_plain_with_filepath(filepath):
	line = Line('# root', 0, filepath)
	line.indentation = -1
	node = Node(line, child_line_context=NodeContext())
	return node


class Queue():
	"""idea: add items to queue, they will be processed in undefined order,
		using multiple threads if available (not implemented yet though)
		ability to add from processor (end of queue or as next?)
		use for eg. flattening of recursive processing (less risk of stack overflow)
	"""
	def __init__(self, processor):
		self.processor = processor
		self.items = [] # TODO: is it correct data structure? linked list by def in python? if so, probably ok
		# self.isdone = True
	def add(self, item):
		self.items.append(item)
		# if self.isdone:
		# 	self._process()
	def _process(self):
		# self.isdone = False
		for item in self.items:
			yield from self.processor(self, item)
		self.items.clear()
		# self.isdone = True
	def run(self):
		yield from self._process()

def file_to_node(filepath):
	root = root_node_plain_with_filepath(filepath)
	lines = list(file_to_lines(filepath))
	topnodes = list(parse_to_topnodes(root, lines))
	

	def assemble_processed(items):
		for parent, node in items:
			parent.children.append(node)
			yield node

	def process_node_child_line(queue, val):
		(parent, line) = val
		line.tokens = parent.child_line_context.tokenize(line)
		(node, fail_subtree) = parent.child_line_context.parse(line)
		yield (parent, node) # yield (parent, node) instead and assemble result stream from queue on main for thread safefy?
		if not fail_subtree:
			[queue.add((node, line)) for line in node.line.children]

	queue = Queue(processor=process_node_child_line)

	for (node, fail_subtree) in topnodes:
		root.children.append(node)
		if not fail_subtree:
			[queue.add((node, line)) for line in node.line.children]

	nodes = assemble_processed(queue.run())
	return (root, lines, [*[n for n, _ in topnodes], *nodes])


def parse_to_topnodes(root, lines):
	# each line can initially be handled by itself,
	# 	thus allowing delta re-parsing + cutting of syntax errors soner
	for topline in resolve_children(root.line, lines):
		topline.tokens = root.child_line_context.tokenize(topline)
		(node, fail_subtree) = root.child_line_context.parse(topline)
		yield (node, fail_subtree)


clean_line_end_re = re.compile(r'[\n\r]+$')
def file_to_lines(filepath):
	with open(filepath, 'r') as f:
		for linenr, raw in enumerate(f):
			raw = clean_line_end_re.sub('', raw)
			yield Line(raw, linenr+1, filepath)


def resolve_children(parent_line, lines):
	""" + yields finished top lines"""
	parents = [parent_line]
	for l in lines:
		# TODO: strict 1-level indent change only
		# TODO: better attachment of empty lines
		if len(l.text_raw) == 0:
			parents[-1].children.append(l)
			# l.parent = parents[-1]
		elif parents[-1].indentation < l.indentation:
			prev_top_child_done = parents[-1] == parent_line and len(parents[-1].children)
			if prev_top_child_done: yield parents[-1].children[-1]

			parents[-1].children.append(l)
			# l.parent = parents[-1]
			parents.append(l)
		else:
			while l.indentation < parents[-1].indentation:
				parents.pop()
			if parents[-1].indentation == l.indentation:
				parents.pop()
				prev_top_child_done = parents[-1] == parent_line and len(parents[-1].children)
				if prev_top_child_done: yield parents[-1].children[-1]
				parents[-1].children.append(l)
				# l.parent = parents[-1]
				parents.append(l)
			else: raise SyntaxError('panic')

	prev_top_child_done = len(parents[0].children)
	if prev_top_child_done: yield parents[0].children[-1]
