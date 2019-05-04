import os
import re

class File:
	def __init__(self, name, directory=None):
		self.name = name
		self.directory = directory
		self.__line = None
	
	@classmethod
	def from_path(cls, p):
		dp, name = os.path.split(p)
		d = Directory.Absolute(dp)
		return cls(name, d)

	@staticmethod
	def or_directory_from_path(p):
		return Directory.from_path(p) if os.path.isdir(p) else File.from_path(p)

	def path(self):
		return os.path.join(self.directory.path(), self.name) if self.directory else self.name

	def to_many_line(self):
		if self.__line!=None: return self.__line # TODO: better not to cache by default if no auto purge cache mechanism?
		self.__line = []
		with open(self.path(), 'r') as f:
			for raw in f:
				line = clean_line_end_re.sub('', raw)
				self.__line.append(line)
				yield line

	def __repr__(self):
		return f'<{self.__class__.__name__} {self.name}>'

	def ext(self):
		return os.path.splitext(self.name)[1]

clean_line_end_re = re.compile(r'[\n\r]+$')


class Directory(File):
	def to_many_file(self):
		p = self.path()
		for name in os.listdir(p):
			yield Directory(name, self) if os.path.isdir(os.path.join(p, name)) else File(name, self)
	def to_many_line(self):
		for f in self.to_many_file():
			yield f.name

class Absolute(Directory):
	def __init__(self, path):
		self.name = path
		self.directory = None
	def path(self):
		return self.name
Directory.Absolute = Absolute

# py -m src.lib.filesystem
if __name__ == '__main__':
	f = File.from_path('./src/lib/filesystem.py')
	print(f.path())
	print(os.path.realpath(f.path()))
	print(list(f.to_many_line()))
	print()
	d = Directory.from_path('./src/lib')
	print(d.path(), d.name)
	print(list(d.to_many_file()))

