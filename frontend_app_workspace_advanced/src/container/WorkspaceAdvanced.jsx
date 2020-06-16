import React from 'react'
import WorkspaceAdvancedConfiguration from '../component/WorkspaceAdvancedConfiguration.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  PopinFixedRightPart,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import {
  getWorkspaceDetail,
  getWorkspaceMember,
  putLabel,
  putDescription,
  putAgendaEnabled,
  putDownloadEnabled,
  putUploadEnabled,
  putMemberRole,
  deleteMember,
  getMyselfKnownMember,
  postWorkspaceMember,
  deleteWorkspace,
  getAppList
} from '../action.async.js'
import Radium from 'radium'
import WorkspaceMembersList from '../component/WorkspaceMembersList.jsx'
import OptionalFeatures from '../component/OptionalFeatures.jsx'

class WorkspaceAdvanced extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'workspace_advanced',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      displayFormNewMember: false,
      newMember: {
        id: '',
        personalData: '',
        role: '',
        avatarUrl: '',
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      autoCompleteClicked: false,
      searchedKnownMemberList: [],
      displayPopupValidateDeleteWorkspace: false
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)

    // props.registerCustomEventHandlerList([
    //   { name: CUSTOM_EVENT.REFRESH_DASHBOARD_MEMBER_LIST, handler: this.handleRefreshDashboardMemberList },
    //   { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    // ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleMemberCreated },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.DELETED, handler: this.handleMemberDeleted }
    ])
  }

  customEventReducer = ({ detail: { type, data } }) => {
    const { props, state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
        break

      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
        break

      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({ content: { ...prev.content, ...data }, isVisible: true }))
        break

      case CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug):
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, () => {}, () => {})
        break

      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
        this.loadContent()
        break
    }
  }

  handleWorkspaceModified = (data) => {
    if (data.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: { ...prev.content, ...data.workspace }
    }))
  }

  handleMemberCreated = data => {
    if (data.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: [...prev.content.memberList, {
          user_id: data.user.user_id,
          user: data.user,
          workspace_id: data.workspace.workspace_id,
          workspace: data.workspace,
          do_notify: data.member.do_notify,
          is_active: data.user.is_active,
          role: data.member.role
        }]
      }
    }))
  }

  handleMemberModified = data => {
    if (data.workspace.workspace_id !== this.state.content.workspace_id) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        memberList: prev.content.memberList.map(m => m.user_id === data.user.user_id
          ? {
            user_id: data.user.user_id,
            user: data.user,
            workspace_id: data.workspace.workspace_id,
            workspace: data.workspace,
            do_notify: data.member.do_notify,
            is_active: data.user.is_active,
            role: data.member.role
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
        memberList: prev.content.memberList.filter(m => m.user_id !== data.user.user_id)
      }
    }))
  }

  componentDidMount () {
    console.log('%c<WorkspaceAdvanced> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
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
      this.sendGlobalFlashMessage(props.t('Error while loading shared space details', 'warning'))
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

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleSaveEditLabel = async newLabel => {
    const { props, state } = this
    const fetchPutWorkspaceLabel = await handleFetchResult(await putLabel(state.config.apiUrl, state.content, newLabel))

    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new shared space label', 'warning'))
    }
  }

  handleClickToggleFormNewMember = () => this.setState(prev => ({ displayFormNewMember: !prev.displayFormNewMember }))

  handleChangeDescription = e => {
    const newDescription = e.target.value
    this.setState(prev => ({ content: { ...prev.content, description: newDescription } }))
  }

  handleClickValidateNewDescription = async () => {
    const { props, state } = this
    const fetchPutDescription = await handleFetchResult(await putDescription(state.config.apiUrl, state.content, state.content.description))

    switch (fetchPutDescription.apiResponse.status) {
      case 200: this.sendGlobalFlashMessage(props.t('Save successful', 'info')); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new description', 'warning'))
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

  handleClickNewMemberRole = slugRole => this.setState(prev => ({ newMember: { ...prev.newMember, role: slugRole } }))

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangeNewMemberName = async newPersonalData => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        personalData: newPersonalData,
        isEmail: this.isEmail(newPersonalData)
      },
      autoCompleteClicked: false
    }))

    if (newPersonalData.length >= 2) {
      await this.handleSearchUser(newPersonalData)
      this.setState({ autoCompleteFormNewMemberActive: true })
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        personalData: knownMember.username,
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
    const fetchUserKnownMemberList = await handleFetchResult(await getMyselfKnownMember(state.config.apiUrl, userNameToSearch, state.content.workspace_id))
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
          case 3008: this.sendGlobalFlashMessage(props.t('This user already is in the shared space'), 'warning'); break
          default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the shared space'), 'warning')
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the shared space', 'warning'))
    }
  }

  handleClickDeleteWorkspaceBtn = () => this.setState({ displayPopupValidateDeleteWorkspace: true })

  handleClickClosePopupDeleteWorkspace = () => this.setState({ displayPopupValidateDeleteWorkspace: false })

  handleClickValidateDeleteWorkspace = async () => {
    const { props, state } = this

    const fetchDeleteWorkspace = await deleteWorkspace(state.config.apiUrl, state.content.workspace_id)
    switch (fetchDeleteWorkspace.status) {
      case 204:
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_WORKSPACE_LIST_THEN_REDIRECT, data: { url: '/ui' } })
        // GLOBAL_dispatchEvent({type: 'refreshWorkspaceList', data: {}})
        this.handleClickBtnCloseApp()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while deleting shared space', 'warning'))
    }
  }

  render () {
    const { state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedHeader
          customClass={`${state.config.slug}`}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditLabel}
        />

        <PopinFixedOption
          customColor={state.config.hexcolor}
          customClass={`${state.config.slug}`}
          i18n={i18n}
          display={false}
        />

        <PopinFixedContent
          customClass={`${state.config.slug}__contentpage`}
        >
          <WorkspaceAdvancedConfiguration
            customColor={state.config.hexcolor}
            description={state.content.description}
            displayPopupValidateDeleteWorkspace={state.displayPopupValidateDeleteWorkspace}
            onClickValidateNewDescription={this.handleClickValidateNewDescription}
            onClickClosePopupDeleteWorkspace={this.handleClickClosePopupDeleteWorkspace}
            onClickDeleteWorkspaceBtn={this.handleClickDeleteWorkspaceBtn}
            onClickValidatePopupDeleteWorkspace={this.handleClickValidateDeleteWorkspace}
            onChangeDescription={this.handleChangeDescription}
            key='workspace_advanced'
          />

          <PopinFixedRightPart
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            menuItemList={[
              {
                id: 'members_list',
                label: this.props.t('Members List'),
                icon: 'fa-users',
                children: (
                  <WorkspaceMembersList
                    displayFormNewMember={state.displayFormNewMember}
                    memberList={state.content.memberList}
                    roleList={state.config.roleList}
                    onClickNewRole={this.handleClickNewRole}
                    loggedUser={state.loggedUser}
                    onClickDeleteMember={this.handleClickDeleteMember}
                    onClickToggleFormNewMember={this.handleClickToggleFormNewMember}
                    newMemberName={state.newMember.personalData}
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
                )
              },
              {
                id: 'optional_functionalities',
                label: this.props.t('Optional Functionalities'),
                icon: 'fa-cog',
                children: (
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
                  />
                )
              }
            ]}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Radium(appContentFactory(TracimComponent(WorkspaceAdvanced))))
