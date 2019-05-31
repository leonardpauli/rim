# lexemize/syntax/number
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from itertools import count
from math import floor

from ... import tokenize
from ...tokenize import base as tokenizeBase
from .. import semantic

from .base import Base


class Number(Base):

	def __init__(self):
		self.digits_whole = ""
		self.digits_decimal = ""
		self.spacers_whole = []
		self.spacers_decimal = []

	# without spacers

	@property
	def precision_decimal_min(self):
		return len(self.digits_decimal) if self.digits_decimal.endswith('0') else 0

	@precision_decimal_min.setter
	def precision_decimal_min(self, value):
		i = len(self.digits_decimal)-1
		while i > 0:
			if self.digits_decimal[i]!='0': break
			i -= 1
		self.digits_decimal = self.digits_decimal[0:i+1] + "".join(['0' for _ in range(0, max(0, value-(i+1) ))])


	@property
	def positions_whole_min(self):
		return len(self.digits_whole) if self.digits_whole.startswith('0') else 1

	@positions_whole_min.setter
	def positions_whole_min(self, value):
		i = 0
		for d in self.digits_whole:
			if d!='0': break
			i += 1
		self.digits_whole = "".join(['0' for _ in range(0, max(0, value-len(self.digits_whole) ))])+self.digits_whole[i:]


	# insertion positions from decimal point

	@property
	def uses_spacers(self):
		return (len(self.spacers_whole) + len(self.spacers_decimal)) > 0
	@property
	def spacers_every3(self):
		# ...6---3---.---3---6...
		if not self.uses_spacers: return False
		sp_whole_ev3 = [v for i, v in enumerate(self.spacers_whole) if v==(i+1)*3]
		sp_decim_ev3 = [v for i, v in enumerate(self.spacers_decimal) if v==(i+1)*3]
		whole_ok = len(sp_whole_ev3)==len(self.spacers_whole) >= (len(self.digits_whole)/3-1)
		decim_ok = len(sp_decim_ev3)==len(self.spacers_decimal) > (len(self.digits_decimal)/3-1)
		return whole_ok and decim_ok
	@spacers_every3.setter
	def spacers_every3(self, value):
		if value:
			self.spacers_whole = list(range(3, int(len(self.digits_whole)), 3))
			self.spacers_decimal = list(range(3, int(len(self.digits_whole)), 3))
		else:
			self.spacers_whole.clear()
			self.spacers_decimal.clear()

	def _repr_extra(self):
		return filter(lambda x: x, [
			"spacers_every3" if self.spacers_every3 else ("uses_spacers" if self.uses_spacers else None),
			f"precision_decimal_min: {self.precision_decimal_min}" if self.precision_decimal_min else None,
			f'("{self.digits_whole}", "{self.digits_decimal}")'
		])


	# init
	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token

		whole = True
		i = 0
		for t in token.endterminals():
			if type(t) is tokenize.Number.Decimal.Dot:
				whole = False
				i = 0
			elif type(t) is tokenizeBase.Digit or type(t) is tokenizeBase.Digit.Zero:
				if whole: s.digits_whole += t.raw()
				else: s.digits_decimal += t.raw()
				i+=1
			elif type(t) is tokenize.Number.Spacing:
				if whole: s.spacers_whole.append(i)
				else: s.spacers_decimal.append(i)

		l = len(s.digits_whole)
		s.spacers_whole.reverse()
		s.spacers_whole = [l-v for v in s.spacers_whole]

		return s


	# transformation

	def to_semantic(self):
		s = semantic.Number.BasicFloat()
		s.syntax = self
		s.value = float(self.digits_whole+'.'+self.digits_decimal)
		return s

	def __str__(self, digits_whole=None, digits_decimal=None):
		if digits_whole is None: digits_whole = self.digits_whole
		if digits_decimal is None: digits_decimal = self.digits_decimal
		r = ""

		spacers_every3 = self.spacers_every3

		dw = list(digits_whole)
		dw.reverse()
		offset = 0
		for p in (range(3, int(len(digits_whole)), 3) if spacers_every3 else self.spacers_whole):
			if p>=len(digits_whole): break
			dw.insert(offset+p, '_')
			offset += 1
		dw.reverse()
		digits_whole = "".join(dw)

		r += digits_whole

		if len(digits_decimal):
			dw = list(digits_decimal)
			offset = 0
			for p in (range(3, int(len(digits_decimal)), 3) if spacers_every3 else self.spacers_decimal):
				if p>=len(digits_decimal): break
				dw.insert(offset+p, '_')
				offset += 1
			digits_decimal = "".join(dw)

			r += '.'+"".join(digits_decimal)

		return r

	@classmethod
	def from_semantic(cls, semantic):
		token = tokenize.Number.match(format(semantic.value, 'f'))
		s = cls.with_token(token)
		while s.digits_decimal.endswith('0'):
			s.digits_decimal = s.digits_decimal[:-1]
		if len(s.digits_decimal)==1 and s.digits_decimal[0] == "0":
			s.precision_decimal_min = 0
		if semantic.syntax:
			s.spacers_whole = semantic.syntax.spacers_whole.copy()
			s.spacers_decimal = semantic.syntax.spacers_decimal.copy()
			s.precision_decimal_min = semantic.syntax.precision_decimal_min
			s.positions_whole_min = semantic.syntax.positions_whole_min
		else:
			s.spacers_whole = []
			s.spacers_decimal = []
			s.precision_decimal_min = 0
			s.positions_whole_min = 1
		return s
