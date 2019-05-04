import os

class Repository():
	pass

class Directory(Repository):
	def __init__(self, path):
		# validation? os.path.isdir(path)
		self.path = path
	def get_item(self):
		yield from os.listdir(self.path)
