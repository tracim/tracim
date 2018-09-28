import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  convertBackslashNToBr
} from 'tracim_frontend_lib'
import {
  getWorkspaceDetail,
  getWorkspaceMemberList,
  getWorkspaceRecentActivityList,
  getWorkspaceReadStatusList,
  getUserKnownMember,
  postWorkspaceMember,
  putUserWorkspaceRead,
  deleteWorkspaceMember,
  putUserWorkspaceDoNotify
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
  findIdRoleUserWorkspace
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
      newMember: {
        id: '',
        avatarUrl: '',
        nameOrEmail: '',
        role: ''
      },
      autoCompleteFormNewMemberActive: true,
      searchedKnownMemberList: [],
      displayNewMemberDashboard: false,
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
      this.loadWorkspaceDetail()
      this.loadMemberList()
      this.loadRecentActivity()
    }
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadWorkspaceDetail = async () => {
    const { props, state } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceDetail.status) {
      case 200: props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json)); break
      case 400: props.dispatch(newFlashMessage('Unknown shared space')); break
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

    const fetchWorkspaceRecentActivityList = await props.dispatch(getWorkspaceRecentActivityList(props.user, state.workspaceIdInUrl))
    const fetchWorkspaceReadStatusList = await props.dispatch(getWorkspaceReadStatusList(props.user, state.workspaceIdInUrl))

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

  handleToggleNewMemberDashboard = () => this.setState(prevState => ({displayNewMemberDashboard: !prevState.displayNewMemberDashboard}))

  handleToggleNotifBtn = () => this.setState(prevState => ({displayNotifBtn: !prevState.displayNotifBtn}))

  handleToggleWebdavBtn = () => this.setState(prevState => ({displayWebdavBtn: !prevState.displayWebdavBtn}))

  handleToggleCalendarBtn = () => this.setState(prevState => ({displayCalendarBtn: !prevState.displayCalendarBtn}))

  handleClickRecentContent = (idContent, typeContent) => this.props.history.push(PAGE.WORKSPACE.CONTENT(this.props.curWs.id, typeContent, idContent))

  handleClickMarkRecentActivityAsRead = async () => {
    const { props } = this
    const fetchUserWorkspaceAllRead = await props.dispatch(putUserWorkspaceRead(props.user, props.curWs.id))
    switch (fetchUserWorkspaceAllRead.status) {
      case 204: this.loadRecentActivity(); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while setting "mark all as read"')}`, 'warning')); break
    }
  }

  handleClickSeeMore = async () => {
    const { props, state } = this

    const idLastRecentActivity = props.curWs.recentActivityList[props.curWs.recentActivityList.length - 1].id

    const fetchWorkspaceRecentActivityList = await props.dispatch(getWorkspaceRecentActivityList(props.user, state.workspaceIdInUrl, idLastRecentActivity))
    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(appendWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('recent activity list')}`, 'warning')); break
    }
  }

  handleSearchUser = async userNameToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getUserKnownMember(props.user, userNameToSearch))
    switch (fetchUserKnownMemberList.status) {
      case 200:
        this.setState({searchedKnownMemberList: fetchUserKnownMemberList.json}); break
      default:
        props.dispatch(newFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  handleChangeNewMemberNameOrEmail = newNameOrEmail => {
    if (newNameOrEmail.length >= 2) this.handleSearchUser(newNameOrEmail)
    else if (newNameOrEmail.length === 0) this.setState({searchedKnownMemberList: []})
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        nameOrEmail: newNameOrEmail
      },
      autoCompleteFormNewMemberActive: true
    }))
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        nameOrEmail: knownMember.public_name,
        avatarUrl: knownMember.avatar_url
      },
      autoCompleteFormNewMemberActive: false,
      searchedKnownMemberList: []
    }))
  }

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

    const fetchWorkspaceNewMember = await props.dispatch(postWorkspaceMember(props.user, props.curWs.id, {
      id: state.newMember.id || null,
      name: state.newMember.nameOrEmail,
      role: state.newMember.role
    }))

    switch (fetchWorkspaceNewMember.status) {
      case 200:
        this.loadMemberList()
        this.setState({newMember: {id: '', avatarUrl: '', nameOrEmail: '', role: ''}})
        props.dispatch(newFlashMessage(props.t('Member added'), 'info'))
        return true
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while adding the member'), 'warning'))
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
      default: props.dispatch(newFlashMessage(props.t('Error while removing the member'), 'warning')); break
    }
  }

  handleClickOpenAdvancedDashboard = () => {
    const { props } = this

    props.renderAppFeature(
      {
        label: 'Advanced dashboard',
        slug: 'workspace_advanced',
        faIcon: 'bank',
        hexcolor: GLOBAL_primaryColor,
        creationLabel: '',
        roleList: ROLE
      },
      props.user,
      findIdRoleUserWorkspace(props.user.user_id, props.curWs.memberList, ROLE),
      {...props.curWs, workspace_id: props.curWs.id}
    )
  }

  handleClickAddNotification = async () => {
    const { props } = this
    const fetchWorkspaceUserAddNotification = await props.dispatch(putUserWorkspaceDoNotify(props.user, props.curWs.id, true))
    switch (fetchWorkspaceUserAddNotification.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, props.curWs.id, true)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  handleClickRemoveNotification = async () => {
    const { props } = this
    const fetchWorkspaceUserAddNotification = await props.dispatch(putUserWorkspaceDoNotify(props.user, props.curWs.id, false))
    switch (fetchWorkspaceUserAddNotification.status) {
      case 204: props.dispatch(updateUserWorkspaceSubscriptionNotif(props.user.user_id, props.curWs.id, false)); break
      default: props.dispatch(newFlashMessage(props.t('Error while changing subscription'), 'warning'))
    }
  }

  render () {
    const { props, state } = this

    const idRoleUserWorkspace = findIdRoleUserWorkspace(props.user.user_id, props.curWs.memberList, ROLE)

    return (
      <div className='dashboard'>
        <PageWrapper customeClass='dashboard'>
          <PageTitle
            parentClass='dashboard__header'
            title={props.t('Dashboard')}
            subtitle={''}
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
                memberList={props.curWs.memberList}
                roleList={ROLE}
                searchedKnownMemberList={state.searchedKnownMemberList}
                autoCompleteFormNewMemberActive={state.autoCompleteFormNewMemberActive}
                nameOrEmail={state.newMember.nameOrEmail}
                onChangeNameOrEmail={this.handleChangeNewMemberNameOrEmail}
                onClickKnownMember={this.handleClickKnownMember}
                // createAccount={state.newMember.createAccount}
                // onChangeCreateAccount={this.handleChangeNewMemberCreateAccount}
                role={state.newMember.role}
                onChangeRole={this.handleChangeNewMemberRole}
                onClickValidateNewMember={this.handleClickValidateNewMember}
                onClickRemoveMember={this.handleClickRemoveMember}
                displayRemoveMemberBtn={idRoleUserWorkspace >= 8}
                displayAddMemberBtn={idRoleUserWorkspace >= 8}
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
    )
  }
}

const mapStateToProps = ({ user, contentType, appList, currentWorkspace }) => ({ user, contentType, appList, curWs: currentWorkspace })
export default connect(mapStateToProps)(appFactory(translate()(Dashboard)))
