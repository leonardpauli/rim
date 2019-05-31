# lexemize/syntax/bind
# rimpy/p2
# created by Leonard Pauli, 30 may 2019

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic as Semantic

from .base import Base
from .string import String
from .id import Id
from .number import Number
from .group import Group, GroupKind

direct_bind_safe_value_type = (String, Group) # ie. not Number (3, 5 would be 35, should be 3(5) or 3 5) # TODO: Number is safe around String, it's the Number-Number or Id-Id or Id.Special-Id.Special or Id-Number combinations that has to be handled
direct_attach_safe_target_type = (String, Group, Number, Id) # ie. not necessarily Id.Strip, Expression


class BindKind(): pass
class Prefix(BindKind): # eg. add(2), add 2 # possibly add 2 3 4
	name = "prefix"
class Infix(BindKind): # eg. (3)*(2), 3 * 2 # possiby 2 * 3 4
	name = "infix"
class Postfix(BindKind): # eg. 3px
	name = "postfix"
BindKind.Prefix = Prefix
BindKind.Infix = Infix
BindKind.Postfix = Postfix


class Bind(Base):

	target = None # ...
	values = None # []
	kind = None # ...
	space_before = None # ... # only valid with some kinds
	space_after = None # ...

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'kind: {self.kind.name}',
			self.space_before and f'space.before: "{repr(self.space_before)[1:-1]}"',
			f'target: {repr(self.target)}',
			self.space_after and f'space.after: "{repr(self.space_after)[1:-1]}"',
			f'({", ".join([repr(v) for v in self.values])})',
		])

	# init
	@classmethod
	def with_token(cls, token):
		raise Exception('Bind.with_token is not a thing?')

	@classmethod
	def with_values(cls, target, values, kind):
		s = cls()
		s.target = target
		s.values = values
		s.kind = kind
		return s


	# transformation

	def to_semantic(self):
		s = Semantic.Bind()
		s.syntax = self
		
		s.target = self.target.to_semantic()
		s.values = [v.to_semantic() for v in self.values]
		s.kind = self.kind # TODO: should it really be semantically important?

		return s

	def __str__(self):
		if self.kind is BindKind.Prefix:
			assert len(self.values) == 1 # todo: could/should possible support multiple
			assert self.space_before is None
			val = self.values[0]

			r = str(self.target)+(self.space_after or "")
			direct_ok = bool(self.space_after)
			if not direct_ok:
				for ok in direct_bind_safe_value_type:
					if isinstance(val, ok):
						direct_ok = True
						break
			r += str(val) if direct_ok else str(Group.with_value(val))

			return r

		elif self.kind is BindKind.Infix:
			assert len(self.values) == 2 # todo: could/should possible support multiple
			left, right = self.values

			r = str(left)+(self.space_before or "")+str(self.target)+(self.space_after or "")+str(right)
			return r

		elif self.kind is BindKind.Postfix:
			assert len(self.values) == 1 # todo: could/should possible support multiple
			assert self.space_after is None
			val = self.values[0]

			direct_ok = bool(self.space_before)
			if not direct_ok:
				for ok in direct_bind_safe_value_type:
					if isinstance(val, ok):
						direct_ok = True
						break
			r = str(val) if direct_ok else str(Group.with_value(val))
			r += (self.space_before or "")+str(self.target)
			return r

		else: raise Exception('unknown kind')


	@classmethod
	def from_semantic(cls, semantic):
		assert semantic.target and semantic.values
		from . import from_semantic
		s = cls()

		s.target = from_semantic(semantic.target)
		s.values = [from_semantic(v) for v in semantic.values]
		s.kind = semantic.kind

		if semantic.syntax:
			s.space_before = semantic.syntax.space_before
			s.space_after = semantic.syntax.space_after

		return s



# Attach

class Attach(Base): # a{b: c, ...}

	target = None # ...
	value = None # ...

	def _repr_extra(self):
		return filter(lambda x: x, [
			f'target: {repr(self.target)}',
			f'({repr(self.value)})',
		])

	# init
	@classmethod
	def with_token(cls, token):
		raise Exception('Bind.with_token is not a thing?')

	@classmethod
	def with_value(cls, target, value):
		assert isinstance(value, Group) and value.kind == GroupKind.Brace
		s = cls()
		s.target = target
		s.value = value
		return s


	# transformation

	def to_semantic(self):
		s = Semantic.Attach()
		s.syntax = self
		
		s.target = self.target.to_semantic()
		s.value = self.value.to_semantic()

		return s

	def __str__(self):
		return str(self.target)+str(self.value)


	@classmethod
	def from_semantic(cls, semantic):
		assert semantic.target and semantic.value
		from . import from_semantic

		target = from_semantic(semantic.target)
		value = from_semantic(semantic.value)

		assert isinstance(value, Group) and value.kind == GroupKind.Brace

		if type(target) not in direct_attach_safe_target_type:
			target = Group.with_value(target)

		return cls.with_value(target, value)
