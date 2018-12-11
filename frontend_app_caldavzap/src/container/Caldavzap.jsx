import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  CardPopup
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'

require('../css/index.styl')

class Caldavzap extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'caldavzap',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      default:
        break
    }
  }

  componentDidMount () {
    console.log('%c<Caldavzap> did mount', `color: ${this.state.config.hexcolor}`)
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Caldavzap> did update', `color: ${state.config.hexcolor}`, prevState, state)
  }

  componentWillUnmount () {
    console.log('%c<Caldavzap> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  sendGlobalFlashMsg = (msg, type) => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    return (
      <div>
        Caldav
      </div>
    )
  }
}

export default translate()(Caldavzap)
