# main
# rimpy
# created by Leonard Pauli, apr 2019

import os
import re
import json

from .Line import file_to_node, LineJSONEncoder

def cli(args):

	# config

	verbose = 2 if '-vv' in args else 1 if '-v' in args else 0
	args.remove('-v') if '-v' in args else None
	args.remove('-vv') if '-vv' in args else None

	dflags = [a for a in args if a.startswith('--')]
	for a in dflags: args.remove(a)
	dflags = {k: v for k, v in [a[2:].split('=') for a in dflags]}

	out_formats = dflags.pop('out').split(',') if 'out' in dflags else []
	sourcepath = args.pop() if len(args) == 1 else None

	out_formats_valid = ['gantt-json']

	if len(args) or len(dflags.keys()) or not sourcepath or not len(out_formats):
		print(f"usage: rimpy [-v|-vv] --out={','.join(out_formats_valid)} rel-or-abs/path/to/file.rim")
		return
	out_formats_invalid = [f for f in out_formats if f not in out_formats_valid]
	if len(out_formats_invalid):
		print(f'out formats {out_formats_invalid} not valid, try {out_formats_valid}')

	pathv = lambda p: os.path.realpath(p) if verbose > 1 else p


	# read
	
	with open(sourcepath, 'r') as f:
		text = f.read()


	# parse

	(node, all_lines, all_nodes) = file_to_node(sourcepath)


	# process + write

	if 'gantt-json' in out_formats:
		outpath = re.sub(r'\.\w+$', '.json', sourcepath)
		obj = {'root': node, 'lines': all_lines, 'nodes': all_nodes}
		outtext = json.dumps(obj, sort_keys=False, cls=LineJSONEncoder, indent=2)
		print(outtext)
		return
		if verbose:
			print(f'compiles {pathv(sourcepath)} -> {pathv(outpath)}')

