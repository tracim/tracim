import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import { DropTarget } from 'react-dnd'
import { isMobile } from 'react-device-detect'
import {
  DropdownMenu,
  Icon,
  IconButton,
  PAGE,
  ROLE,
  SPACE_TYPE
} from 'tracim_frontend_lib'
import { DRAG_AND_DROP, NO_ACTIVE_SPACE_ID } from '../../util/helper.js'
import { putNotificationListAsRead } from '../../action-creator.async.js'
import { newFlashMessage, readNotificationList } from '../../action-creator.sync.js'
import { LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE } from '../../container/Sidebar.jsx'

const qs = require('query-string')

class SidebarSpaceItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showDropdownMenuButton: isMobile,
      dropdownMenuIsActive: isMobile,
      unreadNotifications: [],
      unreadMentionCount: 0
    }
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutsideDropdownMenu)
  }

  componentDidUpdate () {
    const unreadNotifications = this.props.notificationPage.list.filter(
      n => !n.mention && !n.read && n.workspace && (n.workspace.id === this.props.spaceId)
    )
    const unreadMentionCount = this.props.notificationPage.list.filter(
      n => n.mention && !n.read && n.workspace && (n.workspace.id === this.props.spaceId)
    ).length

    if (this.state.unreadNotifications.length !== unreadNotifications.length || this.state.unreadMentionCount !== unreadMentionCount) {
      this.setState({
        unreadNotifications: unreadNotifications,
        unreadMentionCount: unreadMentionCount
      })
    }
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutsideDropdownMenu)
  }

  buildLink = (route, search, spaceId, activeSpaceId) => {
    if (spaceId !== activeSpaceId) return route

    if (search === '') return route

    // to keep query param (like opened folder) we need to copy theses param.
    // But "type" already is in allowedAppList.route, so we need to remove it before passing props.location.search
    let urlSearch = qs.parse(search)
    delete urlSearch.type
    urlSearch = qs.stringify(urlSearch, { encode: false })

    return `${route}${route.includes('?') ? '&' : '?'}${urlSearch}`
  }

  getIcon = () => {
    const { props } = this

    const isDropAllowed = props.userRoleIdInWorkspace >= ROLE.contentManager.id
    const isDropAllowedOnspaceRoot = props.draggedItem && (props.draggedItem.spaceId !== props.spaceId || props.draggedItem.parentId !== 0)

    if (isDropAllowed && isDropAllowedOnspaceRoot) return 'fa-arrow-circle-down'
    return 'fa-times-circle'
  }

  handleClickOutsideDropdownMenu = e => this.setState(prev => ({
    dropdownMenuIsActive: isMobile,
    showDropdownMenuButton: isMobile || (
      !(prev.dropdownMenuIsActive &&
        e.path &&
        !e.path.some(p => p.className && p.className.includes('dropdownMenuItem'))) &&
      prev.showDropdownMenuButton
    )
  }))

  activeDropdownMenu = () => this.setState({ dropdownMenuIsActive: true })

  handleClickSpace = () => {
    this.handleReadSpaceNotifications()
  }

  handleMouseEnterItem = () => this.setState({ showDropdownMenuButton: true })

  handleMouseLeaveItem = () => this.setState(prev => ({ showDropdownMenuButton: isMobile ? true : prev.dropdownMenuIsActive }))

  handleReadSpaceNotifications = async () => {
    const { props } = this

    if (this.state.unreadNotifications.length > 0) {
      const notificationList = this.state.unreadNotifications.map(n => n.id)
      const fetchPutNotificationListAsRead = await props.dispatch(
        putNotificationListAsRead(props.user.userId, notificationList)
      )
      switch (fetchPutNotificationListAsRead.status) {
        case 204:
          props.dispatch(readNotificationList(notificationList))
          break
        default:
          props.dispatch(newFlashMessage(props.t('Error while marking notifications as read'), 'warning'))
      }
    }
  }

  render () {
    const { props, state } = this
    const INDENT_WIDTH = 20
    const BASE_MARGIN = 25

    return (
      <Link
        id={props.id}
        className={classnames(
          'sidebar__item__inside_menu sidebar__item__space',
          {
            'primaryColorBorder primaryColorBgOpacity sidebar__item__current':
              props.location.pathname.includes(`${PAGE.WORKSPACE.ROOT}/${props.spaceId}/`) && !props.isNotificationWallOpen
          },
          {
            sidebar__item__unread: state.unreadNotifications.length > 0
          }
        )}
        data-cy={`sidebar__space__item_${props.spaceId}`}
        ref={props.connectDropTarget}
        onMouseEnter={this.handleMouseEnterItem}
        onMouseLeave={this.handleMouseLeaveItem}
        to={PAGE.WORKSPACE.DASHBOARD(props.spaceId)}
        onClick={this.handleClickSpace}
      >
        {// INFO - GB - 2020-10-14 - The  (level - 1) * 20 + 10 calculation is to have the sequence (10, 30, 50, 70, ...)
          // in other words, the margin starts at 10px at level 1 (first child) and increases by 20px at each new level.
          props.level > 0 && (
            <div
              style={{
                marginInlineStart: `${(props.level - 1) * INDENT_WIDTH + BASE_MARGIN}px`
              }}
            />
          )
        }

        {props.hasChildren && (
          <IconButton
            customClass={`transparentButton sidebar__item__foldChildren ${LOCK_TOGGLE_SIDEBAR_WHEN_OPENED_ON_MOBILE}`}
            icon={`fas fa-caret-${props.foldChildren ? 'right' : 'down'}`}
            title={props.foldChildren ? props.t('Show subspaces') : props.t('Hide subspaces')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              props.onToggleFoldChildren(props.spaceId)
            }}
          />
        )}

        {(props.canDrop && props.isOver) && (
          <i className={`fas fa-fw ${this.getIcon()} sidebar__item__dragNdrop`} />
        )}

        <div
          className={classnames(
            'sidebar__item',
            'sidebar__item__name',
            { sidebar__item__withoutChildren: !props.hasChildren }
          )}
          title={props.label}
        >
          <div
            className='label'
          >
            {props.label}
          </div>
          {state.unreadMentionCount > 0 && <div className='sidebar__mention'>{state.unreadMentionCount}</div>}

          {props.spaceType === SPACE_TYPE.confidential.slug && (
            <Icon
              customClass='sidebar__item__space__type'
              icon={SPACE_TYPE.confidential.faIcon}
              title={props.t('Confidential space')}
            />
          )}
        </div>

        {state.showDropdownMenuButton && (
          <DropdownMenu
            buttonIcon='fas fa-ellipsis-v'
            buttonCustomClass='sidebar__item__menu'
            buttonTooltip={props.t('Actions')}
            buttonClick={this.activeDropdownMenu}
          >
            {props.allowedAppList.map(allowedApp => (
              <Link
                to={this.buildLink(allowedApp.route, props.location.search, props.spaceId, props.activeSpaceId)}
                data-cy={`sidebar_subdropdown-${allowedApp.slug}`}
                key={allowedApp.slug}
              >
                <i className={`fa-fw ${allowedApp.faIcon}`} />
                {props.t(allowedApp.label)}
              </Link>
            ))}
          </DropdownMenu>
        )}
      </Link>
    )
  }
}

const dragAndDropTarget = {
  drop: props => ({
    workspaceId: props.spaceId,
    parentId: 0 // INFO - CH - 2019-06-05 - moving content to a different workspace is always at the root of it
  })
}

const dragAndDropTargetCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
  draggedItem: monitor.getItem()
})

const mapStateToProps = ({ notificationPage, user }) => ({ notificationPage, user })
export default DropTarget(DRAG_AND_DROP.CONTENT_ITEM, dragAndDropTarget, dragAndDropTargetCollect)(connect(mapStateToProps)(withRouter(translate()(SidebarSpaceItem))))

SidebarSpaceItem.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  spaceId: PropTypes.number.isRequired,
  spaceType: PropTypes.string.isRequired,
  activeSpaceId: PropTypes.number,
  allowedAppList: PropTypes.array,
  foldChildren: PropTypes.bool,
  hasChildren: PropTypes.bool,
  isNotificationWallOpen: PropTypes.bool,
  level: PropTypes.number,
  onToggleFoldChildren: PropTypes.func,
  userRoleIdInWorkspace: PropTypes.array
}

SidebarSpaceItem.defaultProps = {
  activeSpaceId: NO_ACTIVE_SPACE_ID,
  allowedAppList: [],
  foldChildren: false,
  hasChildren: false,
  isNotificationWallOpen: false,
  level: 0,
  onToggleFoldChildren: () => { },
  userRoleIdInWorkspace: ROLE.reader.id
}
