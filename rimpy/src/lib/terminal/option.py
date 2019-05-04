import sys

def from_many_String(it):
	arg, restarg = split_one(it, '--')

	def arg_item(arg):
		for it in arg:
			if it.startswith('--'):
				key, val = String_split_one(it[2:], '=')
				yield [key, val or True]
			elif it.startswith('-'):
				key, val = String_split_one(it[1:], '=')
				if len(key)>1 and val:
					raise SyntaxError(f"`-{key}=...` - did you mean `-{key[:-1]} -{key[-1]}=...` or `--{key}=...`?")
				yield from [[k, val or True] for k in key]
			else: yield it

	item = list(arg_item(arg))
	if len(restarg): item.append(['__restarg', restarg])
	"""if len(opt.restarg):
		if 'restarg' in kv:
			raise ValueError('restarg provided as a flag, and as `... -- ...`, only one of those at a time supported')
		kv['restarg'] = restarg
	"""

	return item

def String_split_one(it, needle):
	res = it.split(needle, 1)
	return res if len(res)==2 else res+[None]

def split_one(xs, needle):
	try:
		i = xs.index(needle)
		return xs[:i], xs[i+1:]
	except ValueError:
		return xs, []


if __name__ == '__main__':
	o = Option.from_many_String(sys.argv[1:])
	print(list(o[0]))
