import React from 'react'
import { connect } from 'react-redux'
import debounce from 'lodash/debounce'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../util/appFactory.js'

import {
  COOKIE_FRONTEND,
  workspaceConfig,
  FETCH_CONFIG
} from '../util/helper.js'
import {
  CUSTOM_EVENT,
  TracimComponent,
  checkUsernameValidity,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  PAGE
} from 'tracim_frontend_lib'
import { newFlashMessage, setHeadTitle } from '../action-creator.sync.js'
import Card from '../component/common/Card/Card.jsx'
import CardPopupUsername from './CardPopupUsername'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'
import HomeHasWorkspace from '../component/Home/HomeHasWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      hidePopupCheckbox: false,
      newUsername: '',
      isUsernameValid: true,
      password: '',
      usernamePopup: false,
      usernameInvalidMsg: ''
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => this.setHeadTitle()

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  handleClickJoinWorkspace = () => {
    this.props.history.push(PAGE.JOIN_WORKSPACE)
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.setUsernamePopupVisibility()
    this.setHeadTitle()
  }

  componentWillUnmount () {
    this.debouncedCheckUsername.cancel()
  }

  setHeadTitle = () => {
    const { props } = this

    props.dispatch(setHeadTitle(props.t('Home')))
  }

  setUsernamePopupVisibility () {
    if (!(this.props.user.username || Cookies.get(COOKIE_FRONTEND.HIDE_USERNAME_POPUP))) {
      this.setState({ usernamePopup: true })
    }
  }

  checkUsername = async () => {
    const { props, state } = this

    if (!state.newUsername) {
      this.setState({ isUsernameValid: true, usernameInvalidMsg: '' })
      return
    }

    try {
      this.setState(await checkUsernameValidity(FETCH_CONFIG.apiUrl, state.newUsername, props))
    } catch (errorWhileChecking) {
      props.dispatch(newFlashMessage(errorWhileChecking.message, 'warning'))
    }
  }

  debouncedCheckUsername = debounce(this.checkUsername, CHECK_USERNAME_DEBOUNCE_WAIT)

  render () {
    const { props } = this

    if (!props.system.workspaceListLoaded) return null

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview fullWidthFullHeight'>
          <section
            className='homepage'
            style={{ backgroundColor: props.workspaceList.length === 0 ? 'gray' : 'white' }}
          >
            <Card customClass='homepagecard'>
              <CardHeader displayHeader={false} />

              <CardBody formClass='homepagecard__body'>
                {(props.workspaceList.length > 0
                  ? (
                    <HomeHasWorkspace user={props.user} />
                  )
                  : (
                    <HomeNoWorkspace
                      canCreateWorkspace={props.canCreateWorkspace}
                      canJoinWorkspace={props.accessibleWorkspaceList.length > 0}
                      onClickCreateWorkspace={this.handleClickCreateWorkspace}
                      onClickJoinWorkspace={this.handleClickJoinWorkspace}
                    />
                  )
                )}
              </CardBody>
            </Card>
            {(this.props.user.usernamePopup &&
              <CardPopupUsername />
            )}
          </section>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system, accessibleWorkspaceList }) => ({ user, workspaceList, system, accessibleWorkspaceList })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(Home)))))
