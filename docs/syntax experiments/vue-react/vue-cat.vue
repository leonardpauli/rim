<template lang="pug">
.asdfasdf
  span(
    @mouseover="changeName",
    @mouseout="changeName"
  ) cat {{name}} {{name}} {{name}}
  br
  input(placeholder='hello', :value="something")

  MyButton(v-for="cat, i in cats", :title="cat.name", :key="i")

</template>
<script>
import MyButton from '@/components/MyButton'

export default {
  components: {MyButton},
  data () {
    return {
      cats: [
        {name: 'Anna'},
        {name: 'Erik'},
        {name: 'Hugo'},
        {name: 'Ludvig'}
      ]
    }
  },
  computed: {
    something () {
      return 'Hi ' + this.name
    }
  },
  methods: {
    changeName () {
      this.name = this.name === 'Erik' ? 'Anna' : 'Erik'
    }
  }
}

</script>
<style lang="stylus" scoped>

.asdfasdf
  color hsl(322, 100%, 29%)
  font-size 2em
  font-weight bold

</style>
