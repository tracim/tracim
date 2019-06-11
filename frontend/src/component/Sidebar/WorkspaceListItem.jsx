import React from 'react'
import color from 'color'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import AnimateHeight from 'react-animate-height'
import { DropTarget } from 'react-dnd'
import {DRAG_AND_DROP, ROLE_OBJECT} from '../../helper.js'

const qs = require('query-string')

const shouldDisplayAsActive = (location, workspaceId, activeIdWorkspace, app) => {
  if (workspaceId !== activeIdWorkspace) return false

  const filterType = qs.parse(location.search).type

  return filterType
    ? app.slug === `contents/${filterType}`
    : location.pathname.includes(app.route)
}

const buildLink = (route, search, workspaceId, activeIdWorkspace) => {
  if (workspaceId !== activeIdWorkspace) return route

  if (search === '') return route

  // to keep query param (like opened folder) we need to copy theses param.
  // But "type" already is in allowedAppList.route, so we need to remove it before passing props.location.search
  let urlSearch = qs.parse(search)
  delete urlSearch.type
  urlSearch = qs.stringify(urlSearch, {encode: false})

  return `${route}${route.includes('?') ? '&' : '?'}${urlSearch}`
}

const WorkspaceListItem = props => {
  const isDropActive = props.canDrop && props.isOver
  const isDropAllowed = props.userWorkspaceRoleId >= ROLE_OBJECT.contributor.id
  const isDropAllowedOnWorkspaceRoot = props.draggedItem && (props.draggedItem.workspaceId !== props.workspaceId || props.draggedItem.parentId !== 0)

  return (
    <li
      className='sidebar__content__navigation__workspace__item'
      data-cy='sidebar__content__navigation__workspace__item'
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
            color: color(GLOBAL_primaryColor).light() ? '#333333' : '#fdfdfd'
          }}
        >
          {isDropActive
            ? isDropAllowed && isDropAllowedOnWorkspaceRoot
              ? <i className='fa fa-arrow-circle-down' />
              : <i className='fa fa-times-circle' />
            : props.label.substring(0, 2).toUpperCase()
          }
        </div>

        <div className='sidebar__content__navigation__workspace__item__name' title={props.label}>
          {props.label}
        </div>

        <div className='sidebar__content__navigation__workspace__item__icon'>
          {props.isOpenInSidebar
            ? <i className={classnames('fa fa-chevron-up')} title={props.t('hide shared space')} />
            : <i className={classnames('fa fa-chevron-down')} title={props.t('see shared space')} />
          }
        </div>
      </div>

      <AnimateHeight duration={500} height={props.isOpenInSidebar ? 'auto' : 0}>
        <ul className='sidebar__content__navigation__workspace__item__submenu'>
          {props.allowedAppList.map(aa =>
            <li key={aa.slug}>
              <Link to={buildLink(aa.route, props.location.search, props.workspaceId, props.activeIdWorkspace)}>
                <div className={classnames(
                  'sidebar__content__navigation__workspace__item__submenu__dropdown',
                  {'activeFilter': shouldDisplayAsActive(props.location, props.workspaceId, props.activeIdWorkspace, aa)}
                )}>
                  <div className='dropdown__icon' style={{backgroundColor: aa.hexcolor}}>
                    <i className={classnames(`fa fa-${aa.faIcon}`)} />
                  </div>

                  <div className='sidebar__content__navigation__workspace__item__submenu__dropdown__showdropdown'>
                    <div className='dropdown__title' id='navbarDropdown'>
                      <div className='dropdown__title__text'>
                        {props.t(aa.label)}
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

const dragAndDropTarget = {
  drop: props => ({
    workspaceId: props.workspaceId,
    parentId: 0 // INFO - CH - 2019-06-05 - moving content to a different workspace is always at the root of it
  })
}

const dragAndDropCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
  draggedItem: monitor.getItem()
})

export default DropTarget(DRAG_AND_DROP.CONTENT_ITEM, dragAndDropTarget, dragAndDropCollect)(withRouter(translate()(WorkspaceListItem)))

WorkspaceListItem.propTypes = {
  workspaceId: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  allowedAppList: PropTypes.array,
  onClickTitle: PropTypes.func,
  onClickAllContent: PropTypes.func,
  isOpenInSidebar: PropTypes.bool,
  activeFilterList: PropTypes.array,
  activeIdWorkspace: PropTypes.number
}

WorkspaceListItem.defaultProps = {
  onClickTitle: () => {},
  onClickAllContent: () => {},
  isOpenInSidebar: false,
  activeFilterList: [],
  activeIdWorkspace: -1
}
