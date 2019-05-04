import os

from .lib.terminal.cli import Cli as CliBase
from .lib.filesystem import File, Directory

class Cli(CliBase):
	"""usage: rimpy [options...] in/file.rim
	- will parse infile and write output (?) to in/file.out
	"""
	class Config(CliBase.Config):
		_fields = {
			'v': {'type': int, 'desc': 'level of verbosity (0, 1, 2)', 'default': 0, 'from_str': lambda s: int(s)},
		}
		_list_min = 1
		_list_max = 1
	
	def start(self):
		infile = File.or_directory_from_path(self.config._list[0])
		infilep = os.path.realpath(infile.path())
		outpath = os.path.splitext(infilep)[0]+os.path.extsep+'out'
		print(f'will write to {outpath} from {infilep}')

