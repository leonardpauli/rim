import os

class File():
	def __init__(self, directory, name):
		self.directory = directory
		self.name = name
		self.line = None
	def get_path(self):
		return os.path.join(self.directory.path, self.name)
	def get_line(self):
		if self.line!=None: return self.line
		with open(self.get_path(), 'r') as f:
			for raw in f:
				line = clean_line_end_re.sub('', raw)
				self.line.append(line)
				yield line

clean_line_end_re = re.compile(r'[\n\r]+$')
