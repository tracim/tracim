import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import AnimateHeight from 'react-animate-height'
import { DropTarget } from 'react-dnd'
import { DRAG_AND_DROP } from '../../helper.js'
import { ROLE } from 'tracim_frontend_lib'

const qs = require('query-string')
const color = require('color')

class WorkspaceListItem extends React.Component {
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
      const isDropAllowed = props.userRoleIdInWorkspace >= ROLE.contributor.id
      const isDropAllowedOnWorkspaceRoot = props.draggedItem && (props.draggedItem.workspaceId !== props.workspaceId || props.draggedItem.parentId !== 0)

      if (isDropAllowed && isDropAllowedOnWorkspaceRoot) return <i className='fa fa-arrow-circle-down' />
      return <i className='fa fa-times-circle' />
    }

    return props.label.substring(0, 2).toUpperCase()
  }

  render () {
    const { props } = this
    return (
      <li
        className='sidebar__content__navigation__workspace__item'
        data-cy={`sidebar__content__navigation__workspace__item_${props.workspaceId}`}
        ref={props.connectDropTarget}
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

          <div className='sidebar__content__navigation__workspace__item__icon'>
            {props.isOpenInSidebar
              ? <i className={classnames('fa fa-chevron-up')} title={props.t('Hide shared space')} />
              : <i className={classnames('fa fa-chevron-down')} title={props.t('See shared space')} />
            }
          </div>
        </div>

        <AnimateHeight duration={500} height={props.isOpenInSidebar ? 'auto' : 0}>
          <ul className='sidebar__content__navigation__workspace__item__submenu'>
            {props.allowedAppList.map(allowedApp =>
              <li
                data-cy={`sidebar_subdropdown-${allowedApp.slug}`}
                key={allowedApp.slug}
              >
                <Link to={this.buildLink(allowedApp.route, props.location.search, props.workspaceId, props.activeWorkspaceId)}>
                  <div className={classnames(
                    'sidebar__content__navigation__workspace__item__submenu__dropdown',
                    { 'activeFilter': this.shouldDisplayAsActive(props.location, props.workspaceId, props.activeWorkspaceId, allowedApp) }
                  )}>
                    <div className='dropdown__icon' style={{ backgroundColor: allowedApp.hexcolor }}>
                      <i className={classnames(`fa fa-${allowedApp.faIcon}`)} />
                    </div>

                    <div className='sidebar__content__navigation__workspace__item__submenu__dropdown__showdropdown'>
                      <div className='dropdown__title' id='navbarDropdown'>
                        <div className='dropdown__title__text'>
                          {props.t(allowedApp.label)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            )}
          </ul>
        </AnimateHeight>
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
  onClickTitle: () => {},
  onClickAllContent: () => {},
  isOpenInSidebar: false,
  activeFilterList: [],
  activeWorkspaceId: -1
}
