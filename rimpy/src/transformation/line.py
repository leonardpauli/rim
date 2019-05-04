class Line():
	def __init__(self, file, nr, raw):
		self.file = file
		pass

	@staticmethod
	def from_file(file):
		for linenr, raw in enumerate(file.get_line()):
			yield Line(file, linenr+1, raw)
