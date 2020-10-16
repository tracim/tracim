import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { DRAG_AND_DROP, NO_ACTIVE_SPACE_ID, PAGE } from '../../util/helper.js'
import { ROLE, DropdownMenu } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'

const qs = require('query-string')

class WorkspaceListItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showDropdownMenuButton: isMobile
    }
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

  handleItemHover = () => this.setState(prev => ({ showDropdownMenuButton: isMobile ? true : !prev.showDropdownMenuButton }))

  render () {
    const { props, state } = this
    return (
      <li
        id={props.workspaceId}
        className='sidebar__content__navigation__workspace__item'
        data-cy={`sidebar__content__navigation__workspace__item_${props.workspaceId}`}
        ref={props.connectDropTarget}
        onMouseEnter={this.handleItemHover}
        onMouseLeave={this.handleItemHover}
      >
        <Link
          className='sidebar__content__navigation__workspace__item__wrapper'
          to={PAGE.WORKSPACE.DASHBOARD(props.workspaceId)}
        >
          {(props.canDrop && props.isOver) && (
            <i className={`fa fa-fw ${this.getIcon()} sidebar__content__navigation__workspace__item__dragNdrop`} />
          )}

          {// INFO - GB - 2020-10-14 - The  (level - 1) * 20 + 10 calculation is to have the sequence (10, 30, 50, 70, ...)
            // in other words, the margin starts at 10px at level 1 (first child) and increases by 20px at each new level.
            props.level > 0 && (
              <div style={{ marginLeft: `${(props.level - 1) * 20 + 10}px` }}>&#8735;</div>
            )
          }

          <div
            className={classnames(
              'sidebar__content__navigation__workspace__item__name',
              {
                sidebar__content__navigation__workspace__item__current: props.location.pathname.includes(
                  `${PAGE.WORKSPACE.ROOT}/${props.workspaceId}`
                )
              }
            )}
            title={props.label}
          >
            {props.label}
          </div>

          {state.showDropdownMenuButton && (
            <DropdownMenu
              buttonIcon='fa-ellipsis-v'
              buttonCustomClass='sidebar__content__navigation__workspace__item__menu'
              buttonTooltip={props.t('Actions')}
            >
              {props.allowedAppList.map(allowedApp =>
                <Link
                  to={this.buildLink(allowedApp.route, props.location.search, props.workspaceId, props.activeWorkspaceId)}
                  data-cy={`sidebar_subdropdown-${allowedApp.slug}`}
                  key={allowedApp.slug}
                  childrenKey={allowedApp.slug}
                >
                  <i className={classnames(`fa fa-fw fa-${allowedApp.faIcon}`)} />
                  {props.t(allowedApp.label)}
                </Link>
              )}
            </DropdownMenu>
          )}
        </Link>
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

export default DropTarget(DRAG_AND_DROP.CONTENT_ITEM, dragAndDropTarget, dragAndDropTargetCollect)(withRouter(translate()(WorkspaceListItem)))

WorkspaceListItem.propTypes = {
  workspaceId: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  allowedAppList: PropTypes.array,
  onClickAllContent: PropTypes.func,
  activeWorkspaceId: PropTypes.number,
  level: PropTypes.number,
  userRoleIdInWorkspace: PropTypes.number
}

WorkspaceListItem.defaultProps = {
  allowedAppList: [],
  onClickAllContent: () => { },
  activeWorkspaceId: NO_ACTIVE_SPACE_ID,
  level: 0,
  userRoleIdInWorkspace: ROLE.reader.id
}
