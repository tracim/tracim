import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link, withRouter } from 'react-router-dom'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  convertBackslashNToBr,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  getWorkspaceDetail,
  getWorkspaceMemberList,
  getMyselfWorkspaceRecentActivityList,
  getMyselfWorkspaceReadStatusList,
  getMyselfKnownMember,
  postWorkspaceMember,
  putMyselfWorkspaceRead,
  deleteWorkspaceMember,
  putMyselfWorkspaceDoNotify,
  getLoggedUserCalendar
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceRecentActivityList,
  appendWorkspaceRecentActivityList,
  setWorkspaceReadStatusList,
  removeWorkspaceMember,
  updateUserWorkspaceSubscriptionNotif,
  setWorkspaceAgendaUrl,
  setBreadcrumbs
} from '../action-creator.sync.js'
import appFactory from '../appFactory.js'
import {
  ROLE,
  PAGE,
  findUserRoleIdInWorkspace,
  PROFILE
} from '../helper.js'
import UserStatus from '../component/Dashboard/UserStatus.jsx'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import RecentActivity from '../component/Dashboard/RecentActivity.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'
import AgendaInfo from '../component/Dashboard/AgendaInfo.jsx'
import WebdavInfo from '../component/Dashboard/WebdavInfo.jsx'
import { HACK_COLLABORA_CONTENT_TYPE } from './WorkspaceContent.jsx'

const ALWAYS_ALLOWED_BUTTON_SLUGS = ['contents/all', 'agenda']

class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
      advancedDashboardOpenedId: null,
      newMember: {
        id: '',
        avatarUrl: '',
        nameOrEmail: '',
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

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.REFRESH_DASHBOARD_MEMBER_LIST: this.loadMemberList(); break
      case CUSTOM_EVENT.REFRESH_WORKSPACE_DETAIL:
        await this.loadWorkspaceDetail()
        this.buildBreadcrumbs()
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE: this.buildBreadcrumbs(); break
    }
  }

  async componentDidMount () {
    await this.loadWorkspaceDetail()
    this.loadMemberList()
    this.loadRecentActivity()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (!prevProps.match || !props.match || prevProps.match.params.idws === props.match.params.idws) return

    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    this.setState({
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null,
      advancedDashboardOpenedId: null,
      displayNewMemberForm: false,
      newMember: {
        id: '',
        avatarUrl: '',
        nameOrEmail: '',
        role: '',
        isEmail: false
      }
    })
    await this.loadWorkspaceDetail()
    this.loadMemberList()
    this.loadRecentActivity()
    this.buildBreadcrumbs()
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent(CUSTOM_EVENT.UNMOUNT_APP) // to unmount advanced workspace
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  loadWorkspaceDetail = async () => {
    const { props } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, props.match.params.idws))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json))
        if (props.appList.some(a => a.slug === 'agenda') && fetchWorkspaceDetail.json.agenda_enabled) {
          this.loadCalendarDetail()
        }
        break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage('Unknown shared space'))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('shared space detail')}`, 'warning')); break
    }
  }

  loadCalendarDetail = async () => {
    const { props } = this

    const fetchCalendar = await props.dispatch(getLoggedUserCalendar())
    switch (fetchCalendar.status) {
      case 200:
        const currentWorkspaceId = parseInt(props.match.params.idws)
        const currentWorkspaceAgendaUrl = (fetchCalendar.json.find(a => a.workspace_id === currentWorkspaceId) || { agenda_url: '' }).agenda_url
        this.props.dispatch(setWorkspaceAgendaUrl(currentWorkspaceAgendaUrl))
        break
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

  loadRecentActivity = async () => {
    const { props } = this

    const fetchWorkspaceRecentActivityList = await props.dispatch(getMyselfWorkspaceRecentActivityList(props.match.params.idws))
    const fetchWorkspaceReadStatusList = await props.dispatch(getMyselfWorkspaceReadStatusList(props.match.params.idws))

    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(setWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('recent activity list')}`, 'warning')); break
    }

    switch (fetchWorkspaceReadStatusList.status) {
      case 200: props.dispatch(setWorkspaceReadStatusList(fetchWorkspaceReadStatusList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('read status list')}`, 'warning')); break
    }
  }

  buildBreadcrumbs = () => {
    const { props, state } = this

    const breadcrumbsList = [{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: (
        <Link to={PAGE.WORKSPACE.DASHBOARD(state.workspaceIdInUrl)}>
          {props.curWs.label}
        </Link>
      ),
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: (
        <Link to={PAGE.WORKSPACE.DASHBOARD(state.workspaceIdInUrl)}>
          {props.t('Dashboard')}
        </Link>
      ),
      type: BREADCRUMBS_TYPE.CORE
    }]

    props.dispatch(setBreadcrumbs(breadcrumbsList))
  }

  handleClickAddMemberBtn = () => this.setState({ displayNewMemberForm: true })

  handleClickCloseAddMemberBtn = () => this.setState({ displayNewMemberForm: false })

  handleToggleNotifBtn = () => this.setState(prevState => ({ displayNotifBtn: !prevState.displayNotifBtn }))

  handleToggleWebdavBtn = () => this.setState(prevState => ({ displayWebdavBtn: !prevState.displayWebdavBtn }))

  handleClickMarkRecentActivityAsRead = async () => {
    const { props } = this
    const fetchUserWorkspaceAllRead = await props.dispatch(putMyselfWorkspaceRead(props.curWs.id))
    switch (fetchUserWorkspaceAllRead.status) {
      case 204: this.loadRecentActivity(); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while setting "mark all as read"')}`, 'warning')); break
    }
  }

  handleClickSeeMore = async () => {
    const { props, state } = this

    const lastRecentActivityId = props.curWs.recentActivityList[props.curWs.recentActivityList.length - 1].id

    const fetchWorkspaceRecentActivityList = await props.dispatch(getMyselfWorkspaceRecentActivityList(state.workspaceIdInUrl, lastRecentActivityId))
    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(appendWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('recent activity list')}`, 'warning')); break
    }
  }

  handleSearchUser = async userNameToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getMyselfKnownMember(userNameToSearch, props.curWs.id))
    switch (fetchUserKnownMemberList.status) {
      case 200: this.setState({ searchedKnownMemberList: fetchUserKnownMemberList.json }); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangeNewMemberNameOrEmail = async newNameOrEmail => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        nameOrEmail: newNameOrEmail,
        isEmail: this.isEmail(newNameOrEmail)
      },
      autoCompleteClicked: false
    }))

    if (newNameOrEmail.length >= 2) {
      await this.handleSearchUser(newNameOrEmail)
      this.setState({ autoCompleteFormNewMemberActive: true })
    }
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        nameOrEmail: knownMember.public_name,
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

    if (state.newMember.nameOrEmail === '') {
      props.dispatch(newFlashMessage(props.t('Please set a name or email'), 'warning'))
      return false
    }

    if (state.newMember.role === '') {
      props.dispatch(newFlashMessage(props.t('Please set a role'), 'warning'))
      return false
    }

    const newMemberInKnownMemberList = state.searchedKnownMemberList.find(u => u.public_name === state.newMember.nameOrEmail)

    if (!props.system.config.email_notification_activated && !newMemberInKnownMemberList) {
      props.dispatch(newFlashMessage(props.t('Unknown user'), 'warning'))
      return false
    }

    if (state.newMember.id === '' && newMemberInKnownMemberList) { // this is to force sending the id of the user to the api if he exists
      this.setState({ newMember: { ...state.newMember, id: newMemberInKnownMemberList.user_id } })
    }

    const fetchWorkspaceNewMember = await props.dispatch(postWorkspaceMember(props.user, props.curWs.id, {
      id: state.newMember.id || newMemberInKnownMemberList ? newMemberInKnownMemberList.user_id : null,
      publicName: state.newMember.isEmail ? '' : state.newMember.nameOrEmail,
      email: state.newMember.isEmail ? state.newMember.nameOrEmail : '',
      role: state.newMember.role
    }))

    switch (fetchWorkspaceNewMember.status) {
      case 200:
        this.loadMemberList()
        this.setState({
          newMember: {
            id: '',
            avatarUrl: '',
            nameOrEmail: '',
            role: '',
            isEmail: false
          },
          autoCompleteFormNewMemberActive: false,
          displayNewMemberForm: false
        })
        props.dispatch(newFlashMessage(props.t('Member added'), 'info'))
        return true
      case 400:
        switch (fetchWorkspaceNewMember.json.code) {
          case 2042:
            props.dispatch(newFlashMessage(props.t('This account is deactivated'), 'warning'))
            return false
          case 1001:
            const ErrorMsg = () => (
              <div>
                {props.t('Unknown user')}<br />
                {props.t('Note, only administrators can send invitational email')}
              </div>
            )
            props.dispatch(newFlashMessage(<ErrorMsg />))
            return false
          case 3008:
            props.dispatch(newFlashMessage(props.t('This user already is in the workspace'), 'warning'))
            return false
          default:
            props.dispatch(newFlashMessage(props.t('Error while adding the member to the shared space'), 'warning'))
            return false
        }
      default:
        props.dispatch(newFlashMessage(props.t('Error while adding the member to the shared space'), 'warning'))
        return false
    }
  }

  handleClickRemoveMember = async memberId => {
    const { props } = this

    const fetchWorkspaceRemoveMember = await props.dispatch(deleteWorkspaceMember(props.user, props.curWs.id, memberId))
    switch (fetchWorkspaceRemoveMember.status) {
      case 204:
        props.dispatch(removeWorkspaceMember(memberId))
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
          faIcon: 'bank',
          hexcolor: GLOBAL_primaryColor,
          creationLabel: ''
        },
        props.user,
        findUserRoleIdInWorkspace(props.user.user_id, props.curWs.memberList, ROLE),
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
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, props.curWs.id, true)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleClickRemoveNotification = async () => {
    const { props } = this
    const fetchWorkspaceUserAddNotification = await props.dispatch(putMyselfWorkspaceDoNotify(props.curWs.id, false))
    switch (fetchWorkspaceUserAddNotification.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, props.curWs.id, false)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    const userRoleIdInWorkspace = findUserRoleIdInWorkspace(props.user.user_id, props.curWs.memberList, ROLE)

    // INFO - GB - 2019-08-29 - these filters are made temporarily by the frontend, but may change to have all the intelligence in the backend
    // https://github.com/tracim/tracim/issues/2326
    const contentTypeButtonList = props.contentType.length > 0 // INFO - CH - 2019-04-03 - wait for content type api to have responded
      ? props.appList
        .filter(app => userRoleIdInWorkspace === 2 ? app.slug !== 'contents/folder' : true)
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
          const creationLabelWithHACK = (() => {
            switch (app.slug) {
              case 'agenda': return props.t('Open the agenda')
              case 'collaborative_document_edition': return HACK_COLLABORA_CONTENT_TYPE([{}]).creationLabel
              default: return contentType.creationLabel
            }
          })()

          // HACK - CH - 2019-09-10 - hard coding collabora slug from the hack since the collaborative_document has been removed from content type list
          // See https://github.com/tracim/tracim/issues/2375
          const slugWithHACK = app.slug === HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            ? HACK_COLLABORA_CONTENT_TYPE([{}]).slug
            : contentType.slug

          return {
            ...app,
            creationLabel: creationLabelWithHACK,
            route: app.slug === 'agenda'
              ? PAGE.WORKSPACE.AGENDA(props.curWs.id)
              : `${PAGE.WORKSPACE.NEW(props.curWs.id, slugWithHACK)}?parent_id=null`
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

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='dashboard'>
            <PageTitle
              parentClass='dashboard__header'
              title={props.t('Dashboard')}
              subtitle={''}
              icon='home'
              breadcrumbsList={props.breadcrumbs}
            >
              <div className='dashboard__header__advancedmode'>
                {userRoleIdInWorkspace >= 8 &&
                  <button
                    type='button'
                    className='dashboard__header__advancedmode__button btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickOpenAdvancedDashboard}
                  >
                    <i className='fa fa-fw fa-cog' />
                    {props.t('Open advanced Dashboard')}
                  </button>
                }
              </div>
            </PageTitle>

            <PageContent>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__detail'>
                  <div
                    className='dashboard__workspace__detail__title primaryColorFont'
                    data-cy='dashboardWorkspaceLabel'
                  >
                    {props.curWs.label}
                  </div>

                  <div
                    className='dashboard__workspace__detail__description'
                    dangerouslySetInnerHTML={{ __html: convertBackslashNToBr(props.curWs.description) }}
                  />

                  <div className='dashboard__calltoaction'>
                    {contentTypeButtonList.map(app => {
                      return (userRoleIdInWorkspace >= 2 || ALWAYS_ALLOWED_BUTTON_SLUGS.includes(app.slug)) && (
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
                </div>

                <UserStatus
                  user={props.user}
                  curWs={props.curWs}
                  displayNotifBtn={props.system.config.email_notification_activated}
                  onClickToggleNotifBtn={this.handleToggleNotifBtn}
                  onClickAddNotify={this.handleClickAddNotification}
                  onClickRemoveNotify={this.handleClickRemoveNotification}
                  t={props.t}
                />
              </div>

              <div className='dashboard__workspaceInfo'>
                <RecentActivity
                  customClass='dashboard__activity'
                  workspaceId={props.curWs.id}
                  roleIdForLoggedUser={userRoleIdInWorkspace}
                  recentActivityList={props.curWs.recentActivityList}
                  readByUserList={props.curWs.contentReadStatusList}
                  contentTypeList={props.contentType}
                  onClickEverythingAsRead={this.handleClickMarkRecentActivityAsRead}
                  onClickSeeMore={this.handleClickSeeMore}
                  t={props.t}
                />

                <MemberList
                  customClass='dashboard__memberlist'
                  loggedUser={props.user}
                  memberList={props.curWs.memberList.filter(u => u.isActive)}
                  roleList={ROLE}
                  searchedKnownMemberList={state.searchedKnownMemberList}
                  autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
                  nameOrEmail={state.newMember.nameOrEmail}
                  isEmail={state.newMember.isEmail}
                  onChangeNameOrEmail={this.handleChangeNewMemberNameOrEmail}
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
                  canSendInviteNewUser={[PROFILE.ADMINISTRATOR.slug, PROFILE.MANAGER.slug].includes(props.user.profile)}
                  emailNotifActivated={props.system.config.email_notification_activated}
                  autoCompleteClicked={state.autoCompleteClicked}
                  onClickAutoComplete={this.handleClickAutoComplete}
                  t={props.t}
                />
              </div>

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
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Dashboard))))
