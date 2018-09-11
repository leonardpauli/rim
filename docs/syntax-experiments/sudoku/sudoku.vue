<template lang="pug">
.about
	h1 This is an about page
	| leftFilter:
	input(v-model="leftFilter.v")
	input(v-model="leftFilter.max")
	.grid
		.box(v-for="b in boxes", :key="b.i", :style="{background: b.wrong?'red':void 0}")
			input(:value="b.valueRaw", @input="boxesValuesRawSet(b.i, $event.target.value)")
			.options(v-if="!b.valueExists"): .option(v-for="o in b.optionsImp", :style="{opacity: o.same? 0.2: o.available? 0.5: 0, background: 'rgba(0,'+(o.optionsCount==0?250:0)+',250,'+(0.9/(Math.pow(o.optionsCount+1, 2)))+')', borderRadius: (o.lineInBox?10:0)+'px'}")
				| {{o.v}}
				span(:style="{fontSize: '6px'}") {{o.optionsCount}}

</template>
<script>
const getLeft = vs=> Array(9).fill().map((v, i)=> i+1).filter(v=> !vs.includes(v))

export default {
	data: ()=> ({
		boxesValuesRaw: [null, 7, null, 2, 5, null, 4, null, null, 8, null, null, null, null, null, 9, null, 3, null, null, null, null, null, 3, null, 7, null, 7, null, null, null, null, 4, null, 2, null, 1, null, null, null, null, null, null, null, 7, null, 4, null, 5, null, null, null, null, 8, null, 9, null, 6, null, null, null, null, null, 4, null, 1, null, null, null, null, null, 5, null, null, 7, null, 8, 2, null, 3, null],
		// boxesValuesRaw: Array(9*9).fill().map((_, i)=> null),
		leftFilter: {
			v: 1,
			max: 9,
		},
	}),
	computed: {
		boxes () {
			const {leftFilter} = this
			const bvs = this.boxesValuesRaw.map((v, i)=> ({
				i, valueRaw: v,
				v: isNaN(parseInt(v, 10))? null: parseInt(v, 10),
				valueExists: !!v,
				x: i%9,
				y: Math.floor(i/9),
				get xb () { return Math.floor(this.x/3) },
				get yb () { return Math.floor(this.y/3) },
				get xSame () { return bvs.filter(o=> o.y == this.y && o.i!=this.i) },
				get ySame () { return bvs.filter(o=> o.x == this.x && o.i!=this.i) },
				get bSame () { return bvs.filter(o=> o.xb == this.xb && o.yb == this.yb && o.i!=this.i) },
				get vsLeft () { return [...new Set([...this.xSame, ...this.ySame, ...this.bSame].map(v=> v.v))] },
				get allLeft () { return getLeft(this.vsLeft) },
				get wrong () { return this.valueExists && !this.allLeft.includes(this.v) },
				get options () {
					const bSameLeft = this.bSame.filter(o=> !o.valueExists).map(o=> o.allLeft)
					const optionsCountInB = v=> bSameLeft.filter(vs=> vs.includes(v)).length
					const left = this.allLeft.filter(v=> leftFilter.v?v==leftFilter.v:true)

					/* const xyAvailable = v=> {
						const sideBoxes = Object.values(bvs.filter(b=> (b.xb == this.xb || b.yb == this.yb) && !(b.xb == this.xb && b.yb == this.yb)).reduce((a, b)=> {
							const k = b.xb+'x'+b.yb
							;(a[k] = a[k] || []).push(b)
							return a
						}, {}))
						return sideBoxes.some(bvs=> bvs.filter(bv=> bv.valueExists && bv.v == v))
					} */

					const meV = v
					return Array(9).fill().map((_, i)=> i+1).map(v=> ({
						v, available: left.includes(v) /* && xyAvailable(v) */, same: v==this.v,
						optionsCount: optionsCountInB(v),
					}))
				},
				get optionsImp () {
					const self = this
					return this.options.map((op, i)=> ({
						...op,
						lineInBox: (o=> !!o.x != !!o.y)(bvs.filter(b=> b.xb == this.xb && b.yb == this.yb && b!=self)
							.filter(b=> b.options[i].available)
							.reduce(({x, y}, b)=> ({
								x: x + (b.x == self.x?1:0),
								y: y + (b.y == self.y?1:0),
							}), {x: 0, y: 0})),
					}))
				},
			}))
			return bvs
		},
	},
	methods: {
		boxesValuesRawSet (i, v) { this.$set(this.boxesValuesRaw, i, v) },
	},
}
</script>
<style lang="stylus" scoped>
.about
	border 1px solid red
	*
		padding 0px
		margin 0px
	.grid
		w = 50px
		border 2px solid black
		size (w * 9)
		display flex
		flex-direction row
		flex-wrap wrap
		.box
			border 1px solid rgba(0,0,0,0.1)
			&:nth-child(3n+0)
				border-right 1px solid rgba(0,0,0,0.6)
			for num in (1..9)
				&:nth-child({9*3}n+{num + 9*2})
					border-bottom 1px solid rgba(0,0,0,0.6)
			size (w - 2px)
			position relative
			.options
				size 100%
				absolute top left
				display flex
				flex-direction row
				flex-wrap wrap
				pointer-events none
			.option
				size 25%
				background rgba(0,0,0,0.08)
				font-size 8px
				padding 2px
				opacity 0.5
			input
				outline none
				border none
				text-align center
				absolute top left
				size 100%
				display block
				&:focus
					background rgba(0,0,0,0.01)
</style>
