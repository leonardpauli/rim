# lexemize/syntax.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019

from .. import tokenize
from . import semantic


# base

class LexemeSyntax():
	wrapper = None

	def _repr_extra(self):
		return [f'{self.wrapper.start}..{self.wrapper.end}']
	def __repr__(self):
		inner = ", ".join([f'is {self.__class__.__name__}']+self._repr_extra())
		return f'Lexeme.Syntax{{{inner}}}'

	@classmethod
	def with_token(cls, token):
		s = cls()
		s.wrapper = token
		return s

	def to_semantic(self, linestr):
		pass

	@classmethod
	def from_semantic(self, line_start):
		pass

	def token_delta_update(self, semantic):
		# next = self.__class__.from_semantic(semantic, self.wrapper.start)
		# return TokenDeltaUpdate.Replace(source=self.wrapper, target=next.wrapper)
		pass


Base = LexemeSyntax


# items

class Number(Base):
	whole_part = [] # whole_part is many Token
	dot = None # dot is Token?
	decimal_part = [] # decimal_part is many Token
	
	def _repr_extra(self):
		return []

	def to_semantic(self, linestr):
		s = semantic.Number()

		# value
		s.value_lossy = float(linestr[self.wrapper.start:self.wrapper.end].replace('_', ''))
		whole_wrapper, decimal_wrapper = self.wrapper.patternMatch

		# whole
		
		leading_zeros_wrapper_or_digit, nrs_wrapper = whole_wrapper.patternMatch
		if isinstance(leading_zeros_wrapper_or_digit, tokenize.Number.LeadingZeros):
			s.whole_min_positions = len(whole_wrapper.raw(linestr).replace('_', ''))

			zero_fst, nrs_wrapper1 = leading_zeros_wrapper_or_digit.patternMatch
			whole_content = [zero_fst]
			if nrs_wrapper1: whole_content += nrs_wrapper1
		else:
			whole_content = [leading_zeros_wrapper_or_digit]
		
		if nrs_wrapper: whole_content += nrs_wrapper
		
		# spacers
		i = 0
		whole_content_r = whole_content.copy()
		whole_content_r.reverse()
		for t in whole_content_r:
			if isinstance(t, tokenize.Number.Spacing):
				s.whole_spacer_locations.append(i)
			else:
				i += 1

		# if len(decimal_wrapper)>0 && decimal_wrapper[1]:
		# 	s.whole_min_positions = whole_wrapper.end-whole_wrapper.start
		return s

	# @classmethod
	# def from_semantic(cls, sem, line_start):
	# 	pre = "".join(["#" for _ in range(0, line_start)])
	# 	t = tokenize.Number.match(pre+str(sem.value_lossy), line_start)
	# 	return cls.with_token(t)

	def token_delta_update(self, semantic):
		# next = self.__class__.from_semantic(semantic, self.wrapper.start)
		# return TokenDeltaUpdate.Replace(source=self.wrapper, target=next.wrapper)
		pass



if __name__ == '__main__':
	# test
	pass
