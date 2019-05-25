# lexemize/semantic.py
# rimpy/p2
# created by Leonard Pauli, 21 may 2019


# base

class LexemeSemantic():
	def _repr_extra(self):
		return []
	def __repr__(self):
		inner = ", ".join([f'is {self.__class__.__name__}']+self._repr_extra())
		return f'Lexeme.Semantic{{{inner}}}'
	def __str__(self):
		pass
Base = LexemeSemantic


# items

class Number(Base):
	class BasicFloat(Base):
		value = 0
		

	"""
	# todo: value (non-lossy, eg. by storing n sections of values up to 10**Int_max.digits.count-1 / some big int impl. + infinite decimal impl.)
	value_lossy = 0
	whole_min_positions = 0
	decimal_min_positions = 0
	whole_spacer_locations = []
	decimal_spacer_locations = []

	def _repr_extra(self):
		return [
			f'value.lossy: {self.value_lossy}',
			f'whole.positions.min: {self.whole_min_positions}',
			f'whole.spacer.location: {self.whole_spacer_locations}'
		]

	def __str__(self):
		s = str(self.value_lossy)
		whole_s, *decimal_ss = s.split('.')
		toadd = self.whole_min_positions-len(whole_s)
		if toadd > 0: whole_s = "".join(["0" for _ in range(0, toadd)])+whole_s

		whole_sa = [a for a in whole_s]
		whole_sa.reverse()
		i = 0
		i2 = 0
		for _ in whole_s:
			if i in self.whole_spacer_locations:
				whole_sa.insert(i2, '_')
				i2+=1
			i+=1
			i2+=1
		whole_sa.reverse()
		whole_s = "".join(whole_sa)


		if len(decimal_ss) == 0:
			return whole_s
		else:
			decimal_s = decimal_ss[0]
			return whole_s+'.'+decimal_s
	"""



if __name__ == '__main__':
	# test
	pass
