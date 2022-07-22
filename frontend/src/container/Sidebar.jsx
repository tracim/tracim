import React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { isMobile } from 'react-device-detect'
import appFactory from '../util/appFactory.js'
import WorkspaceListItem from '../component/Sidebar/WorkspaceListItem.jsx'
import { addWorkspaceList } from '../action-creator.sync.js'
import Logo from '../component/Header/Logo.jsx'
import MenuProfil from '../component/Header/MenuActionListItem/MenuProfil.jsx'
import SearchInput from '../component/Search/SearchInput.jsx'
import AdminLink from '../component/Header/MenuActionListItem/AdminLink.jsx'
import NotificationButton from '../component/Header/MenuActionListItem/NotificationButton.jsx'
import {
  ADVANCED_SEARCH_TYPE,
  NO_ACTIVE_SPACE_ID,
  TRACIM_APP_VERSION,
  findUserRoleIdInWorkspace,
  getUserProfile,
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
  Icon,
  NUMBER_RESULTS_BY_PAGE,
  IconButton,
  PAGE
} from 'tracim_frontend_lib'
import {
  logoutUser
} from '../action-creator.async.js'

const TRACIM_LOGO_PATH = '/assets/branding/images/tracim-logo.png'
const qs = require('query-string')

export class Sidebar extends React.Component {
  constructor(props) {
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

  getSidebarItem = (label, icon, to) => {
    return (
      <Link
        className={classnames('sidebar__content__navigation__item sidebar__content__navigation__item__wrapper',
          {
            'sidebar__content__navigation__item__current primaryColorBorder':
              this.props.location.pathname.endsWith(to)
          }
        )}
        to={to}
        onClick={isMobile ? this.handleClickToggleSidebar : () => { }}
      >
        <div
          className='sidebar__content__navigation__item__name'
          title={label}
        >
          <Icon
            icon={icon}
            title={label}
            color='white'
          />
          &nbsp;{label}
        </div>
      </Link>
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

  handleClickScrollUp = () => this.workspaceListTop.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' })

  handleClickNewWorkspace = () => this.props.renderAppPopupCreation(workspaceConfig, this.props.user, null, null)

  handleClickJoinWorkspace = () => { this.props.history.push(PAGE.JOIN_WORKSPACE) }

  render () {
    const { props, state } = this

    if (!this.shouldDisplaySidebar(this.props)) return null

    const isToDoEnabled = props.appList.some(a => a.slug === 'contents/todo')

    return (
      <div className='sidebar'>
        <Logo to={PAGE.HOME} logoSrc={TRACIM_LOGO_PATH} />
        <div className={classnames('sidebar__expand', { sidebarclose: state.sidebarClose })} onClick={this.handleClickToggleSidebar}>
          {state.sidebarClose
            ? <i className={classnames('fas', 'fa-chevron-right')} title={props.t('See sidebar')} />
            : <i className={classnames('fas', 'fa-chevron-left')} title={props.t('Hide sidebar')} />}
        </div>
        <div ref={this.frameRef} className={classnames('sidebar__frame', { sidebarclose: state.sidebarClose })}>
          <div className='sidebar__scrollview'>
            {/*
            FIXME - CH - 2019-04-04 - button scroll to top removed for now
            see https://github.com/tracim/tracim/issues/1554
            <div className='sidebar__scrollup' onClick={this.handleClickScrollUp}>
              <i className='fas fa-chevron-up' />
            </div>
            */}

            <div className='sidebar__content'>
              <div id='sidebar__content__scrolltopmarker' style={{ visibility: 'hidden' }} ref={el => { this.workspaceListTop = el }} />

              <nav className={classnames('sidebar__content__navigation', { sidebarclose: state.sidebarClose })}>
                <MenuProfil
                  user={props.user}
                  onClickLogout={this.handleClickLogout}
                />
                <SearchInput
                  className='header__menu__rightside__search'
                  onClickSearch={this.handleClickSearch}
                  searchString={props.simpleSearch.searchString}
                />
                {props.user.profile === PROFILE.administrator.slug && (
                  <AdminLink />
                )}
                <NotificationButton
                  unreadMentionCount={props.unreadMentionCount}
                  unreadNotificationCount={props.unreadNotificationCount}
                  onClickNotification={props.onClickNotification}
                />
                {props.appList.some(a => a.slug === 'agenda') && (
                    <Link
                      className='btn outlineTextBtn primaryColorBorder nohover'
                      to={PAGE.AGENDA}
                    >
                        <i className='fas fa-fw fa-calendar-alt' />
                        {props.t('Agendas')}
                    </Link>
                )}
                {this.getSidebarItem(props.t('Recent activities'), 'far fa-newspaper', PAGE.RECENT_ACTIVITIES)}
                {isToDoEnabled && this.getSidebarItem(props.t('My tasks'), 'fas fa-check-square', PAGE.TODO)}
                {this.getSidebarItem(props.t('Favorites'), 'far fa-star', PAGE.FAVORITES)}
                <ul className='sidebar__content__navigation__workspace'>
                  {this.displaySpace(0, createSpaceTree(sortWorkspaceList(props.workspaceList)))}
                </ul>
              </nav>
            </div>

            <div className='sidebar__footer'>
              <div className='sidebar__footer__buttons'>
                {getUserProfile(props.user.profile).id >= PROFILE.manager.id && (
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
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ accessibleWorkspaceList, appList, system, user, workspaceList, simpleSearch }) => ({ accessibleWorkspaceList, appList, system, user, workspaceList, simpleSearch })
export default withRouter(connect(mapStateToProps)(appFactory(translate()(TracimComponent(Sidebar)))))
