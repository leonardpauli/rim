# profile syntax tests

return BlurPage({ 
			style: style,
			showClose: true,
			visible: store.profileVisible,
		})([
			View({ style: styles.container })([
				TouchablePress({ style: [styles.avatar], onPress: ::this.showImageSelector })([
					MediaImageView({ mediaObject: store.currentUser.avatar, style: styles.avatarInner }),
				]),
				Text({ style: styles.displayName })([store.currentUser.displayName]),
				Text({ style: styles.username })(['@'+store.currentUser.username]),
				View({ style: styles.tab })([
					TouchablePress({ testID: 'logout_button', style: styles.tabInner, onPress: logout })([
						Text({ style: styles.tabTitle })(['LOGOUT'])
					])
				]),
				View({ style: styles.tab })([
					TouchablePress({ style: styles.tabInner} onPress={legal })([
						Text({ style: styles.tabTitle })(['LEGAL'])
					]),
				]),
			])
			Text({ style: styles.copyright })(['Copyright © Starflow AB 2017']),
		])


# ------



viewify
	name: "Profile"
	render: BlurPage{s: main, showClose: true}
		visible: store.profileVisible
		- View: {s: container}
			- TouchablePress: {s: avatar, onPress: @showImageSelector}
				- MediaImageView: {s: avatarInner, mediaObject: store.currentUser.avatar}
			- View: {s: displayName}: - store.currentUser.displayName
			- View: {s: username}: - "@"+store.currentUser.username
			- btn: {onPress: logout, title: 'Logout', testID: 'logout_button'}
			- btn: {onPress: legal, title: 'Legal'}
		- View: {s: copyright}: - 'Copyright © Starflow AB 2017'




# ------



viewify
	name: 'Profile'
	render: self => BlurPage
		s: main
		showClose: true
		visible: store.profileVisible, [
			View s: container, [
				TouchablePress s: avatar, onPress: @showImageSelector, [
					MediaImageView s: avatarInner, mediaObject: store.currentUser.avatar
				]
				View s: displayName, [()=> store.currentUser.displayName]
				View s: username, [()=> '@'+store.currentUser.username]
				btn onPress: logout, title: 'Logout', testID: 'logout_button'
				btn onPress: legal, title: 'Legal'
			]
			View s: copyright, ['Copyright © Starflow AB 2017']
		]



# ------



BlurPage
	style: style
	showClose: true
	visible: store.profileVisible
	- container: View
		- avatar: TouchablePress{onPress: this.showImageSelector}
				- avatarInner: MediaImageView{mediaObject: store.currentUser.avatar}
		- displayName: Text: - store.currentUser.displayName
		- username: Text: - "@" + store.currentUser.username
		- tab: View: - tabInner: TouchablePress:
			testID: "logout_button"
			onPress: logout
			- tabTitle: Text: - "LOGOUT"
		- tab: View: - tabInner: TouchablePress{onPress: legal}:
			- tabTitle: Text: - "LEGAL"
	- copyright: Text: - "Copyright © Starflow AB 2017"



# ------



BlurPage({ 
	style: style,
	showClose: true,
	visible: store.profileVisible,
})([
	View({ style: styles.container })([
		TouchablePress({ style: [styles.avatar], onPress: this.showImageSelector })([
			MediaImageView({ mediaObject: store.currentUser.avatar, style: styles.avatarInner }),
		]),
		Text({ style: styles.displayName })([store.currentUser.displayName]),
		Text({ style: styles.username })(['@'+store.currentUser.username]),
		View({ style: styles.tab })([
			TouchablePress({ testID: 'logout_button', style: styles.tabInner, onPress: logout })([
				Text({ style: styles.tabTitle })(['LOGOUT'])
			])
		]),
		View({ style: styles.tab })([
			TouchablePress({ style: styles.tabInner, onPress: legal })([
				Text({ style: styles.tabTitle })(['LEGAL'])
			]),
		]),
	]),
	Text({ style: styles.copyright })(['Copyright © Starflow AB 2017']),
])



# ------



import {s} from '@/style'
import {v, viewify} from '@/utils'
import {BlurPage} from '@/components'

export default viewify({
	name: 'Profile',
	render: self=> BlurPage({
		s: main,
		showClose: true,
		visible: store.profileVisible,
	})([
		v({s: container})([
			TouchablePress({s: avatar, onPress: ::self.showImageSelector})([
				MediaImageView({s: avatarInner, mediaObject: store.currentUser.avatar}),
			]),
			v({s: displayName})([()=> store.currentUser.displayName]),
			v({s: username})([()=> '@'+store.currentUser.username]),
			btn({onPress: logout, title: 'Logout', testID: 'logout_button'}),
			btn({onPress: legal, title: 'Legal'}),
		])
		v({s: copyright})(['Copyright © Starflow AB 2017']),
	])
})

const btn = ({onPress, title, ...rest})=> v({s: tab, ...rest})([
	TouchablePress({s: tabInner, onPress})([
		v({s: tabTitle})([title]),
	]),
])

const styles = {
	main: {},
}
const {
	main, container
	avatar, avatarInner
	displayName, username
	tab, tabInner, tabTitle
	copyright,
} = styles



viewify
  name: 'Profile'
  render: -> BlurPage
    s: main
    showClose: true
    visible: store.profileVisible
    c:
      v s: container, c:
        TouchablePress
          s: avatar
          onPress: self.showImageSelector
          c:
            MediaImageView
              s: avatarInner
              mediaObject: store.currentUser.avatar
        v(s: displayName)([ ->
          store.currentUser.displayName
 ])
        v(s: username)([ ->
          '@' + store.currentUser.username
 ])
        btn(onPress: logout, title: 'Logout', testID: 'logout_button')
        btn(onPress: legal, title: 'Legal')
      ])
      v s: copyright, ['Copyright © Starflow AB 2017']


# ----



gridLayout({columns: "40, auto, *", rows: "40, auto, *", backgroundColor: "#3c495e"})([
  label({ text: '0,0', row: 0, col: 0, backgroundColor: "#43b883" }),
  label({ text: '0,1', row: 0, col: 1, backgroundColor: "#1c6b48", colSpan: 2 }),
  label({ text: '1,0', row: 1, col: 0, backgroundColor: "#289062", rowSpan: 2 }),
  label({ text: '1,1', row: 1, col: 1, backgroundColor: "#43b883" }),
  label({ text: '1,2', row: 1, col: 2, backgroundColor: "#289062" }),
  label({ text: '2,1', row: 2, col: 1, backgroundColor: "#1c6b48" }),
  label({ text: '2,2', row: 2, col: 2, backgroundColor: "#43b883" }),
])

const range = (a, b = void 0)=> {
  [a, b] = Array.isArray(a)? a: b===void 0? [0, a]: [a, b]
  const step = a<b? -1: 1
  const arr = []
  for (let i = 0, len = Math.abs(b-a); i<len; i++)
    arr[i] = a+i*step
  return arr
}

gridLayout({columns: "40, auto, *", rows: "40, auto, *", backgroundColor: "#3c495e"})([
  row=> col=> label({ text: '${row}, ${col}', row, col, backgroundColor: "#43b883" })
    |> range(4).map |> range(4).map
])




# -------




BlurPage({ 
  style: style,
  showClose: true,
  visible: store.profileVisible,
})([
  View({ style: styles.container })([
    TouchablePress({ style: [styles.avatar], onPress: this.showImageSelector })([
      MediaImageView({ mediaObject: store.currentUser.avatar, style: styles.avatarInner }),
    ]),
    Text({ style: styles.displayName })([store.currentUser.displayName]),
    Text({ style: styles.username })(['@'+store.currentUser.username]),
    View({ style: styles.tab })([
      TouchablePress({ testID: 'logout_button', style: styles.tabInner, onPress: logout })([
        Text({ style: styles.tabTitle })(['LOGOUT'])
      ])
    ]),
    View({ style: styles.tab })([
      TouchablePress({ style: styles.tabInner, onPress: legal })([
        Text({ style: styles.tabTitle })(['LEGAL'])
      ]),
    ]),
  ]),
  Text({ style: styles.copyright })(['Copyright © Starflow AB 2017']),
])



# -------



BlurPage
  style: style
  showClose: true
  visible: store.profileVisible
  - container: View
    - avatar: TouchablePress{onPress: this.showImageSelector}
        - avatarInner: MediaImageView{mediaObject: store.currentUser.avatar}
    - displayName: Text: - store.currentUser.displayName
    - username: Text: - "@" + store.currentUser.username
    - tab: View: - tabInner: TouchablePress:
      testID: "logout_button"
      onPress: logout
      - tabTitle: Text: - "LOGOUT"
    - tab: View: - tabInner: TouchablePress{onPress: legal}:
      - tabTitle: Text: - "LEGAL"
  - copyright: Text: - "Copyright © Starflow AB 2017"





# -------






const Store = modulate({
  name: 'Store',
  fields: ()=> ({
    count: {type: Number, default: 3}
  }),
  actions: {
    changeCount: s=> ()=> s.count++,
  },
})
const store = new Store()


import {v, s: {h1, h3}} from 'utils'

export default {
  name: 'MiscPlayground',
  computed: {
    nr: ()=> store.count*10,
    // render: self=> ..
  },
  actions: {
    increase: store.changeCount,
  },
  render: self=> v()([
    v({s: h1})(['Playground']),
    v({s: h3, @click: self.increase})([()=> 'ads ${self.nr}']),
    v({s: h3, @click: self.hi})([()=> 'say hello']),
  ])
}

const style = {
  h3: {},
}




# -------




viewify
	name: 'Profile'
	render: self => BlurPage
		s: main
		showClose: true
		visible: store.profileVisible, [
			View s: container, [
				TouchablePress s: avatar, onPress: @showImageSelector, [
					MediaImageView s: avatarInner, mediaObject: store.currentUser.avatar
				]
				View s: displayName, [()=> store.currentUser.displayName]
				View s: username, [()=> '@'+store.currentUser.username]
				btn onPress: logout, title: 'Logout', testID: 'logout_button'
				btn onPress: legal, title: 'Legal'
			]
			View s: copyright, ['Copyright © Starflow AB 2017']
		]