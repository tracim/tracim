import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  // handleFetchResult,
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
} from '../action.async.js'

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
      // console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
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
        <PageWrapper customeClass='admin'>
          <PageTitle
            parentClass='admin__header'
            customClass='justify-content-between'
            title={'Admin'}
          />

          <PageContent parentClass='workspace__content'>
            woot { this.state.config.type }
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

export default translate()(AdminWorkspaceUser)
