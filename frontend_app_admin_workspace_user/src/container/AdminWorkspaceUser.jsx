import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n
  // handleFetchResult
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
} from '../action.async.js'
import AdminWorkspace from '../component/AdminWorkspace.jsx'

require('../css/index.styl')

class AdminWorkspaceUser extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'admin_workspace_user',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'admin_workspace_user_showApp':
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.setState({config: data.config})
        break
      default:
        break
    }
  }

  componentDidMount () {
    console.log('%c<AdminWorkspaceUser> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<AdminWorkspaceUser> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
    if (prevState.config.type !== state.config.type) this.loadContent()
  }

  componentWillUnmount () {
    console.log('%c<AdminWorkspaceUser> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContent = () => {
    return null
  }

  render () {
    const { isVisible } = this.state
    // const { t } = this.props

    if (!isVisible) return null

    return (
      <div>
        {this.state.config.type === 'workspace' &&
          <AdminWorkspace />
        }

        {this.state.config.type === 'user' &&
          <div>not yet implemented</div>
        }
      </div>
    )
  }
}

export default translate()(AdminWorkspaceUser)
