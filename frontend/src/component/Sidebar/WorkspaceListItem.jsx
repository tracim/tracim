import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import { DRAG_AND_DROP } from '../../util/helper.js'
import { ROLE, DropdownMenu } from 'tracim_frontend_lib'

const qs = require('query-string')
const color = require('color')

class WorkspaceListItem extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showDropdownMenuButton: false
    }
  }

  shouldDisplayAsActive = (location, workspaceId, activeWorkspaceId, app) => {
    if (workspaceId !== activeWorkspaceId) return false

    const filterType = qs.parse(location.search).type

    return filterType
      ? app.slug === `contents/${filterType}`
      : location.pathname.includes(app.route)
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

    const isDropActive = props.canDrop && props.isOver

    if (isDropActive) {
      const isDropAllowed = props.userRoleIdInWorkspace >= ROLE.contentManager.id
      const isDropAllowedOnWorkspaceRoot = props.draggedItem && (props.draggedItem.workspaceId !== props.workspaceId || props.draggedItem.parentId !== 0)

      if (isDropAllowed && isDropAllowedOnWorkspaceRoot) return <i className='fa fa-arrow-circle-down' />
      return <i className='fa fa-times-circle' />
    }

    return props.label.substring(0, 2).toUpperCase()
  }

  handleItemHover = () => this.setState(prev => ({ showDropdownMenuButton: !prev.showDropdownMenuButton }))

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
        <div
          className='sidebar__content__navigation__workspace__item__wrapper'
          onClick={props.onClickTitle}
        >
          <div
            className='sidebar__content__navigation__workspace__item__number'
            style={{
              backgroundColor: GLOBAL_primaryColor,
              color: color(GLOBAL_primaryColor).isLight() ? '#333333' : '#fdfdfd'
            }}
          >
            {this.getIcon()}
          </div>

          <div className='sidebar__content__navigation__workspace__item__name' title={props.label}>
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
                  <i className={classnames(`fa fa-${allowedApp.faIcon}`)} />
                  {props.t(allowedApp.label)}
                </Link>
              )}
            </DropdownMenu>
          )}
        </div>
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
  onClickTitle: PropTypes.func,
  onClickAllContent: PropTypes.func,
  isOpenInSidebar: PropTypes.bool,
  activeFilterList: PropTypes.array,
  activeWorkspaceId: PropTypes.number
}

WorkspaceListItem.defaultProps = {
  allowedAppList: [],
  onClickTitle: () => { },
  onClickAllContent: () => { },
  isOpenInSidebar: false,
  activeFilterList: [],
  activeWorkspaceId: -1
}
