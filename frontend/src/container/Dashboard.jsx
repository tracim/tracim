import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { withRouter, Link } from 'react-router-dom'
import {
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  PageWrapper,
  PageContent,
  IconButton,
  convertBackslashNToBr,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  ROLE,
  ROLE_LIST,
  PROFILE,
  buildHeadTitle,
  PAGE,
  removeAtInUsername
} from 'tracim_frontend_lib'
import {
  getWorkspaceDetail,
  getWorkspaceMemberList,
  getMyselfKnownMember,
  postWorkspaceMember,
  deleteWorkspaceMember,
  putMyselfWorkspaceDoNotify,
  getLoggedUserCalendar
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  updateUserWorkspaceSubscriptionNotif,
  setWorkspaceAgendaUrl,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import appFactory from '../util/appFactory.js'
import {
  FETCH_CONFIG,
  findUserRoleIdInWorkspace
} from '../util/helper.js'
import UserStatus from '../component/Dashboard/UserStatus.jsx'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'
import WebdavInfo from '../component/Dashboard/WebdavInfo.jsx'
import TabBar from '../component/TabBar/TabBar.jsx'
import WorkspaceRecentActivities from './WorkspaceRecentActivities.jsx'
import { HACK_COLLABORA_CONTENT_TYPE } from './WorkspaceContent.jsx'

const ALWAYS_ALLOWED_BUTTON_SLUGS = ['contents/all', 'agenda']

export class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws
        ? parseInt(props.match.params.idws)
        : null, // this is used to avoid handling the parseInt every time
      advancedDashboardOpenedId: null,
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: '',
        isEmail: false
      },
      displayNewMemberForm: false,
      autoCompleteFormNewMemberActive: false,
      searchedKnownMemberList: [],
      autoCompleteClicked: false,
      displayNotifBtn: false,
      displayWebdavBtn: false
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.REFRESH_DASHBOARD_MEMBER_LIST, handler: this.handleRefreshDashboardMemberList },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE, coreEntityType: TLM_CET.MODIFIED, handler: this.handleWorkspaceModified }
    ])
  }

  handleRefreshDashboardMemberList = () => this.loadMemberList()

  handleAllAppChangeLanguage = () => {
    this.buildBreadcrumbs()
    this.setHeadTitle()
  }

  handleWorkspaceModified = data => {
    if (this.props.curWs.id !== data.fields.workspace.workspace_id) return
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  async componentDidMount () {
    this.setHeadTitle()
    await this.loadWorkspaceDetail()
    this.loadMemberList()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (!prevProps.match || !props.match || prevProps.match.params.idws === props.match.params.idws) return

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) this.setHeadTitle()

    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    this.setState({
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null,
      advancedDashboardOpenedId: null,
      displayNewMemberForm: false,
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: '',
        isEmail: false
      }
    })
    await this.loadWorkspaceDetail()
    this.loadMemberList()
    this.buildBreadcrumbs()
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.match.params.idws))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        if (props.appList.some(a => a.slug === 'agenda') && fetchWorkspaceDetail.json.agenda_enabled) {
          this.loadCalendarDetail()
        }
        this.setHeadTitle()
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage(props.t('Unknown space')))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('space detail')}`, 'warning')); break
    }
  }

  loadCalendarDetail = async () => {
    const { props } = this

    const fetchCalendar = await props.dispatch(getLoggedUserCalendar())
    switch (fetchCalendar.status) {
      case 200: {
        const currentWorkspaceId = parseInt(props.match.params.idws)
        const currentWorkspaceAgendaUrl = (fetchCalendar.json.find(a => a.workspace_id === currentWorkspaceId) || { agenda_url: '' }).agenda_url
        this.props.dispatch(setWorkspaceAgendaUrl(currentWorkspaceAgendaUrl))
        break
      }
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('agenda details')}`, 'warning')); break
    }
  }

  loadMemberList = async () => {
    const { props } = this

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.match.params.idws))
    switch (fetchWorkspaceMemberList.status) {
      case 200: props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('member list')}`, 'warning')); break
    }
  }

  setHeadTitle = () => {
    const { props } = this

    const headTitle = buildHeadTitle(
      [props.t('Dashboard'), props.curWs.label]
    )
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: PAGE.WORKSPACE.DASHBOARD(state.workspaceIdInUrl),
      type: BREADCRUMBS_TYPE.CORE,
      label: props.curWs.label,
      isALink: true
    }, {
      link: '',
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Dashboard'),
      isALink: false
    }]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  handleClickAddMemberBtn = () => this.setState({ displayNewMemberForm: true })

  handleClickCloseAddMemberBtn = () => this.setState({ displayNewMemberForm: false })

  handleToggleNotifBtn = () => this.setState(prevState => ({ displayNotifBtn: !prevState.displayNotifBtn }))

  handleToggleWebdavBtn = () => this.setState(prevState => ({ displayWebdavBtn: !prevState.displayWebdavBtn }))

  handleSearchUser = async personalDataToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getMyselfKnownMember(personalDataToSearch, props.curWs.id))
    switch (fetchUserKnownMemberList.status) {
      case 200: this.setState({ searchedKnownMemberList: fetchUserKnownMemberList.json }); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangePersonalData = async newPersonalData => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        personalData: newPersonalData,
        publicName: newPersonalData,
        isEmail: this.isEmail(newPersonalData)
      },
      autoCompleteClicked: false
    }))

    const personalData = removeAtInUsername(newPersonalData)

    if (personalData.length >= 2) {
      await this.handleSearchUser(personalData)
      this.setState({ autoCompleteFormNewMemberActive: true })
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        publicName: knownMember.public_name,
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

  handleChangeNewMemberRole = newRole => this.setState(prev => ({ newMember: { ...prev.newMember, role: newRole } }))

  handleClickValidateNewMember = async () => {
    const { props, state } = this

    if (state.newMember.personalData === '') {
      props.dispatch(newFlashMessage(props.t('Please set a name, an email or a username'), 'warning'))
      return false
    }

    if (state.newMember.role === '') {
      props.dispatch(newFlashMessage(props.t('Please set a role'), 'warning'))
      return false
    }

    const newMemberInKnownMemberList = state.searchedKnownMemberList.find(u => u.user_id === state.newMember.id)

    if (state.newMember.id === '' && newMemberInKnownMemberList) { // this is to force sending the id of the user to the api if he exists
      this.setState({ newMember: { ...state.newMember, id: newMemberInKnownMemberList.user_id } })
    }

    const fetchWorkspaceNewMember = await props.dispatch(postWorkspaceMember(props.curWs.id, {
      id: state.newMember.id || newMemberInKnownMemberList ? newMemberInKnownMemberList.user_id : null,
      email: state.newMember.isEmail ? state.newMember.personalData : '',
      username: state.newMember.isEmail ? '' : state.newMember.personalData,
      role: state.newMember.role
    }))

    this.setState({
      newMember: {
        id: '',
        avatarUrl: '',
        personalData: '',
        publicName: '',
        role: '',
        isEmail: false
      },
      autoCompleteFormNewMemberActive: false,
      displayNewMemberForm: false
    })

    switch (fetchWorkspaceNewMember.status) {
      case 200:
        props.dispatch(newFlashMessage(props.t('Member added'), 'info'))
        return true
      case 400:
        switch (fetchWorkspaceNewMember.json.code) {
          case 2042:
            props.dispatch(newFlashMessage(props.t('This account is deactivated'), 'warning'))
            return false
          case 1001: {
            const ErrorMsg = () => (
              <div>
                {props.t('Unknown user')}<br />
                {props.t('Note, only administrators can send invitational email')}
              </div>
            )
            props.dispatch(newFlashMessage(<ErrorMsg />))
            return false
          }
          case 3008:
            props.dispatch(newFlashMessage(props.t('This user already is in the space'), 'warning'))
            return false
          default:
            props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
            return false
        }
      default:
        props.dispatch(newFlashMessage(props.t('Error while adding the member to the space'), 'warning'))
        return false
    }
  }

  handleClickRemoveMember = async memberId => {
    const { props } = this

    const fetchWorkspaceRemoveMember = await props.dispatch(deleteWorkspaceMember(props.curWs.id, memberId))
    switch (fetchWorkspaceRemoveMember.status) {
      case 204:
        props.dispatch(newFlashMessage(props.t('Member removed'), 'info'))
        break
      default: props.dispatch(newFlashMessage(props.t('Error while removing member'), 'warning')); break
    }
  }

  handleClickOpenAdvancedDashboard = () => {
    const { props, state } = this

    if (state.advancedDashboardOpenedId === null) {
      props.renderAppFeature(
        {
          label: 'Advanced dashboard',
          slug: 'workspace_advanced',
          faIcon: 'fas fa-users',
          hexcolor: GLOBAL_primaryColor,
          creationLabel: ''
        },
        props.user,
        findUserRoleIdInWorkspace(props.user.userId, props.curWs.memberList, ROLE_LIST),
        { ...props.curWs, workspace_id: props.curWs.id }
      )
    } else {
      props.dispatchCustomEvent(CUSTOM_EVENT.RELOAD_CONTENT('workspace_advanced'), { workspace_id: props.curWs.id })
    }

    this.setState({ advancedDashboardOpenedId: props.curWs.id })
  }

  handleClickAddNotification = async () => {
    const { props } = this
    const fetchWorkspaceUserAddNotification = await props.dispatch(putMyselfWorkspaceDoNotify(props.curWs.id, true))
    switch (fetchWorkspaceUserAddNotification.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.userId, props.curWs.id, true)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleClickRemoveNotification = async () => {
    const { props } = this
    const fetchWorkspaceUserAddNotification = await props.dispatch(putMyselfWorkspaceDoNotify(props.curWs.id, false))
    switch (fetchWorkspaceUserAddNotification.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.userId, props.curWs.id, false)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.userId, props.curWs.memberList, ROLE_LIST)

    // INFO - GB - 2019-08-29 - these filters are made temporarily by the frontend, but may change to have all the intelligence in the backend
    // https://github.com/tracim/tracim/issues/2326
    const contentTypeButtonList = props.contentType.length > 0 // INFO - CH - 2019-04-03 - wait for content type api to have responded
      ? props.appList
        .filter(app => userRoleIdInWorkspace === ROLE.contributor.id ? app.slug !== 'contents/folder' : true)
        .filter(app => app.slug === 'agenda' ? props.curWs.agendaEnabled : true)
        .filter(app => app.slug !== 'contents/share_folder')
        .filter(app => app.slug !== 'share_content')
        .filter(app => app.slug !== 'upload_permission')
        .map(app => {
          const contentType = props.contentType.find(ct => app.slug.includes(ct.slug)) || { creationLabel: '', slug: '' }
          // INFO - CH - 2019-04-03 - hard coding some agenda properties for now since some end points requires some clarifications
          // these endpoints are /system/applications, /system/content_types and key sidebar_entry from /user/me/workspaces
          // HACK - CH - 2019-09-10 - hard coding collabora creation label from the hack since backend still isn't clear about appList and contentTypeList usage
          // See https://github.com/tracim/tracim/issues/2375
          // HACK - GM - 2019-11-26 - hard coding gallery creation label because gallery don't have a content_type
          const creationLabelWithHACK = (() => {
            switch (app.slug) {
              case 'agenda': return props.t('Open the agenda')
              case 'gallery': return props.t('Open the gallery')
              case 'collaborative_document_edition': return HACK_COLLABORA_CONTENT_TYPE([{}]).creationLabel
              default: return contentType.creationLabel
            }
          })()

          // HACK - CH - 2019-09-10 - hard coding collabora slug from the hack since the collaborative_document has been removed from content type list
          // See https://github.com/tracim/tracim/issues/2375
          const slugWithHACK = app.slug === HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            ? HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            : contentType.slug

          const route = (() => {
            switch (app.slug) {
              case 'agenda': return PAGE.WORKSPACE.AGENDA(props.curWs.id)
              case 'gallery': return PAGE.WORKSPACE.GALLERY(props.curWs.id)
              default: return `${PAGE.WORKSPACE.NEW(props.curWs.id, slugWithHACK)}?parent_id=null`
            }
          })()

          return {
            ...app,
            hexcolor: app.slug === HACK_COLLABORA_CONTENT_TYPE([{}]).slug
              ? HACK_COLLABORA_CONTENT_TYPE([{}]).hexcolor
              : app.hexcolor,
            creationLabel: creationLabelWithHACK,
            route: route
          }
        })
      : []

    // INFO - CH - 2019-04-03 - hard coding the button "explore contents" since it is not an app for now
    contentTypeButtonList.push({
      slug: 'content/all', // INFO - CH - 2019-04-03 - This will be overridden but it avoid a unique key warning
      ...props.curWs.sidebarEntryList.find(se => se.slug === 'contents/all'),
      creationLabel: props.t('Explore contents'),
      route: PAGE.WORKSPACE.CONTENT_LIST(props.curWs.id),
      hexcolor: '#999' // INFO - CH - 2019-04-08 - different color from sidebar because it is more readable here
    })

    const description = convertBackslashNToBr(props.curWs.description)

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='dashboard'>
            <TabBar
              currentSpace={props.curWs}
              breadcrumbs={props.breadcrumbs}
            />

            <PageContent>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__content'>

                  <h3>{props.t('About this space')}</h3>

                  <div className='dashboard__workspace__detail'>
                    {(description.trim()
                      ? (
                        <div
                          className='dashboard__workspace__detail__description'
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      )
                      : (
                        <div className='dashboard__workspace__detail__description__missing'>
                          {props.t("This space doesn't have a description yet.")}
                        </div>
                      )
                    )}
                    <div className='dashboard__workspace__detail__buttons'>
                      {userRoleIdInWorkspace >= ROLE.workspaceManager.id && (
                        <IconButton
                          icon='fas fa-fw fa-cog'
                          text={props.t('Space settings')}
                          onClick={this.handleClickOpenAdvancedDashboard}
                        />
                      )}
                    </div>
                  </div>
                  {props.curWs && props.curWs.id && <WorkspaceRecentActivities workspaceId={props.curWs.id} />}
                </div>

                <div className='dashboard__workspace__rightMenu'>
                  <UserStatus
                    user={props.user}
                    curWs={props.curWs}
                    displayNotifBtn={props.system.config.email_notification_activated}
                    onClickToggleNotifBtn={this.handleToggleNotifBtn}
                    onClickAddNotify={this.handleClickAddNotification}
                    onClickRemoveNotify={this.handleClickRemoveNotification}
                    t={props.t}
                  />

                  <div className='dashboard__workspace__rightMenu__contents'>
                    {contentTypeButtonList.map(app => {
                      return (userRoleIdInWorkspace >= ROLE.contributor.id || ALWAYS_ALLOWED_BUTTON_SLUGS.includes(app.slug)) && (
                        <ContentTypeBtn
                          customClass='dashboard__calltoaction__button'
                          hexcolor={app.hexcolor}
                          label={app.label}
                          faIcon={app.faIcon}
                          // TODO - Côme - 2018/09/12 - translation key below is a little hacky:
                          // The creation label comes from api but since there is no translation in backend
                          // every files has a 'externalTranslationList' array just to generate the translation key in the json files through i18n.scanner
                          creationLabel={props.t(app.creationLabel)}
                          onClickBtn={() => props.history.push(app.route)}
                          appSlug={app.slug}
                          key={app.slug}
                        />
                      )
                    })}
                  </div>

                  <MemberList
                    customClass='dashboard__memberlist'
                    loggedUser={props.user}
                    apiUrl={FETCH_CONFIG.apiUrl}
                    memberList={props.curWs.memberList}
                    roleList={ROLE_LIST}
                    searchedKnownMemberList={state.searchedKnownMemberList}
                    autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
                    publicName={state.newMember.publicName}
                    isEmail={state.newMember.isEmail}
                    onChangePersonalData={this.handleChangePersonalData}
                    onClickKnownMember={this.handleClickKnownMember}
                    // createAccount={state.newMember.createAccount}
                    // onChangeCreateAccount={this.handleChangeNewMemberCreateAccount}
                    role={state.newMember.role}
                    onChangeRole={this.handleChangeNewMemberRole}
                    onClickValidateNewMember={this.handleClickValidateNewMember}
                    displayNewMemberForm={state.displayNewMemberForm}
                    onClickAddMemberBtn={this.handleClickAddMemberBtn}
                    onClickCloseAddMemberBtn={this.handleClickCloseAddMemberBtn}
                    onClickRemoveMember={this.handleClickRemoveMember}
                    userRoleIdInWorkspace={userRoleIdInWorkspace}
                    canSendInviteNewUser={[PROFILE.administrator.slug, PROFILE.manager.slug].includes(props.user.profile)}
                    emailNotifActivated={props.system.config.email_notification_activated}
                    autoCompleteClicked={state.autoCompleteClicked}
                    onClickAutoComplete={this.handleClickAutoComplete}
                    t={props.t}
                  />

                  {props.appList.some(a => a.slug === 'agenda') && props.curWs.agendaEnabled && (
                    <AgendaInfo
                      customClass='dashboard__section'
                      introText={props.t('Use this link to integrate this agenda to your')}
                      caldavText={props.t('CalDAV compatible software')}
                      agendaUrl={props.curWs.agendaUrl}
                    />
                  )}

                  {props.system.config.webdav_enabled && (
                    <WebdavInfo
                      customClass='dashboard__section'
                      introText={props.t('Use this link to integrate Tracim in your file explorer')}
                      webdavText={props.t('(protocole WebDAV)')}
                      webdavUrl={props.system.config.webdav_url}
                    />
                  )}
                </div>
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, contentType, appList, currentWorkspace, system }) => ({
  breadcrumbs, user, contentType, appList, curWs: currentWorkspace, system
})
export default connect(mapStateToProps)(withRouter(appFactory(translate()(TracimComponent(Dashboard)))))
