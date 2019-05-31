# lexemize/semantic.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from .syntax.bind import BindKind


# base

class LexemeSemantic():
	syntax = None # optional ref
	def _repr_extra(self):
		return []
	def __repr__(self):
		inner = ", ".join([f'is {self.__class__.__name__}']+self._repr_extra())
		return f'Lexeme.Semantic{{{inner}}}'
	# def __str__(self):
	# 	pass
Base = LexemeSemantic


# items

class Number(Base):
	class BasicFloat(Base):
		value = 0
		@classmethod
		def with_value(cls, val):
			s = cls()
			s.value = val
			return s


class String(Base):
	parts = None # []
	def _repr_extra(self):
		content = [(f'"{p}"' if type(p) is str else repr(p)) for p in self.parts]
		return [f'({", ".join(content)})']
	@classmethod
	def with_string(cls, val):
		s = cls()
		s.parts = [val]
		return s


class Id(Base):
	text = None # ""
	def _repr_extra(self):
		return [f'text: "{repr(self.text)[1:-1]}"']
	@classmethod
	def with_text(cls, text):
		s = cls()
		s.text = text
		return s

	class Strip(Base):
		parts = None # []
		def _repr_extra(self):
			return [f'({", ".join([repr(p) for p in self.parts])})']
		@classmethod
		def with_parts(cls, parts):
			s = cls()
			s.parts = parts
			return s

class Group(Base):
	kind = None # semantic.GroupKind...
	value = None # semantic
	closed = True
	def _repr_extra(self):
		return list(filter(lambda x: x is not None, [
			self.kind and f'kind: {self.kind.name}',
			f'not closed' if not self.closed else None,
			self.value and f'({repr(self.value)})'
		]))


class Bind(Base):
	target = None
	values = None # []
	kind = None # BindKind
	def _repr_extra(self):
		return [
			f'kind: {self.kind.name}',
			f'target: {repr(self.target)}',
			f'({", ".join([repr(v) for v in self.values])})',
		]
	@classmethod
	def with_value(cls, target, value, kind=BindKind.Prefix):
		s = cls()
		s.target = target
		s.values = [value]
		s.kind = kind
		return s

class Attach(Base):
	target = None
	value = None
	def _repr_extra(self):
		return [
			f'target: {repr(self.target)}',
			f'({repr(self.value)})',
		]
	@classmethod
	def with_value(cls, target, value):
		s = cls()
		s.target = target
		s.value = value
		return s


# class Expression(Base):



if __name__ == '__main__':
	# test
	pass
