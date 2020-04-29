import React from 'react'
import { connect } from 'react-redux'
import * as Cookies from 'js-cookie'
import { withRouter } from 'react-router-dom'
import { translate } from 'react-i18next'
import appFactory from '../appFactory.js'
import {
  COOKIE_FRONTEND,
  workspaceConfig
} from '../helper.js'
import {
  buildHeadTitle,
  CUSTOM_EVENT,
  CardPopup
} from 'tracim_frontend_lib'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import HomeNoWorkspace from '../component/Home/HomeNoWorkspace.jsx'
import HomeHasWorkspace from '../component/Home/HomeHasWorkspace.jsx'

export class Home extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
    this.state = {
      newUsername: '',
      checkbox: false,
      usernamePopup: false
    }
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  handleClickCreateWorkspace = e => {
    e.preventDefault()
    const { props } = this
    props.renderAppPopupCreation(workspaceConfig, props.user, null, null)
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  componentDidMount () {
    this.checkUsername()
    this.setHeadTitle()
  }

  setHeadTitle = () => {
    const { props } = this

    if (props.system.config.instance_name) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('Home'), props.system.config.instance_name]) }
      })
    }
  }

  checkUsername = () => {
    // TODO when back, check if username = null, the cookie and set the username state
    if(!Cookies.get(COOKIE_FRONTEND.USERNAME_ESTABLISHED)){
      this.setState({ usernamePopup: true })
    }
  }

  handleClickCloseUsernamePopup = () => {
    this.setState(prevState => ({ usernamePopup: !prevState.usernamePopup }))
  }

  handleClickConfirmUsernamePopup = () => {
    if (this.state.newUsername === '') {
      Cookies.set(COOKIE_FRONTEND.USERNAME_ESTABLISHED, this.state.checkbox, { expires: COOKIE_FRONTEND.DEFAULT_EXPIRE_TIME })
    } else {
      console.log(this.state.newUsername) // TODO set username
    }
    this.handleClickCloseUsernamePopup()
  }

  handleClickCheckbox = () => {
    this.setState(prevState => ({ checkbox: !prevState.checkbox }))
  }

  handleChangeNewUsername = e => this.setState({ newUsername: e.target.value })

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
                      onClickCreateWorkspace={this.handleClickCreateWorkspace}
                    />
                  )
                )}
              </CardBody>
            </Card>
            {(this.state.usernamePopup &&
              <CardPopup
                customClass='homepage__usernamePopup'
                customHeaderClass='primaryColorBg'
                onClose={this.handleClickCloseUsernamePopup}
              >
                <div className='homepage__usernamePopup__body'>
                  <div className='homepage__usernamePopup__body__title'>
                    {props.t("Hello, you don't have a username yet!")}
                  </div>

                  <div className='homepage__usernamePopup__body__msg'>
                    {props.t('Set your username:')}
                  </div>

                  <input
                    className='homepage__usernamePopup__body__input form-control'
                    type='text'
                    placeholder={props.t('@username')}
                    value={this.state.newUsername}
                    onChange={this.handleChangeNewUsername}
                  />

                  <div className='homepage__usernamePopup__body__checkbox'>
                    <input
                      className='homepage__usernamePopup__body__checkbox__input'
                      type='checkbox'
                      onChange={this.handleClickCheckbox}
                    />
                    {props.t('never ask me again')}
                  </div>
                  <div className='homepage__usernamePopup__body__smallmsg'>
                    ({props.t('you can always set your username in your account preferences')})
                  </div>

                  <button
                    type='button'
                    className='homepage__usernamePopup__body__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover'
                    onClick={this.handleClickConfirmUsernamePopup}
                  >
                    {props.t('Confirm')}
                  </button>
                </div>
              </CardPopup>
            )}
          </section>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system }) => ({ user, workspaceList, system })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Home))))
