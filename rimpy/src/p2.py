# p2.p
"""
created by Leonard Pauli, 5 may 2019
idea: create through many iterations of unstructured files parts that later on can be assembled into the final rimpy structure
"""


# node base

class Node:
	binaryValue = None
	listItem = []
	keyValue = {}

	def __init__(self):
		pass

	def value(self):
		return self

	def match(self, query):
		assert type(query) == NodeQuery
		return False

	def query(self, query):
		return [x for x in listItem if x.match(query)]


	def repr_data(self):
		return {}, ()

	def __repr__(self):
		kvs, xs = self.repr_data()
		kvsstr = ", "+", ".join([f'{k}: {repr(v)}' for k, v in kvs.items()]) if len(kvs.items()) else ""
		xsstr = '('+", ".join([repr(x) for x in xs])+')'if len(xs) else ""
		return f'Node\{is {self.__class__.__name__}{kvsstr}\}{xsstr}'


class NodeQuery(Node):
	pass


# base types

class NodeString(Node):
	def __init__(self, value):
		assert type(value) == str
		self.binaryValue = value

class NodeList(Node):
	def __init__(self, listItem):
		assert type(listItem) == list
		self.listItem = listItems

class NodeNumber(Node):
	def __init__(self, value):
		assert type(value) == float || type(value) == int
		self.binaryValue = value


# next




