import React from 'react'
import { connect } from 'react-redux'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import {
  DRAG_AND_DROP,
  NO_ACTIVE_SPACE_ID
  // flattenNotificationAndGroupList
} from '../../util/helper.js'
import { IconButton, ROLE, DropdownMenu, PAGE } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'
import {
  putNotificationAsRead
} from '../../action-creator.async.js'
import {
  newFlashMessage,
  readNotification
} from '../../action-creator.sync.js'

const qs = require('query-string')

class WorkspaceListItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showDropdownMenuButton: isMobile,
      dropdownMenuIsActive: isMobile,
      isUnread: false,
      mentionCount: 0
    }
  }

  componentDidMount () {
    document.addEventListener('mousedown', this.handleClickOutsideDropdownMenu)
  }

  componentDidUpdate () {
    const isUnread = this.props.notificationPage.flattenList.some(n => !n.mention && !n.read && (n.workspace.id === this.props.workspaceId))
    const mentionCount = this.props.notificationPage.flattenList.filter(n => n.mention && !n.read && (n.workspace.id === this.props.workspaceId)).length

    if (this.state.isUnread !== isUnread || this.state.mentionCount !== mentionCount) {
      this.setState({ isUnread: isUnread })
      this.setState({ mentionCount: mentionCount })
    }
  }

  componentWillUnmount () {
    document.removeEventListener('mousedown', this.handleClickOutsideDropdownMenu)
  }

  buildLink = (route, search, workspaceId, activeWorkspaceId) => {
    if (workspaceId !== activeWorkspaceId) return route

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
    const isDropAllowedOnWorkspaceRoot = props.draggedItem && (props.draggedItem.workspaceId !== props.workspaceId || props.draggedItem.parentId !== 0)

    if (isDropAllowed && isDropAllowedOnWorkspaceRoot) return 'fa-arrow-circle-down'
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

    if (isMobile) {
      this.props.onClickToggleSidebar()
    }
  }

  handleMouseEnterItem = () => this.setState({ showDropdownMenuButton: true })

  handleMouseLeaveItem = () => this.setState(prev => ({ showDropdownMenuButton: isMobile ? true : prev.dropdownMenuIsActive }))

  handleReadSpaceNotifications = async () => {
    const { props } = this

    await Promise.all(
      this.props.notificationPage.flattenList
        .filter(n => !n.mention && !n.read)
        .map(n => n.id)
        .map(async (notificationId) => {
          const fetchPutNotificationAsRead = await props.dispatch(putNotificationAsRead(props.user.userId, notificationId))
          switch (fetchPutNotificationAsRead.status) {
            case 204: {
              props.dispatch(readNotification(notificationId))
              break
            }
            default:
              props.dispatch(newFlashMessage(props.t('Error while marking the notification as read'), 'warning'))
          }
        })
    )
  }

  render () {
    const { props, state } = this
    const INDENT_WIDTH = 20
    const BASE_MARGIN = 20

    return (
      <li
        id={props.id}
        className={classnames(
          'sidebar__content__navigation__item',
          {
            'primaryColorBorder sidebar__content__navigation__item__current':
              props.location.pathname.includes(`${PAGE.WORKSPACE.ROOT}/${props.workspaceId}/`)
          },
          {
            sidebar__content__navigation__item__unread: state.isUnread
          }
        )}
        data-cy={`sidebar__content__navigation__workspace__item_${props.workspaceId}`}
        ref={props.connectDropTarget}
        onMouseEnter={this.handleMouseEnterItem}
        onMouseLeave={this.handleMouseLeaveItem}
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
            customClass='transparentButton sidebar__content__navigation__item__foldChildren'
            icon={`fas fa-caret-${props.foldChildren ? 'right' : 'down'}`}
            title={props.foldChildren ? props.t('Show subspaces') : props.t('Hide subspaces')}
            intent='link'
            mode='light'
            onClick={props.onToggleFoldChildren}
          />
        )}

        <Link
          className={classnames(
            'sidebar__content__navigation__item__wrapper',
            { sidebar__content__navigation__item__withoutChildren: !props.hasChildren }
          )}
          to={PAGE.WORKSPACE.DASHBOARD(props.workspaceId)}
          onClick={this.handleClickSpace}
        >
          {(props.canDrop && props.isOver) && (
            <i className={`fas fa-fw ${this.getIcon()} sidebar__content__navigation__item__dragNdrop`} />
          )}

          <div
            className='sidebar__content__navigation__item__name'
            title={props.label}
          >
            <div
              className='label'
            >
              {props.label}
            </div>
            {state.mentionCount > 0 && <div className='sidebar__mention'>{state.mentionCount}</div>}
          </div>
        </Link>

        {state.showDropdownMenuButton && (
          <DropdownMenu
            buttonIcon='fas fa-ellipsis-v'
            buttonCustomClass='sidebar__content__navigation__item__menu'
            buttonTooltip={props.t('Actions')}
            buttonClick={this.activeDropdownMenu}
          >
            {props.allowedAppList.map(allowedApp => (
              <Link
                to={this.buildLink(allowedApp.route, props.location.search, props.workspaceId, props.activeWorkspaceId)}
                data-cy={`sidebar_subdropdown-${allowedApp.slug}`}
                key={allowedApp.slug}
              >
                <i className={`fa-fw ${allowedApp.faIcon}`} />
                {props.t(allowedApp.label)}
              </Link>
            ))}
          </DropdownMenu>
        )}
      </li>
    )
  }
}

const dragAndDropTarget = {
  drop: props => ({
    workspaceId: props.workspaceId,
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
export default DropTarget(DRAG_AND_DROP.CONTENT_ITEM, dragAndDropTarget, dragAndDropTargetCollect)(connect(mapStateToProps)(withRouter(translate()(WorkspaceListItem))))

WorkspaceListItem.propTypes = {
  activeWorkspaceId: PropTypes.number,
  allowedAppList: PropTypes.array,
  foldChildren: PropTypes.bool,
  hasChildren: PropTypes.bool,
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  level: PropTypes.number,
  onClickAllContent: PropTypes.func,
  onClickToggleSidebar: PropTypes.func,
  onToggleFoldChildren: PropTypes.func,
  userRoleIdInWorkspace: PropTypes.array,
  workspaceId: PropTypes.number.isRequired
}

WorkspaceListItem.defaultProps = {
  activeWorkspaceId: NO_ACTIVE_SPACE_ID,
  allowedAppList: [],
  foldChildren: false,
  hasChildren: false,
  level: 0,
  onClickAllContent: () => { },
  onClickToggleSidebar: () => {},
  onToggleFoldChildren: () => {},
  userRoleIdInWorkspace: ROLE.reader.id
}
