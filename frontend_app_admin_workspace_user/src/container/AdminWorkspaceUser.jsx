import React from 'react'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import Radium from 'radium'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  CardPopup,
  handleFetchResult,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { debug } from '../helper.js'
import {
  deleteWorkspace,
  getUserDetail,
  getUserList,
  getWorkspaceList,
  getWorkspaceMemberList,
  postAddUser,
  putMyselfProfile,
  putUserDisable,
  putUserEnable,
  putUserProfile
} from '../action.async.js'
import AdminWorkspace from '../component/AdminWorkspace.jsx'
import AdminUser from '../component/AdminUser.jsx'

const color = require('color')
require('../css/index.styl')

class AdminWorkspaceUser extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      appName: 'admin_workspace_user',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      popupDeleteWorkspaceDisplay: false,
      workspaceToDelete: null,
      workspaceIdOpened: null,
      breadcrumbsList: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(this.state.config.slug):
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.setState({ config: data.config })
        break
      case CUSTOM_EVENT.REFRESH_WORKSPACE_LIST:
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.loadWorkspaceContent()
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        if (this.state.config.type === 'workspace') this.loadWorkspaceContent()
        else if (this.state.config.type === 'user') this.loadUserContent()
        this.buildBreadcrumbs()
        break
      default:
        break
    }
  }

  async componentDidMount () {
    console.log('%c<AdminWorkspaceUser> did mount', `color: ${this.state.config.hexcolor}`)

    if (this.state.config.type === 'workspace') await this.loadWorkspaceContent()
    else if (this.state.config.type === 'user') await this.loadUserContent()

    this.buildBreadcrumbs()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<AdminWorkspaceUser> did update', `color: ${state.config.hexcolor}`, prevState, state)
    if (prevState.config.type !== state.config.type) {
      if (state.config.type === 'workspace') this.loadWorkspaceContent()
      else if (state.config.type === 'user') this.loadUserContent()
      this.buildBreadcrumbs()
    }
  }

  componentWillUnmount () {
    console.log('%c<AdminWorkspaceUser> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  sendGlobalFlashMsg = (msg, type) => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: this.props.t(msg),
      type: 'warning',
      delay: undefined
    }
  })

  loadWorkspaceContent = async () => {
    const { props, state } = this

    const fetchWorkspaceList = getWorkspaceList(state.loggedUser, state.config.apiUrl)
    const workspaceList = await handleFetchResult(await fetchWorkspaceList)

    switch (workspaceList.apiResponse.status) {
      case 200:
        const fetchWorkspaceListMemberList = await Promise.all(
          workspaceList.body.map(async ws =>
            handleFetchResult(await getWorkspaceMemberList(state.config.apiUrl, ws.workspace_id))
          )
        )

        this.setState(prev => ({
          content: {
            ...prev.content,
            workspaceList: workspaceList.body.map(ws => ({
              ...ws,
              memberList: (fetchWorkspaceListMemberList.find(fws => fws.body[0].workspace_id === ws.workspace_id) || { body: [] }).body
            }))
          }
        }))
        break

      default: this.sendGlobalFlashMsg(props.t('Error while loading shared spaces list', 'warning'))
    }
  }

  loadUserContent = async () => {
    const { props, state } = this

    const userList = await handleFetchResult(await getUserList(state.config.apiUrl))

    switch (userList.apiResponse.status) {
      case 200:
        const fetchUserDetailList = await Promise.all(
          userList.body.map(async u =>
            handleFetchResult(await getUserDetail(state.config.apiUrl, u.user_id))
          )
        )
        this.setState(prev => ({
          content: {
            ...prev.content,
            userList: fetchUserDetailList.map(fu => fu.body)
          }
        }))
        break
      default: this.sendGlobalFlashMsg(props.t('Error while loading users list'), 'warning')
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: <Link to={'/ui'}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <span>{props.t('Administration')}</span>,
      type: BREADCRUMBS_TYPE.CORE,
      notALink: true
    }]

    if (state.config.type === 'workspace') {
      breadcrumbsList.push({
        link: <Link to={'/ui/admin/workspace'}>{props.t('Shared space')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    } else if (state.config.type === 'user') {
      breadcrumbsList.push({
        link: <Link to={'/ui/admin/user'}>{props.t('Users')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    }

    // FIXME - CH - 2019/04/25 - We should keep redux breadcrumbs sync with fullscreen apps but when do the setBreadcrumbs,
    // app crash telling it cannot render a Link outside a router
    // see https://github.com/tracim/tracim/issues/1637
    // GLOBAL_dispatchEvent({type: 'setBreadcrumbs', data: {breadcrumbs: breadcrumbsList}})
    this.setState({ breadcrumbsList: breadcrumbsList })
  }

  handleDeleteWorkspace = async () => {
    const { props, state } = this

    const deleteWorkspaceResponse = await handleFetchResult(await deleteWorkspace(state.config.apiUrl, state.workspaceToDelete))
    switch (deleteWorkspaceResponse.status) {
      case 204:
        this.loadWorkspaceContent()
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.REFRESH_WORKSPACE_LIST,
          data: {}
        })
        break
      default: this.sendGlobalFlashMsg(props.t('Error while deleting shared space'), 'warning')
    }
    this.handleClosePopupDeleteWorkspace()
  }

  handleOpenPopupDeleteWorkspace = workspaceId => this.setState({
    popupDeleteWorkspaceDisplay: true,
    workspaceToDelete: workspaceId
  })

  handleClosePopupDeleteWorkspace = () => this.setState({ popupDeleteWorkspaceDisplay: false })

  handleToggleUser = async (userId, toggle) => {
    const { props, state } = this

    const activateOrDelete = toggle ? putUserEnable : putUserDisable

    const toggleUser = await handleFetchResult(await activateOrDelete(state.config.apiUrl, userId))
    switch (toggleUser.status) {
      case 204: this.loadUserContent(); break
      default: this.sendGlobalFlashMsg(props.t('Error while enabling or disabling user'), 'warning')
    }
  }

  handleUpdateProfile = async (userId, newProfile) => {
    const { props, state } = this

    const endPoint = userId === state.loggedUser.user_id ? putMyselfProfile : putUserProfile
    const toggleManager = await handleFetchResult(await endPoint(state.config.apiUrl, userId, newProfile))
    switch (toggleManager.status) {
      case 204: this.loadUserContent(); break
      default: this.sendGlobalFlashMsg(props.t('Error while saving new profile'), 'warning')
    }
  }

  handleClickAddUser = async (name, email, profile, password) => {
    const { props, state } = this

    if (name.length < 3) {
      this.sendGlobalFlashMsg(props.t('Full name must be at least 3 characters'), 'warning')
      return
    }

    if (!state.config.system.config.email_notification_activated) {
      if (password === '') {
        this.sendGlobalFlashMsg(props.t('Please set a password'), 'warning')
        return
      }

      if (password.length < 6) {
        this.sendGlobalFlashMsg(props.t('New password is too short (minimum 6 characters)'), 'warning')
        return
      }

      if (password.length > 512) {
        this.sendGlobalFlashMsg(props.t('New password is too long (maximum 512 characters)'), 'warning')
        return
      }
    }

    const newUserResult = await handleFetchResult(
      await postAddUser(state.config.apiUrl, name, email, profile, state.config.system.config.email_notification_activated, password)
    )

    switch (newUserResult.apiResponse.status) {
      case 200:
        this.loadUserContent()
        this.sendGlobalFlashMsg(
          state.config.system.config.email_notification_activated
            ? props.t('User created and email sent')
            : props.t('User created'),
          'info'
        )
        return true
      case 400:
        switch (newUserResult.body.code) {
          case 2001: this.sendGlobalFlashMsg(props.t('Error, invalid email address'), 'warning'); break
          case 2036: this.sendGlobalFlashMsg(props.t('Email already exists'), 'warning'); break
          default: this.sendGlobalFlashMsg(props.t('Error while saving new user'), 'warning')
        }
        return false
      default:
        this.sendGlobalFlashMsg(props.t('Error while saving new user'), 'warning')
        return false
    }
  }

  handleClickWorkspace = workspaceId => {
    const { state } = this
    if (state.workspaceIdOpened === null) {
      GLOBAL_renderAppFeature({
        loggedUser: {
          ...state.loggedUser,
          userRoleIdInWorkspace: 8 // only global admin can see this app, he is workspace manager of any workspace. So, force userRoleIdInWorkspace to 8
        },
        config: {
          label: 'Advanced dashboard',
          slug: 'workspace_advanced',
          faIcon: 'bank',
          hexcolor: GLOBAL_primaryColor,
          creationLabel: '',
          domContainer: 'appFeatureContainer',
          apiUrl: state.config.apiUrl,
          apiHeader: state.config.apiHeader,
          roleList: state.config.roleList,
          profileObject: state.config.profileObject,
          system: { ...state.config.system },
          translation: state.config.translation
        },
        content: {
          workspace_id: workspaceId
        }
      })
    } else GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_CONTENT('workspace_advanced'), data: { workspace_id: workspaceId } })

    this.setState({ workspaceIdOpened: workspaceId })
  }

  handleClickNewWorkspace = () => {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.SHOW_CREATE_WORKSPACE_POPUP, data: {} })
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    return (
      <div>
        {state.config.type === 'workspace' && (
          <AdminWorkspace
            workspaceList={state.content.workspaceList}
            onClickWorkspace={this.handleClickWorkspace}
            onClickNewWorkspace={this.handleClickNewWorkspace}
            onClickDeleteWorkspace={this.handleOpenPopupDeleteWorkspace}
            breadcrumbsList={state.breadcrumbsList}
          />
        )}

        {state.config.type === 'user' && (
          <AdminUser
            userList={state.content.userList}
            loggedUserId={state.loggedUser.user_id}
            profile={state.config.profileObject}
            emailNotifActivated={state.config.system.config.email_notification_activated}
            onClickToggleUserBtn={this.handleToggleUser}
            onChangeProfile={this.handleUpdateProfile}
            onClickAddUser={this.handleClickAddUser}
            breadcrumbsList={state.breadcrumbsList}
          />
        )}

        {state.popupDeleteWorkspaceDisplay &&
          <CardPopup
            customClass='adminworkspaceuser__popup'
            customHeaderClass='primaryColorBg'
            onClose={this.handleClosePopupDeleteWorkspace}
          >
            <div className='adminworkspaceuser__popup__body'>
              <div className='adminworkspaceuser__popup__body__msg'>{props.t('Are you sure ?')}</div>
              <div className='adminworkspaceuser__popup__body__btn'>
                <button
                  type='button'
                  className='btn outlineTextBtn primaryColorBorder primaryColorFont nohover'
                  onClick={this.handleClosePopupDeleteWorkspace}
                >
                  {props.t('Cancel')}
                </button>

                <button
                  type='button'
                  className='btn highlightBtn primaryColorBg primaryColorDarkenBgHover'
                  onClick={this.handleDeleteWorkspace}
                  style={{
                    ':hover': {
                      backgroundColor: color(GLOBAL_primaryColor).darken(0.15).hex()
                    }
                  }}
                >
                  {props.t('Delete')}
                </button>
              </div>
            </div>
          </CardPopup>
        }
      </div>
    )
  }
}

export default translate()(Radium(AdminWorkspaceUser))
