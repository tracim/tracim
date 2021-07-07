import React from 'react'
import WorkspaceAdvancedConfiguration from '../component/WorkspaceAdvancedConfiguration.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  handleLinksBeforeSave,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedContent,
  PopinFixedRightPart,
  CUSTOM_EVENT,
  removeAtInUsername,
  getWorkspaceDetail,
  deleteWorkspace,
  getMyselfKnownMember,
  PAGE,
  SPACE_TYPE,
  PopinFixedRightPartContent,
  ROLE,
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange,
  TagList
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import {
  getSubscriptionRequestList,
  getWorkspaceMember,
  putLabel,
  putDefaultRole,
  putDescription,
  putAgendaEnabled,
  putDownloadEnabled,
  putSubscriptionAccept,
  putSubscriptionReject,
  putUploadEnabled,
  putMemberRole,
  deleteMember,
  postWorkspaceMember,
  getAppList,
  putPublicationEnabled
} from '../action.async.js'
import Radium from 'radium'
import WorkspaceMembersList from '../component/WorkspaceMembersList.jsx'
import OptionalFeatures from '../component/OptionalFeatures.jsx'
import SpaceSubscriptionsRequests from '../component/SpaceSubscriptionsRequests.jsx'

const WORKSPACE_DESCRIPTION_TEXTAREA_ID = 'workspace_advanced__description__text__textarea'

export class WorkspaceAdvanced extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'workspace_advanced',
      autoCompleteCursorPosition: 0,
      autoCompleteItemList: [],
      isAutoCompleteActivated: false,
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      displayFormNewMember: false,
      newMember: {
        id: '',
        personalData: '',
        publicName: '',
        role: '',
        avatarUrl: '',
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      autoCompleteClicked: false,
      searchedKnownMemberList: [],
      displayPopupValidateDeleteWorkspace: false,
      subscriptionRequestList: []
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(this.state.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), handler: this.handleReloadContent },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.CREATED, handler: this.handleSubscriptionCreated },
      { entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION, coreEntityType: TLM_CET.MODIFIED, handler: this.handleSubscriptionModified }
    ])
  }

  // Custom Event Handlers
  handleShowApp = data => {
    console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerShowApp(data.content, this.state.content, this.setState.bind(this), () => { })
  }

  handleHideApp = data => {
    console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleReloadContent = data => {
    console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), data)
    this.setState(prev => ({ content: { ...prev.content, ...data }, isVisible: true }))
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
  }

  // TLM Handlers
  handleWorkspaceModified = (data) => {
    if (data.fields.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: { ...prev.content, ...data.fields.workspace }
    }))
  }

  handleMemberCreated = data => {
    if (data.fields.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: [...prev.content.memberList, {
          user_id: data.fields.user.user_id,
          user: data.fields.user,
          workspace_id: data.fields.workspace.workspace_id,
          workspace: data.fields.workspace,
          do_notify: data.fields.member.do_notify,
          is_active: data.fields.user.is_active,
          role: data.fields.member.role
        }]
      }
    }))
  }

  handleMemberModified = data => {
    if (data.fields.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: prev.content.memberList.map(m => m.user_id === data.fields.user.user_id
          ? {
            user_id: data.fields.user.user_id,
            user: data.fields.user,
            workspace_id: data.fields.workspace.workspace_id,
            workspace: data.fields.workspace,
            do_notify: data.fields.member.do_notify,
            is_active: data.fields.user.is_active,
            role: data.fields.member.role
          }
          : m
        )
      }
    }))
  }

  handleMemberDeleted = data => {
    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: prev.content.memberList.filter(m => m.user_id !== data.fields.user.user_id)
      }
    }))
  }

  handleUserModified = data => {
    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: prev.content.memberList.map(m => m.user_id === data.fields.user.user_id
          ? {
            ...m,
            user: data.fields.user,
            is_active: data.fields.user.is_active
          }
          : m
        )
      }
    }))
  }

  handleSubscriptionCreated = data => {
    if (this.state.subscriptionRequestList.some(request =>
      request.author.user_id === data.fields.subscription.author.user_id
    )) return

    this.setState(prev => ({
      subscriptionRequestList: [
        ...prev.subscriptionRequestList,
        data.fields.subscription
      ]
    }))
  }

  handleSubscriptionModified = data => {
    this.setState(prev => ({
      subscriptionRequestList: prev.subscriptionRequestList.map(request =>
        request.author.user_id === data.fields.subscription.author.user_id
          ? data.fields.subscription
          : request
      )
    }))
  }

  componentDidMount () {
    console.log('%c<WorkspaceAdvanced> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
    if (this.state.loggedUser.userRoleIdInWorkspace > ROLE.contentManager.id) {
      this.loadSubscriptionRequestList()
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    // console.log('%c<WorkspaceAdvanced> did update', `color: ${state.config.hexcolor}`, prevState, state)
    if (prevState.content && state.content && prevState.content.workspace_id !== state.content.workspace_id) {
      this.loadContent()
    }
  }

  componentWillUnmount () {
    console.log('%c<WorkspaceAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  sendGlobalFlashMessage = (msg, type = 'info') => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  loadContent = async () => {
    const { props, state } = this

    const fetchWorkspaceDetail = handleFetchResult(await getWorkspaceDetail(state.config.apiUrl, state.content.workspace_id))
    const fetchWorkspaceMember = handleFetchResult(await getWorkspaceMember(state.config.apiUrl, state.content.workspace_id, false))
    const fetchAppList = handleFetchResult(await getAppList(state.config.apiUrl))

    const [resDetail, resMember, resAppList] = await Promise.all([fetchWorkspaceDetail, fetchWorkspaceMember, fetchAppList])

    if (resDetail.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading space details', 'warning'))
      resDetail.body = {}
    }
    if (resMember.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading members list', 'warning'))
      resMember.body = []
    }
    if (resAppList.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading app list', 'warning'))
      resAppList.body = []
    }

    this.setState({
      content: {
        ...resDetail.body,
        memberList: resMember.body,
        appAgendaAvailable: resAppList.body.some(a => a.slug === 'agenda'),
        appDownloadAvailable: resAppList.body.some(a => a.slug === 'share_content'),
        appUploadAvailable: resAppList.body.some(a => a.slug === 'upload_permission')
      }
    })
  }

  loadSubscriptionRequestList = async () => {
    const { props, state } = this

    const fetchSubscriptionRequestList = await handleFetchResult(await getSubscriptionRequestList(state.config.apiUrl, state.content.workspace_id))

    switch (fetchSubscriptionRequestList.apiResponse.status) {
      case 200: this.setState({ subscriptionRequestList: fetchSubscriptionRequestList.body.reverse() }); break
      default: this.sendGlobalFlashMessage(props.t('Error while loading space requests', 'warning'))
    }
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleSaveEditLabel = async newLabel => {
    const { props, state } = this
    const fetchPutWorkspaceLabel = await handleFetchResult(await putLabel(state.config.apiUrl, state.content, newLabel))

    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new space label', 'warning'))
    }
  }

  handleClickToggleFormNewMember = () => this.setState(prev => ({ displayFormNewMember: !prev.displayFormNewMember }))

  handleChangeDescription = e => {
    const newDescription = e.target.value
    this.setState(prev => ({ content: { ...prev.content, description: newDescription } }))
  }

  handleClickValidateNewDescription = async () => {
    const { props, state } = this
    let newDescription
    try {
      newDescription = handleLinksBeforeSave(tinymce.get(WORKSPACE_DESCRIPTION_TEXTAREA_ID).getContent())
      // RJ - NOTE - 2021-06-24
      // We are using tinymce's getContent() method and not
      // state.content.description here because it has an outdated
      // value after autocompleting a content.
      // This is also what does appContentFactory after saving a new advanced comment
      // (see saveCommentAsText in appContentFactory.js)
      // We might want to look into it later
    } catch (e) {
      return Promise.reject(e.message || props.t('Error while saving the new version'))
    }

    const fetchPutDescription = await handleFetchResult(await putDescription(state.config.apiUrl, state.content, newDescription))

    switch (fetchPutDescription.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving the new description', 'warning'))
    }
  }

  handleChangeNewDefaultRole = newDefaultRole => {
    this.setState(prev => ({ content: { ...prev.content, default_user_role: newDefaultRole } }))
  }

  handleClickValidateNewDefaultRole = async () => {
    const { props, state } = this
    const fetchPutDefaultRole = await handleFetchResult(
      await putDefaultRole(state.config.apiUrl, state.content, state.content.default_user_role)
    )

    switch (fetchPutDefaultRole.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new default role', 'warning'))
    }
  }

  handleClickNewRole = async (memberId, slugNewRole) => {
    const { props, state } = this
    const fetchPutUserRole = await handleFetchResult(await putMemberRole(state.config.apiUrl, state.content.workspace_id, memberId, slugNewRole))

    switch (fetchPutUserRole.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new role for member', 'warning'))
    }
  }

  handleToggleAgendaEnabled = async () => {
    const { props, state } = this
    const newAgendaEnabledValue = !state.content.agenda_enabled

    const fetchToggleAgendaEnabled = await handleFetchResult(await putAgendaEnabled(state.config.apiUrl, state.content, newAgendaEnabledValue))

    switch (fetchToggleAgendaEnabled.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(
          newAgendaEnabledValue ? props.t('Agenda activated') : props.t('Agenda deactivated'),
          'info'
        )
        break
      default:
        this.sendGlobalFlashMessage(
          newAgendaEnabledValue
            ? props.t('Error while activating agenda')
            : props.t('Error while deactivating agenda'),
          'warning'
        )
    }
  }

  handleToggleUploadEnabled = async () => {
    const { props, state } = this
    const newUploadEnabledValue = !state.content.public_upload_enabled

    const fetchToggleUploadEnabled = await handleFetchResult(await putUploadEnabled(state.config.apiUrl, state.content, newUploadEnabledValue))

    switch (fetchToggleUploadEnabled.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(
          newUploadEnabledValue ? props.t('Upload activated') : props.t('Upload deactivated'),
          'info'
        )
        break
      default:
        this.sendGlobalFlashMessage(
          newUploadEnabledValue
            ? props.t('Error while activating upload')
            : props.t('Error while deactivating upload'),
          'warning'
        )
    }
  }

  handleToggleDownloadEnabled = async () => {
    const { props, state } = this
    const newDownloadEnabledValue = !state.content.public_download_enabled

    const fetchToggleDownloadEnabled = await handleFetchResult(await putDownloadEnabled(state.config.apiUrl, state.content, newDownloadEnabledValue))

    switch (fetchToggleDownloadEnabled.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(
          newDownloadEnabledValue ? props.t('Download activated') : props.t('Download deactivated'),
          'info'
        )
        break
      default:
        this.sendGlobalFlashMessage(
          newDownloadEnabledValue
            ? props.t('Error while activating download')
            : props.t('Error while deactivating download'),
          'warning'
        )
    }
  }

  handleTogglePublicationEnabled = async () => {
    const { props, state } = this
    const newPublicationEnabledValue = !state.content.publication_enabled

    const fetchTogglePublicationEnabled = await handleFetchResult(await putPublicationEnabled(state.config.apiUrl, state.content, newPublicationEnabledValue))

    switch (fetchTogglePublicationEnabled.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(
          newPublicationEnabledValue ? props.t('Publications activated') : props.t('Publications deactivated'),
          'info'
        )
        break
      default:
        this.sendGlobalFlashMessage(
          newPublicationEnabledValue
            ? props.t('Error while activating publications')
            : props.t('Error while deactivating publications'),
          'warning'
        )
    }
  }

  handleClickNewMemberRole = slugRole => this.setState(prev => ({ newMember: { ...prev.newMember, role: slugRole } }))

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangeNewMemberName = async newPersonalData => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        personalData: newPersonalData,
        publicName: newPersonalData,
        isEmail: this.isEmail(newPersonalData)
      },
      autoCompleteClicked: false
    }))

    const username = removeAtInUsername(newPersonalData)

    if (username.length >= 2) {
      await this.handleSearchUser(username)
      this.setState({ autoCompleteFormNewMemberActive: true })
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        personalData: knownMember.username,
        publicName: knownMember.public_name,
        avatarUrl: knownMember.avatar_url,
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      autoCompleteClicked: true
    }))
  }

  handleClickAutoComplete = () => this.setState({
    autoCompleteFormNewMemberActive: false,
    autoCompleteClicked: true
  })

  handleSearchUser = async userNameToSearch => {
    const { props, state } = this
    const fetchUserKnownMemberList = await handleFetchResult(await getMyselfKnownMember(state.config.apiUrl, userNameToSearch, null, state.content.workspace_id))
    switch (fetchUserKnownMemberList.apiResponse.status) {
      case 200: this.setState({ searchedKnownMemberList: fetchUserKnownMemberList.body }); break
      default: this.sendGlobalFlashMessage(props.t('Error while fetching known members list', 'warning'))
    }
  }

  handleClickDeleteMember = async userId => {
    const { props, state } = this
    const fetchDeleteMember = await deleteMember(state.config.apiUrl, state.content.workspace_id, userId)
    switch (fetchDeleteMember.status) {
      case 204:
        this.sendGlobalFlashMessage(props.t('Member removed', 'info'))
        break
      default: this.sendGlobalFlashMessage(props.t('Error while removing member'), 'warning')
    }
  }

  handleTinyMceInput = (e, position) => {
    tinymceAutoCompleteHandleInput(
      e,
      this.setState.bind(this),
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleTinyMceKeyUp = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceKeyDown = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyDown(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      state.autoCompleteCursorPosition,
      state.autoCompleteItemList,
      this.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceSelectionChange = () => {
    tinymceAutoCompleteHandleSelectionChange(
      this.setState.bind(this),
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.state.content.workspace_id)
  }

  handleClickValidateNewMember = async () => {
    const { props, state } = this

    if (state.newMember.personalData === '') {
      this.sendGlobalFlashMessage(props.t('Please set a name, an email or a username'), 'warning')
      return
    }

    if (state.newMember.role === '') {
      this.sendGlobalFlashMessage(props.t('Please set a role'), 'warning')
      return
    }

    const newMemberInKnownMemberList = state.searchedKnownMemberList.find(u => u.user_id === state.newMember.id)

    if (state.newMember.id === '' && newMemberInKnownMemberList) { // this is to force sending the id of the user to the api if he exists
      this.setState({ newMember: { ...state.newMember, id: newMemberInKnownMemberList.user_id } })
    }

    const fetchWorkspaceNewMember = await handleFetchResult(await postWorkspaceMember(state.config.apiUrl, state.content.workspace_id, {
      id: state.newMember.id || newMemberInKnownMemberList ? newMemberInKnownMemberList.user_id : null,
      email: state.newMember.isEmail ? state.newMember.personalData : '',
      username: state.newMember.isEmail ? '' : state.newMember.personalData,
      role: state.newMember.role
    }))

    this.setState({
      newMember: {
        id: '',
        personalData: '',
        publicName: '',
        role: '',
        avatarUrl: '',
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      displayFormNewMember: false
    })

    switch (fetchWorkspaceNewMember.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(props.t('Member added', 'info'))
        break
      case 400:
        switch (fetchWorkspaceNewMember.body.code) {
          case 2042: this.sendGlobalFlashMessage(props.t('This account is deactivated'), 'warning'); break
          case 1001: {
            const ErrorMsg = () => (
              <div>
                {props.t('Unknown user')}<br />
                {props.t('Note, only administrators can send invitational email')}
              </div>
            )
            this.sendGlobalFlashMessage(<ErrorMsg />, 'warning')
            break
          }
          case 3008: this.sendGlobalFlashMessage(props.t('This user already is in the space'), 'warning'); break
          default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the space'), 'warning')
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the space'), 'warning')
    }
  }

  handleClickAcceptRequest = async userId => {
    const { props, state } = this
    const fetchPutSubscriptionAccept = await handleFetchResult(await putSubscriptionAccept(
      state.config.apiUrl,
      state.content.workspace_id,
      userId,
      state.content.default_user_role
    ))
    switch (fetchPutSubscriptionAccept.status) {
      case 204: break
      case 400:
        switch (fetchPutSubscriptionAccept.body.code) {
          case 3008: this.sendGlobalFlashMessage(props.t('This user already is in the space'), 'warning'); break
          default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the space'), 'warning')
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the space'), 'warning')
    }
  }

  handleClickRejectRequest = async userId => {
    const { props, state } = this
    const fetchPutSubscriptionReject = await handleFetchResult(await putSubscriptionReject(
      state.config.apiUrl,
      state.content.workspace_id,
      userId
    ))
    if (fetchPutSubscriptionReject.status !== 204) {
      this.sendGlobalFlashMessage(props.t('Error while rejecting user'), 'warning')
    }
  }

  handleClickDeleteWorkspaceBtn = () => this.setState({ displayPopupValidateDeleteWorkspace: true })

  handleClickClosePopupDeleteWorkspace = () => this.setState({ displayPopupValidateDeleteWorkspace: false })

  handleClickValidateDeleteWorkspace = async () => {
    const { props, state } = this

    const fetchDeleteWorkspace = await deleteWorkspace(state.config.apiUrl, state.content.workspace_id)
    switch (fetchDeleteWorkspace.status) {
      case 204:
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REDIRECT, data: { url: PAGE.HOME } })
        this.handleClickBtnCloseApp()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while deleting space', 'warning'))
    }
  }

  getMenuItemList = () => {
    const { props, state } = this
    const memberlistObject = {
      id: 'members_list',
      label: props.t('Members List'),
      icon: 'fa-users',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Members List')}
          showTitle={!state.displayFormNewMember}
        >
          <WorkspaceMembersList
            displayFormNewMember={state.displayFormNewMember}
            memberList={state.content.memberList}
            roleList={state.config.roleList}
            apiUrl={props.data.config.apiUrl}
            onClickNewRole={this.handleClickNewRole}
            loggedUser={state.loggedUser}
            onClickDeleteMember={this.handleClickDeleteMember}
            onClickToggleFormNewMember={this.handleClickToggleFormNewMember}
            newMemberName={state.newMember.publicName}
            isEmail={state.newMember.isEmail}
            onChangeNewMemberName={this.handleChangeNewMemberName}
            searchedKnownMemberList={state.searchedKnownMemberList}
            onClickKnownMember={this.handleClickKnownMember}
            newMemberRole={state.newMember.role}
            onClickNewMemberRole={this.handleClickNewMemberRole}
            onClickValidateNewMember={this.handleClickValidateNewMember}
            autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
            emailNotifActivated={state.config.system.config.email_notification_activated}
            canSendInviteNewUser={
              [state.config.profileObject.administrator.slug, state.config.profileObject.manager.slug].includes(state.loggedUser.profile)
            }
            userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
            autoCompleteClicked={state.autoCompleteClicked}
            onClickAutoComplete={this.handleClickAutoComplete}
          />
        </PopinFixedRightPartContent>
      )
    }
    const subscriptionObject = {
      id: 'subscriptions_requests',
      label: props.t('Requests to join the space'),
      icon: 'fas fa-sign-in-alt',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Requests to join the space')}
        >
          <SpaceSubscriptionsRequests
            apiUrl={state.config.apiUrl}
            subscriptionRequestList={state.subscriptionRequestList}
            onClickAcceptRequest={this.handleClickAcceptRequest}
            onClickRejectRequest={this.handleClickRejectRequest}
          />
        </PopinFixedRightPartContent>
      )
    }
    const functionalitesObject = {
      id: 'optional_functionalities',
      label: props.t('Optional Functionalities'),
      icon: 'fa-cog',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Optional Functionalities')}
        >
          <OptionalFeatures
            appAgendaAvailable={state.content.appAgendaAvailable}
            agendaEnabled={state.content.agenda_enabled}
            onToggleAgendaEnabled={this.handleToggleAgendaEnabled}
            downloadEnabled={state.content.public_download_enabled}
            appDownloadAvailable={state.content.appDownloadAvailable}
            onToggleDownloadEnabled={this.handleToggleDownloadEnabled}
            uploadEnabled={state.content.public_upload_enabled}
            appUploadAvailable={state.content.appUploadAvailable}
            onToggleUploadEnabled={this.handleToggleUploadEnabled}
            publicationEnabled={state.content.publication_enabled}
            onTogglePublicationEnabled={this.handleTogglePublicationEnabled}
          />
        </PopinFixedRightPartContent>
      )
    }
    const tagList = {
      id: 'tag',
      label: props.t('Tags'),
      icon: 'fas fa-tag',
      children: (
        <TagList
          apiUrl={state.config.apiUrl}
          workspaceId={state.content.workspace_id}
          contentId={state.content.content_id}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
        />
      )
    }

    const menuItemList = [memberlistObject]
    const isWorkspaceManager = state.loggedUser.userRoleIdInWorkspace > ROLE.contentManager.id
    if (state.content.access_type === SPACE_TYPE.onRequest.slug && isWorkspaceManager) {
      menuItemList.push(subscriptionObject)
    }

    if (isWorkspaceManager) {
      menuItemList.push(functionalitesObject)
    }

    menuItemList.push(tagList)

    return menuItemList
  }

  render () {
    const { state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          componentTitle={<div>{state.content.label}</div>}
          config={state.config}
          content={state.content}
          customClass={`${state.config.slug}__contentpage`}
          loggedUser={state.loggedUser}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
          disableChangeTitle={false}
          showChangeTitleButton={state.loggedUser.userRoleIdInWorkspace > ROLE.contentManager.id}
        >
          <WorkspaceAdvancedConfiguration
            apiUrl={state.config.apiUrl}
            isReadOnlyMode={state.loggedUser.userRoleIdInWorkspace < ROLE.workspaceManager.id}
            textareaId={WORKSPACE_DESCRIPTION_TEXTAREA_ID}
            autoCompleteCursorPosition={state.autoCompleteCursorPosition}
            autoCompleteItemList={state.autoCompleteItemList}
            customColor={state.config.hexcolor}
            description={state.content.description}
            defaultRole={state.content.default_user_role}
            displayPopupValidateDeleteWorkspace={state.displayPopupValidateDeleteWorkspace}
            isAutoCompleteActivated={state.isAutoCompleteActivated}
            onClickAutoCompleteItem={(item) => {
              tinymceAutoCompleteHandleClickItem(item, this.setState.bind(this))
            }}
            onClickValidateNewDescription={this.handleClickValidateNewDescription}
            onClickClosePopupDeleteWorkspace={this.handleClickClosePopupDeleteWorkspace}
            onClickDeleteWorkspaceBtn={this.handleClickDeleteWorkspaceBtn}
            onClickValidateNewDefaultRole={this.handleClickValidateNewDefaultRole}
            onClickValidatePopupDeleteWorkspace={this.handleClickValidateDeleteWorkspace}
            onChangeDescription={this.handleChangeDescription}
            onChangeNewDefaultRole={this.handleChangeNewDefaultRole}
            key='workspace_advanced'
            onTinyMceInput={this.handleTinyMceInput}
            onTinyMceKeyDown={this.handleTinyMceKeyDown}
            onTinyMceKeyUp={this.handleTinyMceKeyUp}
            onTinyMceSelectionChange={this.handleTinyMceSelectionChange}
          />

          <PopinFixedRightPart
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            menuItemList={this.getMenuItemList()}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Radium(appContentFactory(TracimComponent(WorkspaceAdvanced))))
