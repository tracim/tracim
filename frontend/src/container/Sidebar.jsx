import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import {
  CUSTOM_EVENT,
  Icon,
  NUMBER_RESULTS_BY_PAGE,
  PAGE,
  PROFILE,
  scrollIntoViewIfNeeded,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  ADVANCED_SEARCH_TYPE,
  ALL_CONTENT_TYPES,
  NO_ACTIVE_SPACE_ID,
  SEARCH_TYPE,
  TRACIM_APP_VERSION,
  unLoggedAllowedPageList,
  workspaceConfig
} from '../util/helper.js'
import { addWorkspaceList } from '../action-creator.sync.js'
import { logoutUser } from '../action-creator.async.js'
import appFactory from '../util/appFactory.js'
import Logo from '../component/Logo.jsx'
import SearchInput from '../component/Search/SearchInput.jsx'
import SidebarItem from '../component/Sidebar/SidebarItem.jsx'
import SidebarSpaceList from '../component/Sidebar/SidebarSpaceList.jsx'
import SidebarUserItemList from '../component/Sidebar/SidebarUserItemList.jsx'

const qs = require('query-string')

export class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.frameRef = React.createRef()
    this.state = {
      activeSpaceId: NO_ACTIVE_SPACE_ID,
      foldedSpaceList: [],
      isSidebarClosed: isMobile,
      showSpaceList: true,
      showUserItems: false
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_CREATE_WORKSPACE_POPUP, handler: this.handleClickNewSpace }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.CREATED, handler: this.handleTlmMemberCreated }
    ])
  }

  handleTlmMemberCreated = tlmFieldObject => {
    const { props } = this

    const tlmUser = tlmFieldObject.fields.user
    const tlmWorkspace = tlmFieldObject.fields.workspace
    const loggedUserId = props.user.userId

    if (loggedUserId === tlmUser.user_id) {
      props.dispatch(addWorkspaceList([tlmWorkspace]))
    }
  }

  handleClickSearch = async (searchString) => {
    const { props } = this
    if (isMobile && !this.state.isSidebarClosed) this.handleClickToggleSidebar()
    const FIRST_PAGE = 1

    // INFO - GB - 2019-06-07 - When we do a search, the parameters need to be in default mode.
    // Respectively, we have arc for show_archived=0 (false), del for show_deleted=0 (false) and act for show_active=1 (true)
    const newUrlSearchObject = {
      t: ALL_CONTENT_TYPES,
      q: searchString,
      p: FIRST_PAGE,
      nr: NUMBER_RESULTS_BY_PAGE,
      arc: 0,
      del: 0,
      act: 1,
      s: props.system.config.search_engine === SEARCH_TYPE.ADVANCED ? ADVANCED_SEARCH_TYPE.CONTENT : SEARCH_TYPE.SIMPLE
    }

    props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify(newUrlSearchObject, { encode: true }))
  }

  handleToggleFoldChildren = (id) => {
    const { state } = this
    if (state.foldedSpaceList.find(spaceId => spaceId === id)) {
      const newFoldedSpaceList = state.foldedSpaceList.filter(spaceId => spaceId !== id)
      this.setState({ foldedSpaceList: newFoldedSpaceList })
    } else this.setState(prev => ({ foldedSpaceList: [...prev.foldedSpaceList, id] }))
  }

  componentDidMount () {
    const { props } = this
    if (!this.shouldDisplaySidebar(props)) return

    if (props.location.pathname.includes(PAGE.WORKSPACE.ROOT)) {
      const urlElements = props.location.pathname.split('/')
      const spaceIdInUrl = parseInt(urlElements[urlElements.indexOf('workspaces') + 1])

      if (props.workspaceList.find(space => space.id === spaceIdInUrl) !== undefined) {
        this.setState({ activeSpaceId: spaceIdInUrl })
      }
    }
  }

  componentDidUpdate (prevProps) {
    const { props } = this
    if (prevProps.currentWorkspace.id !== props.currentWorkspace.id) {
      const spaceListItem = document.getElementById(`sidebar-space-item-${props.currentWorkspace.id}`)
      scrollIntoViewIfNeeded(spaceListItem, this.frameRef.current)
    }
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  // INFO - CH - 2018-10-19 - pass props to allow to pass nextProps in shouldComponentUpdate
  shouldDisplaySidebar = props => {
    return !unLoggedAllowedPageList.some(url => props.location.pathname.startsWith(url))
  }

  handleClickToggleSidebar = () => {
    GLOBAL_dispatchEvent({
      type: this.state.isSidebarClosed
        ? CUSTOM_EVENT.SHOW_SIDEBAR
        : CUSTOM_EVENT.HIDE_SIDEBAR,
      data: {}
    })
    this.setState(previousState => ({ isSidebarClosed: !previousState.isSidebarClosed }))
  }

  handleClickOpenSpaceList = () => this.setState({ showSpaceList: true })

  handleClickOpenUserItems = () => this.setState({ showUserItems: true })

  handleClickToggleSpaceList = () => this.setState(previousState => ({ showSpaceList: !previousState.showSpaceList }))

  handleClickToggleUserItems = () => this.setState(previousState => ({ showUserItems: !previousState.showUserItems }))

  handleClickLogout = () => this.props.dispatch(logoutUser(this.props.history))

  handleClickNewSpace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  handleClickJoinWorkspace = () => this.props.history.push(PAGE.JOIN_WORKSPACE)

  render () {
    const { props, state } = this

    if (!this.shouldDisplaySidebar(props)) return null

    const isToDoEnabled = props.appList.some(a => a.slug === 'contents/todo')
    const isAgendaEnabled = props.appList.some(a => a.slug === 'agenda')
    const isUserAdministrator = props.user.profile === PROFILE.administrator.slug
    const isUserManager = props.user.profile === PROFILE.manager.slug

    return (
      <div ref={this.frameRef} className={classnames('sidebar', { sidebarClose: state.isSidebarClosed })}>
        <div className='sidebar__header'>
          <button
            className='btn transparentButton sidebar__header__logo'
            onClick={() => { if (isMobile && !state.isSidebarClosed) this.handleClickToggleSidebar() }}
          >
            <Logo to={PAGE.HOME} />
          </button>
          <button className='btn transparentButton sidebar__header__expand' onClick={this.handleClickToggleSidebar}>
            <Icon
              icon='fas fa-bars'
              title={state.isSidebarClosed ? props.t('See sidebar') : props.t('Hide sidebar')}
            />
          </button>
        </div>

        <div
          id='customToolboxHeaderBtn'
          className='header__menu__rightside__specificBtn'
        />

        <div
          className={classnames('sidebar__search', {
            'sidebar__item__current primaryColorBorder primaryColorBgOpacity':
              props.location.pathname === PAGE.SEARCH_RESULT && !props.isNotificationWallOpen
          })}
        >
          <SearchInput
            onClickSearch={this.handleClickSearch}
            searchString={props.simpleSearch.searchString}
          />

          <SidebarItem
            customClass='sidebar__search__item'
            label={props.t('Search')}
            icon='fas fa-search'
            onClickItem={() => this.handleClickSearch('')}
          />
        </div>

        <SidebarItem
          customClass='sidebar__activities__item'
          to={PAGE.RECENT_ACTIVITIES}
          label={props.t('Recent activities')}
          icon='fas fa-newspaper'
          isCurrentItem={props.location.pathname === PAGE.RECENT_ACTIVITIES && !props.isNotificationWallOpen}
          isSidebarClosed={state.isSidebarClosed}
          onClickToggleSidebar={this.handleClickToggleSidebar}
        />

        <SidebarItem
          customClass='sidebar__notification__item'
          label={props.t('Notifications')}
          icon='fas fa-bell'
          isCurrentItem={props.isNotificationWallOpen}
          isSidebarClosed={state.isSidebarClosed}
          onClickItem={props.onClickNotification}
          onClickToggleSidebar={this.handleClickToggleSidebar}
          unreadMentionCount={props.unreadMentionCount}
          unreadNotificationCount={props.unreadNotificationCount}
        />

        <SidebarUserItemList
          isAgendaEnabled={isAgendaEnabled}
          isNotificationWallOpen={props.isNotificationWallOpen}
          isSidebarClosed={state.isSidebarClosed}
          isToDoEnabled={isToDoEnabled}
          isUserAdministrator={isUserAdministrator}
          location={props.location}
          onClickLogout={this.handleClickLogout}
          onClickOpenUserItems={this.handleClickOpenUserItems}
          onClickToggleSidebar={this.handleClickToggleSidebar}
          onClickToggleUserItems={this.handleClickToggleUserItems}
          showUserItems={state.showUserItems}
          user={props.user}
        />

        <SidebarSpaceList
          accessibleWorkspaceList={props.accessibleWorkspaceList}
          activeSpaceId={state.activeSpaceId}
          foldedSpaceList={state.foldedSpaceList}
          isNotificationWallOpen={props.isNotificationWallOpen}
          isSidebarClosed={state.isSidebarClosed}
          isUserAdministrator={isUserAdministrator}
          isUserManager={isUserManager}
          onClickJoinWorkspace={this.handleClickJoinWorkspace}
          onClickNewSpace={this.handleClickNewSpace}
          onClickOpenSpaceList={this.handleClickOpenSpaceList}
          onClickToggleSidebar={this.handleClickToggleSidebar}
          onClickToggleSpaceList={this.handleClickToggleSpaceList}
          onToggleFoldChildren={this.handleToggleFoldChildren}
          showSpaceList={state.showSpaceList}
          spaceList={props.workspaceList}
          userId={props.user.userId}
        />

        <div className='sidebar__emptyZone' onClick={this.handleClickToggleSidebar} />

        <div className='sidebar__footer'>
          <div className='sidebar__footer__text'>
            {TRACIM_APP_VERSION}
          </div>
          <div className='sidebar__footer__text'>
            Copyright - 2013 - 2022
            <div className='sidebar__footer__text__link'>
              <a href='https://www.algoo.fr/fr/tracim' target='_blank' rel='noopener noreferrer'>tracim.fr</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({
  accessibleWorkspaceList,
  appList,
  system,
  simpleSearch,
  user,
  workspaceList
}) => ({
  accessibleWorkspaceList,
  appList,
  simpleSearch,
  system,
  user,
  workspaceList
})
export default connect(mapStateToProps)(appFactory(translate()(TracimComponent(Sidebar))))

Sidebar.propTypes = {
  isNotificationWallOpen: PropTypes.bool,
  onClickNotification: PropTypes.func,
  unreadMentionCount: PropTypes.number,
  unreadNotificationCount: PropTypes.number
}

Sidebar.defaultProps = {
  isNotificationWallOpen: false,
  onClickNotification: () => { },
  unreadMentionCount: 0,
  unreadNotificationCount: 0
}
