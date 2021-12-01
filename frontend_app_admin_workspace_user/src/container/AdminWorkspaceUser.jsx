import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import debounce from 'lodash/debounce'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  ConfirmPopup,
  BREADCRUMBS_TYPE,
  handleFetchResult,
  ROLE,
  CUSTOM_EVENT,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent,
  checkUsernameValidity,
  deleteWorkspace,
  sendGlobalFlashMessage,
  ALLOWED_CHARACTERS_USERNAME,
  MINIMUM_CHARACTERS_USERNAME,
  MAXIMUM_CHARACTERS_USERNAME,
  CHECK_USERNAME_DEBOUNCE_WAIT,
  PAGE
} from 'tracim_frontend_lib'
import {
  debug,
  MINIMUM_CHARACTERS_PUBLIC_NAME
} from '../helper.js'
import {
  getUserDetail,
  getUserList,
  getWorkspaceList,
  postAddUser,
  putMyselfProfile,
  putUserDisable,
  putUserEnable,
  putUserProfile
} from '../action.async.js'
import AdminWorkspace from '../component/AdminWorkspace.jsx'
import AdminUser from '../component/AdminUser.jsx'

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
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.CREATED, handler: this.handleSpaceCreated },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleSpaceModified },
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.DELETED, handler: this.handleSpaceDeleted },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleSpaceMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleSpaceMemberDeleted },
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
      this.setHeadTitle(props.t('Space management'))
    } else if (this.state.config.type === 'user') {
      this.setHeadTitle(props.t('User account management'))
    }
    this.buildBreadcrumbs()
  }

  refreshAll = async () => {
    this.updateTitleAndBreadcrumbs()
    if (this.state.config.type === 'workspace') {
      await this.loadSpaceContent()
    } else if (this.state.config.type === 'user') {
      await this.loadUserContent()
    }
  }

  async componentDidMount () {
    console.log('%c<AdminWorkspaceUser> did mount', `color: ${this.state.config.hexcolor}`)
    await this.refreshAll()
  }

  componentWillUnmount () {
    this.handleChangeUsername.cancel()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    // console.log('%c<AdminWorkspaceUser> did update', `color: ${state.config.hexcolor}`)
    if (prevState.config.type !== state.config.type) {
      await this.refreshAll()
    }
  }

  setHeadTitle = (title) => {
    const { state } = this

    if (state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: title }
      })
    }
  }

  loadSpaceContent = async () => {
    const { props, state } = this
    const fetchSpaceList = await handleFetchResult(await getWorkspaceList(state.config.apiUrl))

    switch (fetchSpaceList.apiResponse.status) {
      case 200: {
        const workspaceList = fetchSpaceList.body

        this.setState(prev => ({
          content: {
            ...prev.content,
            workspaceList
          }
        }))
        break
      }
      default: sendGlobalFlashMessage(props.t('Error while loading spaces list'))
    }
  }

  getDetailedUser = async (user) => {
    const fetchUserDetail = await handleFetchResult(await getUserDetail(this.state.config.apiUrl, user.user_id))

    if (!fetchUserDetail.apiResponse.ok) {
      sendGlobalFlashMessage(this.props.t('Error while loading users list'))
      return null
    }

    return fetchUserDetail.body
  }

  loadUserContent = async () => {
    const { state } = this
    const fetchUserList = await handleFetchResult(await getUserList(state.config.apiUrl))

    switch (fetchUserList.apiResponse.status) {
      case 200: {
        const userList = fetchUserList.body

        this.setState(prev => ({
          content: {
            ...prev.content,
            userList
          }
        }))
        break
      }
      default: sendGlobalFlashMessage(this.props.t('Error while loading users list'))
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = []

    let pageUrl = null
    let label = null
    if (state.config.type === 'workspace') {
      pageUrl = PAGE.ADMIN.WORKSPACE
      label = props.t('Space management')
    } else if (state.config.type === 'user') {
      pageUrl = PAGE.ADMIN.USER
      label = props.t('User account management')
    }
    breadcrumbsList.push({
      link: pageUrl,
      type: BREADCRUMBS_TYPE.CORE,
      label: label,
      isALink: true
    })

    this.setState({ breadcrumbsList: breadcrumbsList })
  }

  handleDeleteSpace = async () => {
    const { props, state } = this

    const deleteSpaceResponse = await handleFetchResult(await deleteWorkspace(state.config.apiUrl, state.workspaceToDelete))
    if (deleteSpaceResponse.status !== 204) {
      sendGlobalFlashMessage(props.t('Error while deleting space'))
    }
    this.handleClosePopupDeleteSpace()
  }

  handleOpenPopupDeleteSpace = workspaceId => this.setState({
    popupDeleteWorkspaceDisplay: true,
    workspaceToDelete: workspaceId
  })

  handleClosePopupDeleteSpace = () => this.setState({ popupDeleteWorkspaceDisplay: false })

  handleSpaceCreated = (message) => {
    const { state } = this
    const workspace = message.fields.workspace
    const newSpaceList = state.content.workspaceList.slice()
    /* INFO SG 2020-06-15:
     *  - the list is ordered by id and a newly created workspace has a greater id than all others.
     *  - initialize member list as empty since the space member created message will handle
     *    adding the initial user.
     */
    newSpaceList.push({ ...workspace })

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newSpaceList
      }
    }))
  }

  handleSpaceModified = (message) => {
    const { state } = this

    const workspace = message.fields.workspace
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${workspace.workspace_id} not found`)
      return
    }

    const newSpaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      workspace,
      ...workspaceList.slice(workspaceIndex + 1)
    ]

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newSpaceList
      }
    }))
  }

  handleSpaceDeleted = (message) => {
    const { state } = this

    const workspace = message.fields.workspace
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${workspace.workspace_id} not found`)
      return
    }

    const newSpaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      ...workspaceList.slice(workspaceIndex + 1)
    ]

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newSpaceList
      }
    }))
  }

  handleSpaceMemberCreated = (message) => {
    const { state } = this

    const workspace = message.fields.workspace
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === workspace.workspace_id)

    if (workspaceIndex === -1) {
      // We do not have this workspace in our list...
      console.log(`<AdminWorkspaceUser>: workspace id ${workspace.workspace_id} not found`)
      return
    }

    const newSpaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      workspace,
      ...workspaceList.slice(workspaceIndex + 1)
    ]

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newSpaceList
      }
    }))
  }

  handleSpaceMemberDeleted = (message) => {
    const { state } = this

    const workspace = message.fields.workspace
    const workspaceList = state.content.workspaceList
    const workspaceIndex = workspaceList.findIndex(ws => ws.workspace_id === workspace.workspace_id)

    if (workspaceIndex === -1) {
      console.log(`<AdminWorkspaceUser>: workspace id ${workspace.workspace_id} not found`)
      // We do not have this workspace in our list...
      return
    }

    const newSpaceList = [
      ...workspaceList.slice(0, workspaceIndex),
      workspace,
      ...workspaceList.slice(workspaceIndex + 1)
    ]

    this.setState(prev => ({
      content: {
        ...prev.content,
        workspaceList: newSpaceList
      }
    }))
  }

  handleToggleUser = async (userId, toggle) => {
    const { props, state } = this

    const activateOrDelete = toggle ? putUserEnable : putUserDisable

    const toggleUser = await handleFetchResult(await activateOrDelete(state.config.apiUrl, userId))

    if (toggleUser.status !== 204) {
      sendGlobalFlashMessage(props.t('Error while enabling or disabling user'))
    }
  }

  handleUpdateProfile = async (userId, newProfile) => {
    const { props, state } = this

    const endPoint = userId === state.loggedUser.userId ? putMyselfProfile : putUserProfile
    const toggleManager = await handleFetchResult(await endPoint(state.config.apiUrl, userId, newProfile))
    if (toggleManager.status !== 204) {
      sendGlobalFlashMessage(props.t('Error while saving new profile'))
    }
  }

  handleClickAddUser = async (name, username, email, profile, password) => {
    const { props, state } = this

    if (name.length < MINIMUM_CHARACTERS_PUBLIC_NAME) {
      sendGlobalFlashMessage(
        props.t('Full name must be at least {{minimumCharactersPublicName}} characters', { minimumCharactersPublicName: MINIMUM_CHARACTERS_PUBLIC_NAME })
      )
      return -1
    }

    if (!state.config.system.config.email_notification_activated || password !== '') {
      if (password === '') {
        sendGlobalFlashMessage(props.t('Please set a password'))
        return -2
      }

      if (password.length < 6) {
        sendGlobalFlashMessage(props.t('New password is too short (minimum 6 characters)'))
        return -3
      }

      if (password.length > 512) {
        sendGlobalFlashMessage(props.t('New password is too long (maximum 512 characters)'))
        return -4
      }
    }

    const newUserResult = await handleFetchResult(
      await postAddUser(state.config.apiUrl, name, username, email, profile, state.config.system.config.email_notification_activated, password)
    )

    switch (newUserResult.apiResponse.status) {
      case 200:
        sendGlobalFlashMessage(
          state.config.system.config.email_notification_activated
            ? props.t('User created and email sent')
            : props.t('User created'),
          'info'
        )
        return newUserResult.body.user_id
      case 400:
        switch (newUserResult.body.code) {
          case 2001:
            if (newUserResult.body.details.email) sendGlobalFlashMessage(props.t('Error, invalid email address'))
            if (newUserResult.body.details.username) sendGlobalFlashMessage(props.t('Username must be between {{minimumCharactersUsername}} and {{maximumCharactersUsername}} characters long', { minimumCharactersUsername: MINIMUM_CHARACTERS_USERNAME, maximumCharactersUsername: MAXIMUM_CHARACTERS_USERNAME }))
            else sendGlobalFlashMessage(props.t('Error while saving new user'))
            break
          case 2062:
            sendGlobalFlashMessage(
              props.t('Your username is incorrect, the allowed characters are {{allowedCharactersUsername}}', { allowedCharactersUsername: ALLOWED_CHARACTERS_USERNAME })
            )
            break
          case 2036: sendGlobalFlashMessage(props.t('Email already exists')); break
          default: sendGlobalFlashMessage(props.t('Error while saving new user'))
        }
        return -5
      default:
        sendGlobalFlashMessage(props.t('Error while saving new user'))
        return -6
    }
  }

  handleClickCreateUserAndAddToSpaces = async (publicName, username, email, profile, password) => {
    const userId = await this.handleClickAddUser(publicName, username, email, profile, password)
    if (userId > 0) this.state.config.history.push(PAGE.ADMIN.USER_EDIT(userId), 'spacesConfig')
  }

  handleUserCreated = async (message) => {
    const detailedUser = await this.getDetailedUser(message.fields.user)
    if (!detailedUser) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: [...prev.content.userList, detailedUser]
      }
    }))
  }

  handleUserModified = async (message) => {
    const tlmUser = message.fields.user
    const detailedUser = await this.getDetailedUser(tlmUser)
    if (!detailedUser) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: prev.content.userList.map(u => u.user_id === tlmUser.user_id ? detailedUser : u)
      }
    }))
  }

  handleUserDeleted = (message) => {
    const tlmUser = message.fields.user
    this.setState(prev => ({
      content: {
        ...prev.content,
        userList: prev.content.userList.filter(u => u.user_id !== tlmUser.user_id)
      }
    }))
  }

  handleClickSpace = workspaceId => {
    const { state } = this
    if (state.workspaceIdOpened === null) {
      GLOBAL_renderAppFeature({
        loggedUser: {
          ...state.loggedUser,
          userRoleIdInWorkspace: ROLE.workspaceManager.id // only global admin can see this app, he is workspace manager of any workspace. So, force userRoleIdInWorkspace to 8
        },
        config: {
          history: state.config.history,
          label: 'Advanced dashboard',
          slug: 'workspace_advanced',
          faIcon: 'fas fa-users',
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

  handleClickNewSpace = () => {
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.SHOW_CREATE_WORKSPACE_POPUP, data: {} })
  }

  changeUsername = async (newUsername) => {
    if (!newUsername) {
      this.setState({ isUsernameValid: true, usernameInvalidMsg: '' })
      return
    }

    const { props, state } = this
    try {
      this.setState(await checkUsernameValidity(state.config.apiUrl, newUsername, props))
    } catch (errorWhileChecking) {
      sendGlobalFlashMessage(errorWhileChecking.message)
    }
  }

  handleChangeUsername = debounce(this.changeUsername, CHECK_USERNAME_DEBOUNCE_WAIT)

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    return (
      <div>
        {state.config.type === 'workspace' && (
          <AdminWorkspace
            workspaceList={state.content.workspaceList}
            onClickWorkspace={this.handleClickSpace}
            onClickNewWorkspace={this.handleClickNewSpace}
            onClickDeleteWorkspace={this.handleOpenPopupDeleteSpace}
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
            onClickCreateUserAndAddToSpaces={this.handleClickCreateUserAndAddToSpaces}
            onChangeUsername={this.handleChangeUsername}
            breadcrumbsList={state.breadcrumbsList}
            isUsernameValid={state.isUsernameValid}
            usernameInvalidMsg={state.usernameInvalidMsg}
            isEmailRequired={state.config.system.config.email_required}
          />
        )}

        {state.popupDeleteWorkspaceDisplay && (
          <ConfirmPopup
            onCancel={this.handleClosePopupDeleteSpace}
            onConfirm={this.handleDeleteSpace}
            confirmLabel={props.t('Delete')}
            confirmIcon='far fa-fw fa-trash-alt'
          />
        )}
      </div>
    )
  }
}

export default translate()(TracimComponent(Radium(AdminWorkspaceUser)))
