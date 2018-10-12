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
  getWorkspaceDetail,
  getWorkspaceMember,
  putLabel,
  putDescription,
  putMemberRole,
  deleteMember,
  getUserKnownMember,
  postWorkspaceMember,
  deleteWorkspace
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
      content: props.data ? props.data.content : debug.content,
      displayFormNewMember: false,
      newMember: {
        id: '',
        name: '',
        role: '',
        avatarUrl: ''
      },
      autoCompleteFormNewMemberActive: true,
      searchedKnownMemberList: [],
      displayPopupValidateDeleteWorkspace: false
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
      case 'workspace_advanced_reloadContent':
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
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

    if (prevState.content && state.content && prevState.content.workspace_id !== state.content.workspace_id) {
      this.loadContent()
    }
  }

  componentWillUnmount () {
    console.log('%c<WorkspaceAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  sendGlobalFlashMessage = (msg, type = 'info') => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  loadContent = async () => {
    const { props, state } = this

    const fetchWorkspaceDetail = handleFetchResult(await getWorkspaceDetail(state.config.apiUrl, state.content.workspace_id))
    const fetchWorkspaceMember = handleFetchResult(await getWorkspaceMember(state.config.apiUrl, state.content.workspace_id))

    const [resDetail, resMember] = await Promise.all([fetchWorkspaceDetail, fetchWorkspaceMember])

    if (resDetail.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading shared space details', 'warning'))
      resDetail.body = {}
    }

    if (resMember.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading members list', 'warning'))
      resMember.body = []
    }

    this.setState({
      content: {
        ...resDetail.body,
        memberList: resMember.body.map(m => ({
          ...m,
          user: {
            ...m.user,
            avatar_url: m.user.avatar_url ? m.user.avatar_url : generateAvatarFromPublicName(m.user.public_name)
          }
        }))
      }
    })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditLabel = async newLabel => {
    const { props, state } = this
    const fetchPutWorkspaceLabel = await handleFetchResult(await putLabel(state.config.apiUrl, state.content.workspace_id, newLabel, state.content.description))
    switch (fetchPutWorkspaceLabel.apiResponse.status) {
      case 200:
        this.setState(prev => ({content: {...prev.content, label: newLabel}}))
        GLOBAL_dispatchEvent({ type: 'refreshWorkspaceList', data: {} }) // for sidebar and dashboard and admin workspace
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new shared space label', 'warning'))
    }
  }

  handleClickToggleFormNewMember = () => this.setState(prev => ({displayFormNewMember: !prev.displayFormNewMember}))

  handleChangeDescription = e => {
    const newDescription = e.target.value
    this.setState(prev => ({content: {...prev.content, description: newDescription}}))
  }

  handleClickValidateNewDescription = async () => {
    const { props, state } = this
    const fetchPutDescription = await handleFetchResult(await putDescription(state.config.apiUrl, state.content.workspace_id, state.content.label, state.content.description))

    switch (fetchPutDescription.apiResponse.status) {
      case 200:
        this.sendGlobalFlashMessage(props.t('Save successful', 'info'))
        GLOBAL_dispatchEvent({ type: 'refreshWorkspaceList', data: {} }) // for sidebar and dashboard and admin workspace
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new description', 'warning'))
    }
  }

  handleClickNewRole = async (idMember, slugNewRole) => {
    const { props, state } = this
    const fetchPutUserRole = await handleFetchResult(await putMemberRole(state.config.apiUrl, state.content.workspace_id, idMember, slugNewRole))

    switch (fetchPutUserRole.apiResponse.status) {
      case 200: this.setState(prev => ({
        content: {
          ...prev.content,
          memberList: prev.content.memberList.map(m => m.user_id === idMember ? {...m, role: slugNewRole} : m)
        }
      })); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new role for member', 'warning'))
    }
  }

  handleClickNewMemberRole = slugRole => this.setState(prev => ({newMember: {...prev.newMember, role: slugRole}}))

  handleChangeNewMemberName = newName => {
    if (newName.length >= 2) this.handleSearchUser(newName)
    else if (newName.length === 0) this.setState({searchedKnownMemberList: []})
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        name: newName
      },
      autoCompleteFormNewMemberActive: true
    }))
  }

  handleSearchUser = async userNameToSearch => {
    const { props, state } = this
    const fetchUserKnownMemberList = await handleFetchResult(await getUserKnownMember(state.config.apiUrl, state.loggedUser.user_id, userNameToSearch))
    switch (fetchUserKnownMemberList.apiResponse.status) {
      case 200: this.setState({searchedKnownMemberList: fetchUserKnownMemberList.body}); break
      default: this.sendGlobalFlashMessage(props.t('Error while fetching known members list', 'warning'))
    }
  }

  handleClickDeleteMember = async idUser => {
    const { props, state } = this
    const fetchDeleteMember = await deleteMember(state.config.apiUrl, state.content.workspace_id, idUser)
    switch (fetchDeleteMember.status) {
      case 204:
        this.setState(prev => ({
          content: {
            ...prev.content,
            memberList: prev.content.memberList.filter(m => m.user_id !== idUser)
          }
        }))
        this.sendGlobalFlashMessage(props.t('Member removed', 'info'))
        GLOBAL_dispatchEvent({ type: 'refreshWorkspaceList', data: {} }) // for sidebar and dashboard and admin workspace
        break
      default: this.sendGlobalFlashMessage(props.t('Error while removing user from shared space', 'warning'))
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        name: knownMember.public_name,
        avatarUrl: knownMember.avatar_url
      },
      autoCompleteFormNewMemberActive: false,
      searchedKnownMemberList: []
    }))
  }

  handleClickValidateNewMember = async () => {
    const { props, state } = this

    if (state.newMember.name === '') {
      this.sendGlobalFlashMessage(props.t('Please set a name or email', 'warning'))
      return
    }

    if (state.newMember.role === '') {
      this.sendGlobalFlashMessage(props.t('Please set a role', 'warning'))
      return
    }

    if (
      !state.searchedKnownMemberList.find(u => u.public_name === state.newMember.name) &&
      state.config.system && state.config.system.config &&
      !state.config.system.config.email_notification_activated
    ) {
      this.sendGlobalFlashMessage(props.t('Unknown user'), 'warning')
      return false
    }

    const fetchWorkspaceNewMember = await handleFetchResult(await postWorkspaceMember(state.config.apiUrl, state.content.workspace_id, {
      id: state.newMember.id || null,
      name: state.newMember.name,
      role: state.newMember.role
    }))

    switch (fetchWorkspaceNewMember.apiResponse.status) {
      case 200:
        this.loadContent()
        this.setState({
          displayFormNewMember: false,
          newMember: {id: '', name: '', role: '', avatarUrl: ''}
        })
        this.sendGlobalFlashMessage(props.t('Member added', 'info'))
        GLOBAL_dispatchEvent({ type: 'refreshWorkspaceList', data: {} }) // for sidebar and dashboard and admin workspace
        break
      case 400:
        switch (fetchWorkspaceNewMember.body.code) {
          case 2042: this.sendGlobalFlashMessage(props.t('This account is deactivated'), 'warning'); break
          default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the shared space'), 'warning')
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while adding the member to the shared space', 'warning'))
    }
  }

  handleClickDeleteWorkspaceBtn = () => this.setState({displayPopupValidateDeleteWorkspace: true})

  handleClickClosePopupDeleteWorkspace = () => this.setState({displayPopupValidateDeleteWorkspace: false})

  handleClickValidateDeleteWorkspace = async () => {
    const { props, state } = this

    const fetchDeleteWorkspace = await deleteWorkspace(state.config.apiUrl, state.content.workspace_id)
    switch (fetchDeleteWorkspace.status) {
      case 204:
        GLOBAL_dispatchEvent({type: 'refreshWorkspaceList_then_redirect', data: {url: '/'}})
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
          title={state.content.label}
          idRoleUserWorkspace={state.loggedUser.idRoleUserWorkspace}
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
          <WorkspaceAdvancedComponent
            customColor={state.config.hexcolor}
            description={state.content.description}
            onChangeDescription={this.handleChangeDescription}
            onClickValidateNewDescription={this.handleClickValidateNewDescription}
            roleList={state.config.roleList}
            onClickNewRole={this.handleClickNewRole}
            memberList={state.content.memberList}
            displayFormNewMember={state.displayFormNewMember}
            autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
            onClickToggleFormNewMember={this.handleClickToggleFormNewMember}
            newMemberName={state.newMember.name}
            onChangeNewMemberName={this.handleChangeNewMemberName}
            newMemberRole={state.newMember.role}
            onClickNewMemberRole={this.handleClickNewMemberRole}
            onClickDeleteMember={this.handleClickDeleteMember}
            searchedKnownMemberList={state.searchedKnownMemberList}
            onClickKnownMember={this.handleClickKnownMember}
            onClickValidateNewMember={this.handleClickValidateNewMember}
            displayPopupValidateDeleteWorkspace={state.displayPopupValidateDeleteWorkspace}
            onClickClosePopupDeleteWorkspace={this.handleClickClosePopupDeleteWorkspace}
            onClickDelteWorkspaceBtn={this.handleClickDeleteWorkspaceBtn}
            onClickValidatePopupDeleteWorkspace={this.handleClickValidateDeleteWorkspace}
            idRoleUserWorkspace={state.loggedUser.idRoleUserWorkspace}
            isLoggedUserAdmin={state.loggedUser.profile === state.config.profileObject.ADMINISTRATOR.slug}
            emailNotifActivated={state.config.system.config.email_notification_activated}
            key={'workspace_advanced'}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Radium(WorkspaceAdvanced))
