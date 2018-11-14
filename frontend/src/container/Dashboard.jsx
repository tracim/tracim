import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { withRouter } from 'react-router-dom'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  convertBackslashNToBr
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
  putMyselfWorkspaceDoNotify
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceRecentActivityList,
  appendWorkspaceRecentActivityList,
  setWorkspaceReadStatusList,
  removeWorkspaceMember,
  updateUserWorkspaceSubscriptionNotif
} from '../action-creator.sync.js'
import appFactory from '../appFactory.js'
import {
  ROLE,
  PAGE,
  findIdRoleUserWorkspace,
  PROFILE
} from '../helper.js'
import UserStatus from '../component/Dashboard/UserStatus.jsx'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import RecentActivity from '../component/Dashboard/RecentActivity.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'
// import MoreInfo from '../component/Dashboard/MoreInfo.jsx'

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
      firstLoadKnownMemberCompleted: false,
      displayNewMemberForm: false,
      autoCompleteFormNewMemberActive: false,
      searchedKnownMemberList: [],
      autoCompleteClicked: false,
      displayNotifBtn: false,
      displayWebdavBtn: false,
      displayCalendarBtn: false
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    switch (type) {
      case 'refreshWorkspaceList':
        console.log('%c<Dashboard> Custom event', 'color: #28a745', type, data)
        this.loadWorkspaceDetail()
        this.loadMemberList()
        this.loadRecentActivity()
        break
    }
  }

  componentDidMount () {
    this.loadWorkspaceDetail()
    this.loadMemberList()
    this.loadRecentActivity()
  }

  componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    if (prevProps.match.params.idws !== props.match.params.idws) {
      this.setState({workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null})
    }

    if (prevState.workspaceIdInUrl !== state.workspaceIdInUrl) {
      this.setState({displayNewMemberForm: false})
      this.loadWorkspaceDetail()
      this.loadMemberList()
      this.loadRecentActivity()
    }
  }

  componentWillUnmount () {
    this.props.dispatchCustomEvent('unmount_app') // to unmount advanced workspace
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadWorkspaceDetail = async () => {
    const { props, state } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceDetail.status) {
      case 200: props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json)); break
      case 400:
        props.history.push(PAGE.HOME)
        props.dispatch(newFlashMessage('Unknown shared space'))
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('shared space detail')}`, 'warning')); break
    }
  }

  loadMemberList = async () => {
    const { props, state } = this

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(state.workspaceIdInUrl))
    switch (fetchWorkspaceMemberList.status) {
      case 200: props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      case 400: break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('member list')}`, 'warning')); break
    }
  }

  loadRecentActivity = async () => {
    const { props, state } = this

    const fetchWorkspaceRecentActivityList = await props.dispatch(getMyselfWorkspaceRecentActivityList(state.workspaceIdInUrl))
    const fetchWorkspaceReadStatusList = await props.dispatch(getMyselfWorkspaceReadStatusList(state.workspaceIdInUrl))

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

  handleClickAddMemberBtn = () => this.setState({displayNewMemberForm: true})

  handleClickCloseAddMemberBtn = () => this.setState({displayNewMemberForm: false})

  handleToggleNotifBtn = () => this.setState(prevState => ({displayNotifBtn: !prevState.displayNotifBtn}))

  handleToggleWebdavBtn = () => this.setState(prevState => ({displayWebdavBtn: !prevState.displayWebdavBtn}))

  handleToggleCalendarBtn = () => this.setState(prevState => ({displayCalendarBtn: !prevState.displayCalendarBtn}))

  handleClickRecentContent = (idContent, typeContent) => this.props.history.push(PAGE.WORKSPACE.CONTENT(this.props.curWs.id, typeContent, idContent))

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

    const idLastRecentActivity = props.curWs.recentActivityList[props.curWs.recentActivityList.length - 1].id

    const fetchWorkspaceRecentActivityList = await props.dispatch(getMyselfWorkspaceRecentActivityList(state.workspaceIdInUrl, idLastRecentActivity))
    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(appendWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('recent activity list')}`, 'warning')); break
    }
  }

  handleSearchUser = async userNameToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getMyselfKnownMember(userNameToSearch, props.curWs.id))
    switch (fetchUserKnownMemberList.status) {
      case 200:
        this.setState({
          searchedKnownMemberList: fetchUserKnownMemberList.json,
          firstLoadKnownMemberCompleted: true
        })
        break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  isEmail = string => /\S*@\S*\.\S{2,}/.test(string)

  handleChangeNewMemberNameOrEmail = newNameOrEmail => {
    if (newNameOrEmail.length >= 2) this.handleSearchUser(newNameOrEmail)

    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        nameOrEmail: newNameOrEmail,
        isEmail: this.isEmail(newNameOrEmail)
      },
      autoCompleteFormNewMemberActive: this.state.firstLoadKnownMemberCompleted && newNameOrEmail.length >= 2,
      autoCompleteClicked: false
    }))
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

  handleChangeNewMemberRole = newRole => this.setState(prev => ({newMember: {...prev.newMember, role: newRole}}))

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
      this.setState({newMember: {...state.newMember, id: newMemberInKnownMemberList.user_id}})
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

  handleClickRemoveMember = async idMember => {
    const { props } = this

    const fetchWorkspaceRemoveMember = await props.dispatch(deleteWorkspaceMember(props.user, props.curWs.id, idMember))
    switch (fetchWorkspaceRemoveMember.status) {
      case 204:
        props.dispatch(removeWorkspaceMember(idMember))
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
        findIdRoleUserWorkspace(props.user.user_id, props.curWs.memberList, ROLE),
        {...props.curWs, workspace_id: props.curWs.id}
      )
    } else {
      props.dispatchCustomEvent('workspace_advanced_reloadContent', {workspace_id: props.curWs.id})
    }

    this.setState({advancedDashboardOpenedId: props.curWs.id})
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

    const idRoleUserWorkspace = findIdRoleUserWorkspace(props.user.user_id, props.curWs.memberList, ROLE)

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='dashboard'>
          <PageWrapper customeClass='dashboard'>
            <PageTitle
              parentClass='dashboard__header'
              title={props.t('Dashboard')}
              subtitle={''}
              icon='signal'
            >
              <div className='dashboard__header__advancedmode ml-3'>
                {idRoleUserWorkspace >= 8 &&
                  <button
                    type='button'
                    className='dashboard__header__advancedmode__button btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickOpenAdvancedDashboard}
                  >
                    {props.t('Open advanced Dashboard')}
                  </button>
                }
              </div>
            </PageTitle>

            <PageContent>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__detail'>
                  <div className='dashboard__workspace__detail__title primaryColorFont'>
                    {props.curWs.label}
                  </div>

                  <div
                    className='dashboard__workspace__detail__description'
                    dangerouslySetInnerHTML={{__html: convertBackslashNToBr(props.curWs.description)}}
                  />

                  {idRoleUserWorkspace >= 2 && (
                    <div className='dashboard__calltoaction'>
                      {props.appList.map(app => {
                        const contentType = props.contentType.find(ct => app.slug.includes(ct.slug)) || {creationLabel: '', slug: ''}
                        return (
                          <ContentTypeBtn
                            customClass='dashboard__calltoaction__button'
                            hexcolor={app.hexcolor}
                            label={app.label}
                            faIcon={app.faIcon}
                            // @fixme Côme - 2018/09/12 - trad key bellow is a little hacky. The creation label comes from api but since there is no translation in backend
                            // every files has a 'externalTradList' array just to generate the translation key in the json files through i18n.scanner
                            creationLabel={props.t(contentType.creationLabel)}
                            onClickBtn={() => props.history.push(`${PAGE.WORKSPACE.NEW(props.curWs.id, contentType.slug)}?parent_id=null`)}
                            key={app.label}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                <UserStatus
                  user={props.user}
                  curWs={props.curWs}
                  displayNotifBtn={state.displayNotifBtn}
                  onClickToggleNotifBtn={this.handleToggleNotifBtn}
                  onClickAddNotify={this.handleClickAddNotification}
                  onClickRemoveNotify={this.handleClickRemoveNotification}
                  t={props.t}
                />
              </div>

              <div className='dashboard__workspaceInfo'>
                <RecentActivity
                  customClass='dashboard__activity'
                  recentActivityList={props.curWs.recentActivityList}
                  readByUserList={props.curWs.contentReadStatusList}
                  contentTypeList={props.contentType}
                  onClickRecentContent={this.handleClickRecentContent}
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
                  idRoleUserWorkspace={idRoleUserWorkspace}
                  canSendInviteNewUser={[PROFILE.ADMINISTRATOR.slug, PROFILE.MANAGER.slug].includes(props.user.profile)}
                  emailNotifActivated={props.system.config.email_notification_activated}
                  autoCompleteClicked={state.autoCompleteClicked}
                  onClickAutoComplete={this.handleClickAutoComplete}
                  t={props.t}
                />
              </div>

              {/*
                AC - 11/09/2018 - not included in v2.0 roadmap
                <MoreInfo
                  onClickToggleWebdav={this.handleToggleWebdavBtn}
                  displayWebdavBtn={state.displayWebdavBtn}
                  onClickToggleCalendar={this.handleToggleCalendarBtn}
                  displayCalendarBtn={state.displayCalendarBtn}
                  t={props.t}
                />
              */}

            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, contentType, appList, currentWorkspace, system }) => ({ user, contentType, appList, curWs: currentWorkspace, system })
export default connect(mapStateToProps)(withRouter(appFactory(translate()(Dashboard))))
