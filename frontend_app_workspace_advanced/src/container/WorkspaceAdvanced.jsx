import React from 'react'
import WorkspaceAdvancedComponent from '../component/WorkspaceAdvancedComponent.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  generateAvatarFromPublicName,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
} from '../action.async.js'
import Radium from 'radium'

class WorkspaceAdvanced extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'workspace_advanced',
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
      case 'workspace_advanced_showApp':
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: true})
        break
      case 'workspace_advanced_hideApp':
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case 'allApp_changeLang':
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.loadContent()
        break
    }
  }

  componentDidMount () {
    console.log('%c<WorkspaceAdvanced> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<WorkspaceAdvanced> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
  }

  componentWillUnmount () {
    console.log('%c<WorkspaceAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContent = async () => {
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  render () {
    const { isVisible, loggedUser, content, config } = this.state
    const { t } = this.props

    if (!isVisible) return null

    return (
      <PopinFixed
        customClass={`${config.slug}`}
        customColor={config.hexcolor}
      >
        <PopinFixedHeader
          customClass={`${config.slug}`}
          customColor={config.hexcolor}
          faIcon={config.faIcon}
          title={'woot'}
          idRoleUserWorkspace={loggedUser.idRoleUserWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedOption
          customColor={config.hexcolor}
          customClass={`${config.slug}`}
          i18n={i18n}
        />

        <PopinFixedContent
          customClass={`${config.slug}__contentpage`}
        >
          <WorkspaceAdvancedComponent
            displayFormNewMember={false}
            key={'workspace_advanced'}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default Radium(translate()(WorkspaceAdvanced))
