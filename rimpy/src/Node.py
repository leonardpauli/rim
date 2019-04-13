# rim main node type
# rimpy
# created by Leonard Pauli, 14 apr 2019

"""

examplefile:
	' comment
		text
	parent:
		value: 5+9
		some: a
		- a
		- b

data:
	nodes:
		- {id: 0, kind: file, line: {id: 0}}
		- {id: 1, kind: comment{variant: block}}
		- {id: 2, kind: string, binaryValue: "comment\ntext"}
	connections:
		- {id: 1, source: 2, target: 1, order: 0.5}
		- {id: 2, source: 1, target: 2, order: 0.5}
	lines:
		- {id: 0, linenr: 0, indentation: -1, raw: "# examplefile:root"} // linenr should be called "linenr_at_initial_parse", will become invalid during tree modification (or add dirty logic (marks self + all line parents for line in same file as dirty ) + get_linenr that travles up to first non dirty parent (eg. file root) and recursively recalculates linenr for dirty from(inclusive) first dirty child (+ removes dirty flag))
	files:
		- {id: 1, name: 'examplefile.rim', node: {id: 0}}
	dir_file_connections:
		- {id: 1, source: {id: 0}, target: {id: 0}} // source: file -> target: dir
	dirs:
		- {id: 1, name: "src"}

"""



__global_node_id = 0
def get_global_node_id():
	global __global_node_id
	__global_node_id += 1
	return __global_node_id


class Node():
	def __init__(self):

		# cache

		# connection.id: Connection
		self._outlet_connections = {}
		self._inlet_connections = {}
		
		# kv
		self._kv_str_connections = {} # for kv with key as str node: key(as str): [Connection]
		# for kv with key as node supporting hashable: key(as hashable value as str?): [Connection]
		# self._kv_hashable_connections = {} # eg. number? or image?, etc (ensure no collisions? or just chance parameter)
		# self._kv_nodeid_connections = {} # other


		"""
		Node
			(inlet -> listnodes), subnodes (ordered, kv(node(eg. str node or exp node (if exp -> int, put in list? but if int->val lookup wanted?)): node) + anon(eg. do), same key twice allowed -> key: (val1, val2), if exp node -> resolve + cache as hashmap), binaryValue -> fn -> outlet
		"""

class Connection():
	def __init__(self, source, target, order):
		self.id = get_global_node_id()
		self.source = source
		self.target = target
		self.order = order
		""" order: float value
			seems to exist more destinct values between eg. 0..1 than 1..2 then 4..5, etc
			list start should have value 0, list end should have value float_max (no node will ever get these values)
			first added item should have as many distinct values on either side (eg. float_max/2 if even distribution, but different as it is now)
			seems like distinct values increase 2-logaritmically?

			use log2 to find half of distinct values between insertion points

			float 64 IEEE-754 standard:
			ffefffffffffffff min
			0000000000000000 0
			3ff0000000000000 1 // 0 011_1111_1111 0... -> S:0 E:0 (some sort of inverted two's complement?) B:1+0 -> B*2^E * (s?-1:1) -> 1*2^0 = 1
			4000000000000000 2 // 0 100_0000_0000 0... -> 1*2^1
			4010000000000000 4 // 0 100_0000_0001 0... -> 1*2^2
			4020000000000000 8 // 0 100_0000_0010 0... -> 1*2^3
			6000000000000000   // 0 110_0000_0000 0... about half, ~2.6815615859885194e+154
			433FFFFFFFFFFFFF Number.MAX_SAFE_INTEGER = 9 007 199 254 740 991
			7fefffffffffffff max // 1.7976931348623157e+308 (exactly?), try go higher
			7ff0000000000000 +inf
			fff0000000000000 -inf
			7ff0000000000001 sNaN (signaling NaN) (signed bit doesn't matter?)
			7ff0000000000002 sNaN (signaling NaN) (etc)
			ffffffffffffffff qNaN (quiet NaN)

			https://en.wikipedia.org/wiki/NaN
			https://babbage.cs.qc.cuny.edu/IEEE-754/
			https://stackoverflow.com/questions/8875064/how-many-distinct-floating-point-numbers-in-a-specific-range
			https://modernweb.com/what-every-javascript-developer-should-know-about-floating-points/
		"""

	def as_dict(self):
		return {
			'id': self.id,
			'source': self.source.id,
			'target': self.target.id,
			'order': self.order,
		}



