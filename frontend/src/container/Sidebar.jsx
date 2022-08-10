import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import {
  CUSTOM_EVENT,
  IconButton,
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

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'
const qs = require('query-string')

export class Sidebar extends React.Component {
  constructor (props) {
    super(props)
    this.frameRef = React.createRef()
    this.state = {
      activeWorkspaceId: NO_ACTIVE_SPACE_ID,
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
        this.setState({ activeWorkspaceId: spaceIdInUrl })
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

  handleClickAllContent = idWs => this.props.history.push(PAGE.WORKSPACE.CONTENT_LIST(idWs))

  handleClickToggleSidebar = () => {
    GLOBAL_dispatchEvent({
      type: this.state.isSidebarClosed
        ? CUSTOM_EVENT.SHOW_SIDEBAR
        : CUSTOM_EVENT.HIDE_SIDEBAR,
      data: {}
    })
    this.setState(previousState => ({ isSidebarClosed: !previousState.isSidebarClosed }))
  }

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
          <Logo to={PAGE.HOME} logoSrc={TRACIM_LOGO_PATH} />
          <button className='transparentButton sidebar__header__expand' onClick={this.handleClickToggleSidebar}>
            {state.isSidebarClosed
              ? <i className='fas fa-chevron-right' title={props.t('See sidebar')} />
              : <i className='fas fa-chevron-left' title={props.t('Hide sidebar')} />}
          </button>
        </div>

        <div
          id='customToolboxHeaderBtn'
          className='header__menu__rightside__specificBtn'
        />

        <div
          className={classnames('sidebar__search', {
            'sidebar__item__current primaryColorBorder':
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

        <SidebarUserItemList
          isSidebarClosed={state.isSidebarClosed}
          isNotificationWallOpen={props.isNotificationWallOpen}
          user={props.user}
          onClickLogout={this.handleClickLogout}
          location={props.location}
          showUserItems={state.showUserItems}
          onClickToggleUserItems={this.handleClickToggleUserItems}
          isToDoEnabled={isToDoEnabled}
          isUserAdministrator={isUserAdministrator}
        />

        <SidebarItem
          customClass='sidebar__activities__item'
          to={PAGE.RECENT_ACTIVITIES}
          label={props.t('Recent activities')}
          icon='fas fa-newspaper'
          isCurrentItem={props.location.pathname === PAGE.RECENT_ACTIVITIES && !props.isNotificationWallOpen}
        />

        <SidebarItem
          customClass='sidebar__notification__item'
          label={props.t('Notifications')}
          icon='fas fa-bell'
          onClickItem={props.onClickNotification}
          unreadMentionCount={props.unreadMentionCount}
          unreadNotificationCount={props.unreadNotificationCount}
          isCurrentItem={props.isNotificationWallOpen}
        />

        {isAgendaEnabled && (
          <SidebarItem
            customClass='sidebar__agendas__item'
            to={PAGE.AGENDA}
            label={props.t('Agendas')}
            icon='fas fa-calendar-alt'
            isCurrentItem={props.location.pathname === PAGE.AGENDA && !props.isNotificationWallOpen}
          />
        )}

        <SidebarSpaceList
          isSidebarClosed={state.isSidebarClosed}
          showSpaceList={state.showSpaceList}
          onClickToggleSpaceList={this.handleClickToggleSpaceList}
          onClickToggleSidebar={this.handleClickToggleSidebar}
          spaceList={props.workspaceList}
          userId={props.user.userId}
          isNotificationWallOpen={props.isNotificationWallOpen}
          activeWorkspaceId={state.activeWorkspaceId}
          foldedSpaceList={state.foldedSpaceList}
          onClickAllContent={this.handleClickAllContent}
          onToggleFoldChildren={this.handleToggleFoldChildren}
        />

        <div className='sidebar__footer'>
          <div className='sidebar__footer__buttons'>
            {(isUserManager || isUserAdministrator) && (
              <IconButton
                onClick={this.handleClickNewSpace}
                dataCy='sidebarCreateSpaceBtn'
                icon='fas fa-plus'
                text={props.t('Create a space')}
                textMobile={props.t('Create a space')}
                mode='light'
              />
            )}
            {props.accessibleWorkspaceList.length > 0 && (
              <IconButton
                onClick={this.handleClickJoinWorkspace}
                dataCy='sidebarJoinSpaceBtn'
                icon='fas fa-users'
                text={props.t('Join a space')}
                textMobile={props.t('Join a space')}
                intent='primary'
                mode='light'
              />
            )}
          </div>
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
