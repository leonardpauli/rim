import sys
from . import option
from math import inf

class Cli:
	def __init__(self, argv):
		def fail_w_usage(err):
			print(f'\n\t{err}\n')
			print(self.usage)
			print(f"\noptions:\n{self.Config.usage()}\n")
			raise Exit

		try:
			self.config = self.Config.from_Option(option.from_many_String(argv[1:]))
		except ValueError as err:
			fail_w_usage(err)
		except SyntaxError as err:
			fail_w_usage(err)

		self.start()

	@property
	def usage(self):
		return self.__class__.__doc__ or """usage: myscript [options...] in/file [in/file2...] [-- restargs...]"""
	
	def start(self):
		print('not implemented')


	class Config:
		_fields = {} # {k: {'type': str, 'desc': '...'} for k in 'a,b'.split(',')}
		# optional: {'default': True, 'from_str': lambda val: int(val)}
		_list_min = 0
		_list_max = inf

		def __init__(self, *v, **kv):
			self._list = v # todo: expose through https://codereview.stackexchange.com/questions/33060/subscriptable-indexable-generator?
			if len(v) < self._list_min:
				raise ValueError(f'expected at least {self._list_min} input value(s), got {len(v)}')
			if len(v) > self._list_max:
				raise ValueError(f'expected at max {self._list_max} input value(s), got {len(v)}')
			self._restarg = []
			if '_restarg' in kv:
				self._restarg = kv['_restarg']
				del kv['_restarg']
			for k, v in self._fields.items():
				default = None
				if 'default' in v: default = v['default']
				# elif v['type'] is bool: default = False
				# elif v['type'] is int: default = 0
				setattr(self, k, default)
			for k, v in kv.items():
				if k not in self._fields.keys():
					raise ValueError(f'unknown flag {k}')
				t = self._fields[k]
				# TODO: validate type + parsing
				try:
					parsed = t['from_str'](v) if 'from_str' in t else v
				except Exception as e:
					print(f'Failed to parse value for flag {repr(k)}:\n')
					raise e
				setattr(self, k, parsed)

		@classmethod
		def usage(cls):
			lines = ["// -a -b -c -abc --flag -a=value --flag=value"]
			lines += [f'{" -" if len(k)==1 else "--"}{k}\t\t({v["type"].__name__}) {v["desc"]}' for k, v in cls._fields.items()]
			return "\t"+"\n\t".join(lines)

		def __str__(self):
			lines = [f'{k}: {v}' for k, v in self.__dict__.items() if not k.startswith('_')]
			lines += [f'- {v}' for v in self._list]
			if len(self._restarg):
				lines += ['@restarg:']
				lines += [f'\t- {v}' for v in self._restarg]
			return "Config:\n\t"+"\n\t".join(lines)

		@classmethod
		def from_Option(cls, opt):
			kv = {v[0]: v[1] for v in opt if type(v) is list}
			v = [v for v in opt if type(v) is not list]
			return cls(*v, **kv)

class Exit(Exception):
	pass

# cd .. && py -m terminal.cli a b d -dr --ff=3 ./* -- llaa
if __name__ == '__main__':
	class MyCli(Cli):
		class Config(Cli.Config):
			_fields = {k: {'type': bool, 'desc': '...'} for k in 'd,r,ff'.split(',')}
	try:
		cli = MyCli(sys.argv)
	except Exit:
		sys.exit()
	print(str(cli.config))
	print(cli.config._list)
