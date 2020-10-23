import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import appFactory from '../util/appFactory.js'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import {
  addWorkspaceList,
  addWorkspaceMember
} from '../action-creator.sync.js'
import {
  NO_ACTIVE_SPACE_ID,
  PAGE,
  workspaceConfig,
  getUserProfile,
  unLoggedAllowedPageList,
  findUserRoleIdInWorkspace,
  TRACIM_APP_VERSION
} from '../util/helper.js'
import {
  createSpaceTree,
  CUSTOM_EVENT,
  ROLE_LIST,
  sortWorkspaceList,
  PROFILE,
  TracimComponent,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  getOrCreateSessionClientToken,
  IconButton
} from 'tracim_frontend_lib'

export class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeWorkspaceId: NO_ACTIVE_SPACE_ID,
      sidebarClose: isMobile
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_CREATE_WORKSPACE_POPUP, handler: this.handleShowCreateWorkspacePopup }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleTlmMemberCreated }
    ])
  }

  // Custom Event Handler
  handleShowCreateWorkspacePopup = () => {
    this.handleClickNewWorkspace()
  }

  handleTlmMemberCreated = tlmFieldObject => {
    const { props } = this

    const tlmUser = tlmFieldObject.fields.user
    const tlmAuthor = tlmFieldObject.fields.author
    const tlmWorkspace = tlmFieldObject.fields.workspace
    const loggedUserId = props.user.userId

    if (loggedUserId === tlmUser.user_id) {
      props.dispatch(addWorkspaceList([tlmWorkspace]))
      props.dispatch(addWorkspaceMember(tlmUser, tlmWorkspace.workspace_id, tlmFieldObject.fields.member))

      // INFO - CH - 2020-06-25 - if logged used is author of the TLM and the new role is for him, it means the logged
      // user created a new workspace
      // the clientToken is to avoid redirecting the eventually opened other browser's tabs
      const clientToken = getOrCreateSessionClientToken()
      if (loggedUserId === tlmAuthor.user_id && clientToken === tlmFieldObject.fields.client_token) {
        if (tlmWorkspace.workspace_id && document.getElementById(tlmWorkspace.workspace_id)) {
          document.getElementById(tlmWorkspace.workspace_id).scrollIntoView()
        }
        props.history.push(PAGE.WORKSPACE.DASHBOARD(tlmWorkspace.workspace_id))
      }
    }
  }

  displaySpace = (spaceLevel, spaceList) => {
    const { props, state } = this

    return spaceList.map(space =>
      <span key={space.id}>
        <WorkspaceListItem
          activeWorkspaceId={state.activeWorkspaceId}
          allowedAppList={space.sidebarEntryList}
          label={space.label}
          level={spaceLevel}
          onClickAllContent={this.handleClickAllContent}
          userRoleIdInWorkspace={findUserRoleIdInWorkspace(props.user.userId, space.memberList, ROLE_LIST)}
          workspaceId={space.id}
        />
        {space.children.length !== 0 && this.displaySpace(spaceLevel + 1, space.children)}
      </span>
    )
  }

  componentDidMount () {
    const { props } = this
    if (!this.shouldDisplaySidebar(props)) return

    if (props.location.pathname.includes(PAGE.WORKSPACE.ROOT)) {
      const urlElements = props.location.pathname.split('/')
      const spaceIdInUrl = parseInt(urlElements[urlElements.indexOf('workspaces') + 1])

      if (props.workspaceList.find(space => space.id === spaceIdInUrl) !== undefined) {
        this.setState({ activeWorkspaceId: spaceIdInUrl })
      }
    }
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  shouldDisplaySidebar = props => { // pass props to allow to pass nextProps in shouldComponentUpdate
    return ![
      ...unLoggedAllowedPageList,
      ...props.workspaceList.length > 0 ? [] : [PAGE.HOME, '/ui/'] // @fixme - Côme - 2018/11/13 - have a better way than hardcoding '/ui/'
    ]
      .some(url => props.location.pathname.startsWith(url))
  }

  handleClickAllContent = idWs => this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))

  handleClickToggleSidebar = () => this.setState(prev => ({ sidebarClose: !prev.sidebarClose }))

  handleClickScrollUp = () => this.workspaceListTop.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' })

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  handleClickJoinWorkspace = () => { this.props.history.push(PAGE.JOIN_WORKSPACE) }

  render () {
    const { props, state } = this

    if (!this.shouldDisplaySidebar(this.props)) return null

    return (
      <div className='sidebar'>
        <div className={classnames('sidebar__expand', { sidebarclose: state.sidebarClose })} onClick={this.handleClickToggleSidebar}>
          {state.sidebarClose
            ? <i className={classnames('fa fa-chevron-right')} title={props.t('See sidebar')} />
            : <i className={classnames('fa fa-chevron-left')} title={props.t('Hide sidebar')} />}
        </div>
        <div className={classnames('sidebar__frame', { sidebarclose: state.sidebarClose })}>
          <div className='sidebar__scrollview'>
            {/*
            FIXME - CH - 2019-04-04 - button scroll to top removed for now
            see https://github.com/tracim/tracim/issues/1554
            <div className='sidebar__scrollup' onClick={this.handleClickScrollUp}>
              <i className='fa fa-chevron-up' />
            </div>
            */}

            <div className='sidebar__content'>
              <div id='sidebar__content__scrolltopmarker' style={{ visibility: 'hidden' }} ref={el => { this.workspaceListTop = el }} />

              <nav className={classnames('sidebar__content__navigation', { sidebarclose: state.sidebarClose })}>
                <ul className='sidebar__content__navigation__workspace'>
                  {this.displaySpace(0, createSpaceTree(sortWorkspaceList(props.workspaceList)))}
                </ul>
              </nav>

              <div className='sidebar__content__buttons'>
                {getUserProfile(props.user.profile).id >= PROFILE.manager.id && (
                  <IconButton
                    onClick={this.handleClickNewWorkspace}
                    dataCy='sidebarCreateWorkspaceBtn'
                    icon='plus'
                    text={props.t('Create a space')}
                    mode='light'
                  />
                )}
                {props.accessibleWorkspaceList.length > 0 && (
                  <IconButton
                    onClick={this.handleClickJoinWorkspace}
                    dataCy='sidebarJoinWorkspaceBtn'
                    icon='users'
                    text={props.t('Join a space')}
                    intent='primary'
                    mode='light'
                  />
                )}
              </div>
            </div>

            <div className='sidebar__footer mb-2'>
              <div className='sidebar__footer__text whiteFontColor d-flex align-items-end justify-content-center'>
                {TRACIM_APP_VERSION}
              </div>
              <div className='sidebar__footer__text whiteFontColor d-flex align-items-end justify-content-center'>
                Copyright - 2013 - 2020
                <div className='sidebar__footer__text__link'>
                  <a href='https://www.algoo.fr/fr/tracim' target='_blank' rel='noopener noreferrer' className='ml-3'>tracim.fr</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList, system, accessibleWorkspaceList }) => ({ user, workspaceList, system, accessibleWorkspaceList })
export default withRouter(connect(mapStateToProps)(appFactory(translate()(TracimComponent(Sidebar)))))
