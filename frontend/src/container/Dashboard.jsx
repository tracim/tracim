import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'
import {
  getWorkspaceDetail,
  getWorkspaceMemberList,
  getWorkspaceRecentActivityList,
  getWorkspaceReadStatusList,
  getUserKnownMember,
  postWorkspaceMember,
  putUserWorkspaceRead
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceRecentActivityList,
  appendWorkspaceRecentActivityList,
  setWorkspaceReadStatusList
} from '../action-creator.sync.js'
import { ROLE, PAGE } from '../helper.js'
import UserStatus from '../component/Dashboard/UserStatus.jsx'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import RecentActivity from '../component/Dashboard/RecentActivity.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'
import MoreInfo from '../component/Dashboard/MoreInfo.jsx'

class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt every time
      newMember: {
        id: '',
        avatarUrl: '',
        nameOrEmail: '',
        // createAccount: false, // @TODO ask DA about this checkbox if it is still usefull (since backend handles it all)
        role: ''
      },
      searchedKnownMemberList: [],
      displayNewMemberDashboard: false,
      displayNotifBtn: false,
      displayWebdavBtn: false,
      displayCalendarBtn: false
    }
  }

  async componentDidMount () {
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

  loadWorkspaceDetail = async () => {
    const { props, state } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceDetail.status) {
      case 200: props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('workspace detail')}`, 'warning')); break
    }
  }

  loadMemberList = async () => {
    const { props, state } = this

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceMemberList.status) {
      case 200: props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('member list')}`, 'warning')); break
    }
  }

  loadRecentActivity = async () => {
    const { props, state } = this

    const fetchWorkspaceRecentActivityList = await props.dispatch(getWorkspaceRecentActivityList(props.user, state.workspaceIdInUrl))
    const fetchWorkspaceReadStatusList = await props.dispatch(getWorkspaceReadStatusList(props.user, state.workspaceIdInUrl))

    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(setWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('recent activity list')}`, 'warning')); break
    }

    switch (fetchWorkspaceReadStatusList.status) {
      case 200: props.dispatch(setWorkspaceReadStatusList(fetchWorkspaceReadStatusList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('read status list')}`, 'warning')); break
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
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching "mark all as read"')}`, 'warning')); break
    }
  }

  handleClickSeeMore = async () => {
    const { props, state } = this

    const idLastRecentActivity = props.curWs.recentActivityList[props.curWs.recentActivityList.length - 1].id

    const fetchWorkspaceRecentActivityList = await props.dispatch(getWorkspaceRecentActivityList(props.user, state.workspaceIdInUrl, idLastRecentActivity))
    switch (fetchWorkspaceRecentActivityList.status) {
      case 200: props.dispatch(appendWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default: props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('recent activity list')}`, 'warning')); break
    }
  }

  handleSearchUser = async userNameToSearch => {
    const { props } = this
    const fetchUserKnownMemberList = await props.dispatch(getUserKnownMember(props.user, userNameToSearch))
    switch (fetchUserKnownMemberList.status) {
      case 200:
        this.setState({searchedKnownMemberList: fetchUserKnownMemberList.json}); break
      default:
        props.dispatch(newFlashMessage(`${props.t('An error has happened while fetching')} ${props.t('known members list')}`, 'warning')); break
    }
  }

  handleChangeNewMemberNameOrEmail = newNameOrEmail => {
    if (newNameOrEmail.length >= 2) this.handleSearchUser(newNameOrEmail)
    this.setState(prev => ({newMember: {...prev.newMember, nameOrEmail: newNameOrEmail}}))
  }

  handleClickKnownMember = knownMember => {
    this.setState(prev => ({
      newMember: {
        ...prev.newMember,
        id: knownMember.user_id,
        nameOrEmail: knownMember.public_name,
        avatarUrl: knownMember.avatar_url
      },
      searchedKnownMemberList: []
    }))
  }

  // handleChangeNewMemberCreateAccount = newCreateAccount => this.setState(prev => ({newMember: {...prev.newMember, createAccount: newCreateAccount}}))

  handleChangeNewMemberRole = newRole => this.setState(prev => ({newMember: {...prev.newMember, role: newRole}}))

  handleClickValidateNewMember = async () => {
    const { props, state } = this

    if (state.newMember.nameOrEmail === '') {
      props.dispatch(newFlashMessage(props.t('Please set a name or email'), 'warning'))
      return
    }

    if (state.newMember.role === '') {
      props.dispatch(newFlashMessage(props.t('Please set a role'), 'warning'))
      return
    }

    const fetchWorkspaceNewMember = await props.dispatch(postWorkspaceMember(props.user, props.curWs.id, {
      id: state.newMember.id,
      name: state.newMember.nameOrEmail,
      role: state.newMember.role
    }))

    switch (fetchWorkspaceNewMember.status) {
      case 200:
        this.loadMemberList(); break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while adding the member'), 'warning')); break
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='dashboard'>
        <PageWrapper customeClass='dashboard'>
          <PageTitle
            parentClass='dashboard__header'
            title={props.t('Dashboard')}
            subtitle={''}
          >
            <div className='dashboard__header__advancedmode mr-3'>
              <button type='button' className='btn btn-primary'>
                {props.t('Active advanced Dashboard')}
              </button>
            </div>
          </PageTitle>

          <PageContent>
            <div className='dashboard__workspace-wrapper'>
              <div className='dashboard__workspace'>
                <div className='dashboard__workspace__title primaryColorFont'>
                  {props.curWs.label}
                </div>

                <div className='dashboard__workspace__detail'>
                  {props.curWs.description}
                </div>
              </div>

              <UserStatus
                user={props.user}
                curWs={props.curWs}
                displayNotifBtn={state.displayNotifBtn}
                onClickToggleNotifBtn={this.handleToggleNotifBtn}
                t={props.t}
              />
            </div>

            <div className='dashboard__calltoaction justify-content-xl-center'>
              {props.contentType.map(ct =>
                <ContentTypeBtn
                  customClass='dashboard__calltoaction__button'
                  hexcolor={ct.hexcolor}
                  label={ct.label}
                  faIcon={ct.faIcon}
                  creationLabel={ct.creationLabel}
                  onClickBtn={() => props.history.push(PAGE.WORKSPACE.NEW(props.curWs.id, ct.slug))}
                  key={ct.label}
                />
              )}
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
                nameOrEmail={state.newMember.nameOrEmail}
                onChangeNameOrEmail={this.handleChangeNewMemberNameOrEmail}
                onClickKnownMember={this.handleClickKnownMember}
                // createAccount={state.newMember.createAccount}
                // onChangeCreateAccount={this.handleChangeNewMemberCreateAccount}
                role={state.newMember.role}
                onChangeRole={this.handleChangeNewMemberRole}
                onClickValidateNewMember={this.handleClickValidateNewMember}
                t={props.t}
              />
            </div>

            <MoreInfo
              onClickToggleWebdav={this.handleToggleWebdavBtn}
              displayWebdavBtn={state.displayWebdavBtn}
              onClickToggleCalendar={this.handleToggleCalendarBtn}
              displayCalendarBtn={state.displayCalendarBtn}
              t={props.t}
            />
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, contentType, currentWorkspace }) => ({ user, contentType, curWs: currentWorkspace })
export default connect(mapStateToProps)(translate()(Dashboard))
