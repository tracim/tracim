import React from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import appFactory from '../util/appFactory.js'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import { addWorkspaceList } from '../action-creator.sync.js'
import Logo from '../component/Logo.jsx'
import MenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import SearchInput from '../component/Search/SearchInput.jsx'
import {
  ADVANCED_SEARCH_TYPE,
  NO_ACTIVE_SPACE_ID,
  TRACIM_APP_VERSION,
  findUserRoleIdInWorkspace,
  workspaceConfig,
  ALL_CONTENT_TYPES,
  SEARCH_TYPE,
  unLoggedAllowedPageList
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
  scrollIntoViewIfNeeded,
  NUMBER_RESULTS_BY_PAGE,
  IconButton,
  PAGE
} from 'tracim_frontend_lib'
import {
  logoutUser
} from '../action-creator.async.js'
import SidebarItem from '../component/Sidebar/SidebarItem.jsx'

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'
const qs = require('query-string')

export class Sidebar extends React.Component {
  constructor (props) { // TODO GIULIA Passar em hooks
    super(props)
    this.frameRef = React.createRef()
    this.state = {
      activeWorkspaceId: NO_ACTIVE_SPACE_ID,
      foldedSpaceList: [],
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
    const tlmWorkspace = tlmFieldObject.fields.workspace
    const loggedUserId = props.user.userId

    if (loggedUserId === tlmUser.user_id) {
      props.dispatch(addWorkspaceList([tlmWorkspace]))
    }
  }

  spaceItemId = (id) => `sidebar-space-item-${id}`

  displaySpace = (spaceLevel, spaceList) => {
    const { props, state } = this

    return spaceList.map(space =>
      <React.Fragment key={space.id}>
        <WorkspaceListItem
          activeWorkspaceId={state.activeWorkspaceId}
          allowedAppList={space.sidebarEntryList}
          foldChildren={!!state.foldedSpaceList.find(id => id === space.id)}
          hasChildren={space.children.length > 0}
          id={this.spaceItemId(space.id)}
          label={space.label}
          level={spaceLevel}
          onClickAllContent={this.handleClickAllContent}
          onClickToggleSidebar={this.handleClickToggleSidebar}
          onToggleFoldChildren={() => this.handleToggleFoldChildren(space.id)}
          userRoleIdInWorkspace={[findUserRoleIdInWorkspace(props.user.userId, space.memberList, ROLE_LIST)]}
          workspaceId={space.id}
          isNotificationWallOpen={props.isNotificationWallOpen}
        />
        {!state.foldedSpaceList.find(id => id === space.id) &&
          space.children.length !== 0 &&
          this.displaySpace(spaceLevel + 1, space.children)}
      </React.Fragment>
    )
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
    if (prevProps.currentWorkspace.id !== this.props.currentWorkspace.id) {
      const spaceListItem = document.getElementById(this.spaceItemId(this.props.currentWorkspace.id))
      scrollIntoViewIfNeeded(spaceListItem, this.frameRef.current)
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

  handleClickToggleSidebar = () => {
    GLOBAL_dispatchEvent({
      type: this.state.sidebarClose
        ? CUSTOM_EVENT.SHOW_SIDEBAR
        : CUSTOM_EVENT.HIDE_SIDEBAR,
      data: {}
    })
    this.setState(previousState => ({ sidebarClose: !previousState.sidebarClose }))
  }

  handleClickLogout = () => {
    this.props.dispatch(logoutUser(this.props.history))
  }

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  handleClickJoinWorkspace = () => { this.props.history.push(PAGE.JOIN_WORKSPACE) }

  /* TODO GIULIA
   - Talvez dividir o componente em 3+ : opçoes, espaços, footer.
   - Fazer titulo pros espaços
   - Mecanismo de fold/unfold.
   - Fix titulos que estao se mexendo quando item ativo.
   - Fix scroll.
   - Closed sidebar
  */
  render () {
    const { props, state } = this

    if (!this.shouldDisplaySidebar(this.props)) return null

    const isToDoEnabled = props.appList.some(a => a.slug === 'contents/todo')
    const isAgendaEnabled = props.appList.some(a => a.slug === 'agenda')
    const isUserAdministrator = props.user.profile === PROFILE.administrator.slug
    const isUserManager = props.user.profile === PROFILE.manager.slug

    return (
      <div ref={this.frameRef} className={classnames('sidebar', { sidebarclose: state.sidebarClose })}>
        <div className='sidebar__header'>
          <Logo to={PAGE.HOME} logoSrc={TRACIM_LOGO_PATH} />
          <button className={classnames('transparentButton sidebar__header__expand', { sidebarclose: state.sidebarClose })} onClick={this.handleClickToggleSidebar}>
            {state.sidebarClose
              ? <i className='fas fa-chevron-right' title={props.t('See sidebar')} />
              : <i className='fas fa-chevron-left' title={props.t('Hide sidebar')} />}
          </button>
        </div>

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
        </div>

        <MenuProfil
          user={props.user}
          onClickLogout={this.handleClickLogout}
          isCurrentItem={props.location.pathname === PAGE.PUBLIC_PROFILE(props.user.userId) && !props.isNotificationWallOpen}
        />

        <SidebarItem
          to={PAGE.ACCOUNT}
          label={props.t('Account Settings')}
          icon='fas fa-cogs'
          isCurrentItem={props.location.pathname === PAGE.ACCOUNT && !props.isNotificationWallOpen}
          dataCy='menuprofil__dropdown__account__link'
        />

        <SidebarItem
          label={props.t('Log out')}
          icon='fas fa-sign-out-alt'
          onClickItem={this.handleClickLogout}
          dataCy='menuprofil__dropdown__logout__link'
        />

        <SidebarItem
          label={props.t('Notifications')}
          icon='far fa-bell'
          onClickItem={props.onClickNotification}
          unreadMentionCount={props.unreadMentionCount}
          unreadNotificationCount={props.unreadNotificationCount}
          isCurrentItem={props.isNotificationWallOpen}
        />

        {isUserAdministrator && (
          <SidebarItem
            to={PAGE.ADMIN.WORKSPACE}
            label={props.t('Space management')}
            icon={workspaceConfig.faIcon}
            isCurrentItem={props.location.pathname === PAGE.ADMIN.WORKSPACE && !props.isNotificationWallOpen}
          />
        )}

        {isUserAdministrator && (
          <SidebarItem
            to={PAGE.ADMIN.USER}
            label={props.t('User account management')}
            icon='far fa-user'
            isCurrentItem={props.location.pathname === PAGE.ADMIN.USER && !props.isNotificationWallOpen}
          />
        )}

        {isAgendaEnabled && (
          <SidebarItem
            to={PAGE.AGENDA}
            label={props.t('Agendas')}
            icon='fas fa-calendar-alt'
            isCurrentItem={props.location.pathname === PAGE.AGENDA && !props.isNotificationWallOpen}
          />
        )}

        {isToDoEnabled && (
          <SidebarItem
            to={PAGE.TODO}
            label={props.t('My tasks')}
            icon='fas fa-check-square'
            isCurrentItem={props.location.pathname === PAGE.TODO && !props.isNotificationWallOpen}
          />
        )}

        <SidebarItem
          to={PAGE.FAVORITES}
          label={props.t('Favorites')}
          icon='far fa-star'
          isCurrentItem={props.location.pathname === PAGE.FAVORITES && !props.isNotificationWallOpen}
        />

        <SidebarItem
          to={PAGE.RECENT_ACTIVITIES}
          label={props.t('Recent activities')}
          icon='far fa-newspaper'
          isCurrentItem={props.location.pathname === PAGE.RECENT_ACTIVITIES && !props.isNotificationWallOpen}
        />

        {this.displaySpace(0, createSpaceTree(sortWorkspaceList(props.workspaceList)))}

        <div className='sidebar__footer'>
          <div className='sidebar__footer__buttons'>
            {(isUserManager || isUserAdministrator) && (
              <IconButton
                onClick={this.handleClickNewWorkspace}
                dataCy='sidebarCreateWorkspaceBtn'
                icon='fas fa-plus'
                text={props.t('Create a space')}
                textMobile={props.t('Create a space')}
                mode='light'
              />
            )}
            {props.accessibleWorkspaceList.length > 0 && (
              <IconButton
                onClick={this.handleClickJoinWorkspace}
                dataCy='sidebarJoinWorkspaceBtn'
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

const mapStateToProps = ({ accessibleWorkspaceList, appList, system, user, workspaceList, simpleSearch }) => ({ accessibleWorkspaceList, appList, system, user, workspaceList, simpleSearch })
export default connect(mapStateToProps)(appFactory(translate()(TracimComponent(Sidebar))))
