import React from 'react'
import { connect } from 'react-redux'
import Sidebar from './Sidebar.jsx'
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
  getWorkspaceReadStatusList
} from '../action-creator.async.js'
import {
  newFlashMessage,
  setWorkspaceDetail,
  setWorkspaceMemberList,
  setWorkspaceRecentActivityList,
  setWorkspaceReadStatusList
} from '../action-creator.sync.js'
import { ROLE } from '../helper.js'
import ContentTypeBtn from '../component/Dashboard/ContentTypeBtn.jsx'
import RecentActivity from '../component/Dashboard/RecentActivity.jsx'
import MemberList from '../component/Dashboard/MemberList.jsx'

class Dashboard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      workspaceIdInUrl: props.match.params.idws ? parseInt(props.match.params.idws) : null, // this is used to avoid handling the parseInt everytime
      displayNewMemberDashboard: false,
      displayNotifBtn: false,
      displayWebdavBtn: false,
      displayCalendarBtn: false
    }
  }

  async componentDidMount () {
    const { props, state } = this

    const fetchWorkspaceDetail = await props.dispatch(getWorkspaceDetail(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceDetail.status) {
      case 200:
        props.dispatch(setWorkspaceDetail(fetchWorkspaceDetail.json)); break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened when fetching workspace detail'), 'warning')); break
    }

    const fetchWorkspaceMemberList = await props.dispatch(getWorkspaceMemberList(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceMemberList.status) {
      case 200:
        props.dispatch(setWorkspaceMemberList(fetchWorkspaceMemberList.json)); break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while fetching member list'), 'warning')); break
    }

    const fetchWorkspaceRecentActivityList = await props.dispatch(getWorkspaceRecentActivityList(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceRecentActivityList.status) {
      case 200:
        props.dispatch(setWorkspaceRecentActivityList(fetchWorkspaceRecentActivityList.json)); break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while fetching recent activity list'), 'warning')); break
    }

    const fetchWorkspaceReadStatusList = await props.dispatch(getWorkspaceReadStatusList(props.user, state.workspaceIdInUrl))
    switch (fetchWorkspaceReadStatusList.status) {
      case 200:
        props.dispatch(setWorkspaceReadStatusList(fetchWorkspaceReadStatusList.json)); break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened while fetching read status list'), 'warning')); break
    }
  }

  handleToggleNewMemberDashboard = () => this.setState(prevState => ({
    displayNewMemberDashboard: !prevState.displayNewMemberDashboard
  }))

  handleToggleNotifBtn = () => this.setState(prevState => ({
    displayNotifBtn: !prevState.displayNotifBtn
  }))

  handleToggleWebdavBtn = () => this.setState(prevState => ({
    displayWebdavBtn: !prevState.displayWebdavBtn
  }))

  handleToggleCalendarBtn = () => this.setState(prevState => ({
    displayCalendarBtn: !prevState.displayCalendarBtn
  }))

  render () {
    const { props, state } = this

    return (
      <div className='sidebarpagecontainer'>
        <Sidebar />

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
                <div className='dashboard__workspace__title'>
                  {props.curWs.label}
                </div>

                <div className='dashboard__workspace__detail'>
                  {props.curWs.description}
                </div>
              </div>

              <div className='dashboard__userstatut'>
                <div className='dashboard__userstatut__role'>
                  <div className='dashboard__userstatut__role__msg'>
                    {props.t(`Hi ! ${props.user.public_name} `)}{props.t('currently, you are ')}
                  </div>

                  {(() => {
                    const myself = props.curWs.memberList.find(m => m.id === props.user.user_id)
                    if (myself === undefined) return

                    const myRole = ROLE.find(r => r.slug === myself.role)

                    return (
                      <div className='dashboard__userstatut__role__definition'>
                        <div className='dashboard__userstatut__role__definition__icon'>
                          <i className={`fa fa-${myRole.faIcon}`} />
                        </div>

                        <div className='dashboard__userstatut__role__definition__text'>
                          {myRole.label}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className='dashboard__userstatut__notification'>
                  <div className='dashboard__userstatut__notification__text'>
                    {props.t("You have subscribed to this workspace's notifications")} (nyi)
                  </div>

                  {state.displayNotifBtn
                    ? (
                      <div className='dashboard__userstatut__notification__subscribe dropdown'>
                        <button
                          className='dashboard__userstatut__notification__subscribe__btn btn btn-outline-primary dropdown-toggle'
                          type='button'
                          id='dropdownMenuButton'
                          data-toggle='dropdown'
                          aria-haspopup='true'
                          aria-expanded='false'
                        >
                          {props.t('subscriber')}
                        </button>

                        <div className='dashboard__userstatut__notification__subscribe__submenu dropdown-menu'>
                          <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item'>
                            {props.t('subscriber')}
                          </div>
                          <div className='dashboard__userstatut__notification__subscribe__submenu__item dropdown-item dropdown-item'>
                            {props.t('unsubscribed')}
                          </div>
                        </div>
                      </div>
                    )
                    : (
                      <div
                        className='dashboard__userstatut__notification__btn btn btn-outline-primary'
                        onClick={this.handleToggleNotifBtn}
                      >
                        {props.t('Change your status')}
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            <div className='dashboard__calltoaction justify-content-xl-center'>
              {props.contentType.map(ct =>
                <ContentTypeBtn
                  customClass='dashboard__calltoaction__button'
                  hexcolor={ct.hexcolor}
                  label={ct.label}
                  faIcon={ct.faIcon}
                  creationLabel={ct.creationLabel}
                  key={ct.label}
                />
              )}
            </div>

            <div className='dashboard__workspaceInfo'>
              <RecentActivity
                customClass='dashboard__activity'
                recentActivityFilteredForUser={props.curWs.recentActivityList.filter(content => !props.curWs.contentReadStatusList.includes(content.id))}
                contentTypeList={props.contentType}
                onClickSeeMore={() => {}}
                t={props.t}
              />

              <MemberList
                customClass='dashboard__memberlist'
                memberList={props.curWs.memberList}
                roleList={ROLE}
                t={props.t}
              />
            </div>

            <div className='dashboard__moreinfo'>
              <div className='dashboard__moreinfo__webdav genericBtnInfoDashboard'>
                <div
                  className='dashboard__moreinfo__webdav__btn genericBtnInfoDashboard__btn'
                  onClick={this.handleToggleWebdavBtn}
                >
                  <div className='dashboard__moreinfo__webdav__btn__icon genericBtnInfoDashboard__btn__icon'>
                    <i className='fa fa-windows' />
                  </div>

                  <div className='dashboard__moreinfo__webdav__btn__text genericBtnInfoDashboard__btn__text'>
                    {this.props.t('Implement Tracim in your explorer')}
                  </div>
                </div>
                {this.state.displayWebdavBtn === true &&
                <div>
                  <div className='dashboard__moreinfo__webdav__information genericBtnInfoDashboard__info'>
                    <div className='dashboard__moreinfo__webdav__information__text genericBtnInfoDashboard__info__text'>
                      {this.props.t('Find all your documents deposited online directly on your computer via the workstation, without going through the software.')}'
                    </div>

                    <div className='dashboard__moreinfo__webdav__information__link genericBtnInfoDashboard__info__link'>
                      http://algoo.trac.im/webdav/
                    </div>
                  </div>
                </div>
                }
              </div>
              <div className='dashboard__moreinfo__calendar genericBtnInfoDashboard'>
                <div className='dashboard__moreinfo__calendar__wrapperBtn'>
                  <div
                    className='dashboard__moreinfo__calendar__btn genericBtnInfoDashboard__btn'
                    onClick={this.handleToggleCalendarBtn}
                  >
                    <div className='dashboard__moreinfo__calendar__btn__icon genericBtnInfoDashboard__btn__icon'>
                      <i className='fa fa-calendar' />
                    </div>

                    <div className='dashboard__moreinfo__calendar__btn__text genericBtnInfoDashboard__btn__text'>
                      {this.props.t('Workspace Calendar')}
                    </div>
                  </div>
                </div>
                <div className='dashboard__moreinfo__calendar__wrapperText'>
                  {this.state.displayCalendarBtn === true &&
                  <div>
                    <div className='dashboard__moreinfo__calendar__information genericBtnInfoDashboard__info'>
                      <div className='dashboard__moreinfo__calendar__information__text genericBtnInfoDashboard__info__text'>
                        {this.props.t('Each workspace has its own calendar.')}
                      </div>

                      <div className='dashboard__moreinfo__calendar__information__link genericBtnInfoDashboard__info__link'>
                        http://algoo.trac.im/calendar/
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
            </div>
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ user, contentType, currentWorkspace }) => ({ user, contentType, curWs: currentWorkspace })
export default connect(mapStateToProps)(translate()(Dashboard))
