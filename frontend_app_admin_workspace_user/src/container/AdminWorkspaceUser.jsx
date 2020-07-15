import React from 'react'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import Radium from 'radium'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  CardPopup,
  BREADCRUMBS_TYPE,
  handleFetchResult,
  ROLE,
  CUSTOM_EVENT,
  buildHeadTitle,
  hasNotAllowedCharacters,
  hasSpaces,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  ALLOWED_CHARACTERS_USERNAME,
  debug,
  MAXIMUM_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_PUBLIC_NAME,
  MINIMUM_CHARACTERS_USERNAME
} from '../helper.js'
import {
  deleteWorkspace,
  getUserDetail,
  getUserList,
  getUsernameAvailability,
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

export class AdminWorkspaceUser extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug

    this.state = {
      appName: 'admin_workspace_user',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      isUsernameValid: true,
      usernameInvalidMsg: '',
      popupDeleteWorkspaceDisplay: false,
      workspaceToDelete: null,
      workspaceIdOpened: null,
      breadcrumbsList: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage },
      { name: CUSTOM_EVENT.SHOW_APP(param.config.slug), handler: this.handleShowApp }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.CREATED, handler: this.handleWorkspaceCreated },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.DELETED, handler: this.handleWorkspaceDeleted },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleWorkspaceMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleWorkspaceMemberDeleted },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.CREATED, handler: this.handleUserCreated },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.DELETED, handler: this.handleUserDeleted }
    ])
  }

  handleAllAppChangeLanguage = data => {
    const { state } = this
    console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, state)
    this.setState(prev => ({
      loggedUser: {
        ...prev.loggedUser,
        lang: data
      }
    }))
    i18n.changeLanguage(data)
    this.updateTitleAndBreadcrumbs()
  }

  handleShowApp = data => {
    const { state } = this
    console.log('%c<AdminWorkspaceUser> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    this.setState({ config: data.config })
  }

  updateTitleAndBreadcrumbs = () => {
    const { props } = this
    if (this.state.config.type === 'workspace') {
      this.setHeadTitle(props.t('Shared space management'))
    } else if (this.state.config.type === 'user') {
      this.setHeadTitle(props.t('User account management'))
    }
    this.buildBreadcrumbs()
  }

  refreshAll = async () => {
    this.updateTitleAndBreadcrumbs()
    if (this.state.config.type === 'workspace') {
      await this.loadWorkspaceContent()
    } else if (this.state.config.type === 'user') {
      await this.loadUserContent()
    }
  }

  async componentDidMount () {
    console.log('%c<AdminWorkspaceUser> did mount', `color: ${this.state.config.hexcolor}`)
    await this.refreshAll()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<AdminWorkspaceUser> did update', `color: ${state.config.hexcolor}`)
    if (prevState.config.type !== state.config.type) {
      await this.refreshAll()
    }
  }

  sendGlobalFlashMsg = (msg, type) => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: this.props.t(msg),
      type: type || 'warning',
      delay: undefined
    }
  })

  setHeadTitle = (title) => {
    const { state } = this

    if (state.config && state.config.system && state.config.system.config && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([title, state.config.system.config.instance_name]) }
      })
    }
  }

  loadWorkspaceContent = async () => {
    const { props, state } = this

    const fetchWorkspaceList = getWorkspaceList(state.config.apiUrl)
    const workspaceList = await handleFetchResult(await fetchWorkspaceList)

    switch (workspaceList.apiResponse.status) {
      case 200: {
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
              memberList: (fetchWorkspaceListMemberList.find(
                fws => fws.body.length > 0 && fws.body[0].workspace_id === ws.workspace_id
              ) || { body: [] }).body
            }))
          }
        }))
        break
      }
      default: this.sendGlobalFlashMsg(props.t('Error while loading shared spaces list', 'warning'))
    }
  }

  loadUserContent = async () => {
    const { props, state } = this

    const userList = await handleFetchResult(await getUserList(state.config.apiUrl))

    switch (userList.apiResponse.status) {
      case 200: {
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
      }
      default: this.sendGlobalFlashMsg(props.t('Error while loading users list'), 'warning')
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: <Link to='/ui'><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <span>{props.t('Administration')}</span>,
      type: BREADCRUMBS_TYPE.CORE,
      notALink: true
    }]

    if (state.config.type === 'workspace') {
      breadcrumbsList.push({
        link: <Link to='/ui/admin/workspace'>{props.t('Shared space')}</Link>,
        type: BREADCRUMBS_TYPE.APP_FULLSCREEN
      })
    } else if (state.config.type === 'user') {
      breadcrumbsList.push({
        link: <Link to='/ui/admin/user'>{props.t('Users')}</Link>,
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
    if (deleteWorkspaceResponse.status !== 204) {
      this.sendGlobalFlashMsg(props.t('Error while deleting shared space'), 'warning')
    }
    this.handleClosePopupDeleteWorkspace()
  }

  handleOpenPopupDeleteWorkspace = workspaceId => this.setState({
    popupDeleteWorkspaceDisplay: true,
    workspaceToDelete: workspaceId
  })

  handleClosePopupDeleteWorkspace = () => this.setState({ popupDeleteWorkspaceDisplay: false })

  handleWorkspaceCreated = (message) => {
    const { state } = this
    const workspace = message.workspace
    const newWorkspaceList = state.content.workspaceList.slice()
    /* INFO SG 2020-06-15:
     *  - the list is ordered by id and a newly created workspace has a greater id than all others.
     *  - initialize member list as empty since the shared space member created message will handle
     *    adding the initial user.
     */
    newWorkspaceList.push({ ...workspace, memberList: [] })

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newWorkspaceList
      }
    }))
  }

  handleWorkspaceModified = (message) => {
    const { state } = this

    const workspace = message.workspace
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${workspace.workspace_id} not found`)
      return
    }
    const memberList = workspaceList[workspaceIndex].memberList

    const workspaceWithMemberList = {
      ...workspace,
      memberList: memberList
    }

    const newWorkspaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      workspaceWithMemberList,
      ...workspaceList.slice(workspaceIndex + 1)
    ]
    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newWorkspaceList
      }
    }))
  }

  handleWorkspaceDeleted = (message) => {
    const { state } = this
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === message.workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${message.workspace.workspace_id} not found`)
      return
    }

    const newWorkspaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      ...workspaceList.slice(workspaceIndex + 1)
    ]
    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newWorkspaceList
      }
    }))
  }

  handleWorkspaceMemberCreated = (message) => {
    const { state } = this

    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === message.workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${message.workspace.workspace_id} not found`)
      return
    }

    const newMemberList = workspaceList[workspaceIndex].memberList.slice()
    newMemberList.push({
      user_id: message.user.user_id,
      user: message.user,
      workspace_id: message.workspace.workspace_id,
      workspace: message.workspace,
      do_notify: message.member.do_notify,
      is_active: message.user.is_active,
      role: message.member.role
    })
    const newWorkspace = { ...message.workspace, memberList: newMemberList }
    const newWorkspaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      newWorkspace,
      ...workspaceList.slice(workspaceIndex + 1)
    ]
    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newWorkspaceList
      }
    }))
  }

  handleWorkspaceMemberDeleted = (message) => {
    const { state } = this

    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === message.workspace.workspace_id)

    if (workspaceIndex === -1) {
      console.log(`<AdminWorkspaceUser>: workspace id ${message.workspace.workspace_id} not found`)
      // We do not have this workspace in our list...
      return
    }

    const newMemberList = workspaceList[workspaceIndex].memberList.filter(m => m.user_id !== message.user.user_id)
    const newWorkspace = { ...message.workspace, memberList: newMemberList }
    const newWorkspaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      newWorkspace,
      ...workspaceList.slice(workspaceIndex + 1)
    ]
    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newWorkspaceList
      }
    }))
  }

  handleToggleUser = async (userId, toggle) => {
    const { props, state } = this

    const activateOrDelete = toggle ? putUserEnable : putUserDisable

    const toggleUser = await handleFetchResult(await activateOrDelete(state.config.apiUrl, userId))

    if (toggleUser.status !== 204) {
      this.sendGlobalFlashMsg(props.t('Error while enabling or disabling user'), 'warning')
    }
  }

  handleUpdateProfile = async (userId, newProfile) => {
    const { props, state } = this

    const endPoint = userId === state.loggedUser.userId ? putMyselfProfile : putUserProfile
    const toggleManager = await handleFetchResult(await endPoint(state.config.apiUrl, userId, newProfile))
    if (toggleManager.status !== 204) {
      this.sendGlobalFlashMsg(props.t('Error while saving new profile'), 'warning')
    }
  }

  handleClickAddUser = async (name, username, email, profile, password) => {
    const { props, state } = this

    if (name.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
      this.sendGlobalFlashMsg(
        props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME })
      )
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
      await postAddUser(state.config.apiUrl, name, username, email, profile, state.config.system.config.email_notification_activated, password)
    )

    switch (newUserResult.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMsg(
          state.config.system.config.email_notification_activated
            ? props.t('User created and email sent')
            : props.t('User created'),
          'info'
        )
        return true
      case 400:
        switch (newUserResult.body.code) {
          case 2001:
            if (newUserResult.body.details.email) this.sendGlobalFlashMsg(props.t('Error, invalid email address'), 'warning')
            if (newUserResult.body.details.username) this.sendGlobalFlashMsg(props.t('Username must be between {{minimumCharactersUsername}} and {{maximumCharactersUsername}} characters long', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME, maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME }))
            else this.sendGlobalFlashMsg(props.t('Error while saving new user'), 'warning')
            break
          case 2062:
            this.sendGlobalFlashMsg(
              props.t('Your username is incorrect, the allowed characters are {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
            )
            break
          case 2036: this.sendGlobalFlashMsg(props.t('Email already exists'), 'warning'); break
          default: this.sendGlobalFlashMsg(props.t('Error while saving new user'), 'warning')
        }
        return false
      default:
        this.sendGlobalFlashMsg(props.t('Error while saving new user'), 'warning')
        return false
    }
  }

  handleUserCreated = (message) => {
    const { state } = this

    const user = message.user
    const newUserList = state.content.userList.slice()
    newUserList.push(user)

    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: newUserList
      }
    }))
  }

  handleUserModified = (message) => {
    const { state } = this

    const user = message.user
    const userList = state.content.userList
    const userIndex = userList.findIndex(u => u.user_id === user.user_id)

    if (userIndex === -1) {
      console.log(`<AdminWorkspaceUser>: user id ${user.user_id} not found`)
      // We do not have this user in our list...
      return
    }

    const newuserList = [
      ...userList.slice(0, userIndex),
      user,
      ...userList.slice(userIndex + 1)
    ]
    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: newuserList
      }
    }))
  }

  handleUserDeleted = (message) => {
    const { state } = this

    const user = message.user
    const userList = state.content.userList
    const newUserList = userList.filter(u => u.user_id !== user.user_id)
    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: newUserList
      }
    }))
  }

  handleClickWorkspace = workspaceId => {
    const { state } = this
    if (state.workspaceIdOpened === null) {
      GLOBAL_renderAppFeature({
        loggedUser: {
          ...state.loggedUser,
          userRoleIdInWorkspace: ROLE.workspaceManager.id // only global admin can see this app, he is workspace manager of any workspace. So, force userRoleIdInWorkspace to 8
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

  handleChangeUsername = async (newUsername) => {
    const { props, state } = this

    if (newUsername.length > 0 && newUsername.length < MINIMUM_CHARACTERS_USERNAME) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t('Username must be at least {{minimumCharactersUsername}} characters long', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME })
      })
      return
    }

    if (newUsername.length > MAXIMUM_CHARACTERS_USERNAME) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t('Username must be at maximum {{maximumCharactersUsername}} characters long', { maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME })
      })
      return
    }

    if (hasSpaces(newUsername)) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t("Username can't contain any whitespace")
      })
      return
    }

    if (hasNotAllowedCharacters(newUsername)) {
      this.setState({
        isUsernameValid: false,
        usernameInvalidMsg: props.t('Allowed characters: {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
      })
      return
    }

    const fetchUsernameAvailability = await handleFetchResult(await getUsernameAvailability(state.config.apiUrl, newUsername))

    switch (fetchUsernameAvailability.apiResponse.status) {
      case 200:
        this.setState({
          isUsernameValid: fetchUsernameAvailability.body.available,
          usernameInvalidMsg: props.t('This username is not available')
        })
        break
      default:
        this.sendGlobalFlashMsg(props.t('Error while checking username availability'))
        break
    }
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
            loggedUserId={state.loggedUser.userId}
            emailNotifActivated={state.config.system.config.email_notification_activated}
            onClickToggleUserBtn={this.handleToggleUser}
            onChangeProfile={this.handleUpdateProfile}
            onClickAddUser={this.handleClickAddUser}
            onChangeUsername={this.handleChangeUsername}
            breadcrumbsList={state.breadcrumbsList}
            isUsernameValid={state.isUsernameValid}
            usernameInvalidMsg={state.usernameInvalidMsg}
            isEmailRequired={state.config.system.config.email_required}
          />
        )}

        {state.popupDeleteWorkspaceDisplay && (
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
        )}
      </div>
    )
  }
}

export default translate()(TracimComponent(Radium(AdminWorkspaceUser)))
