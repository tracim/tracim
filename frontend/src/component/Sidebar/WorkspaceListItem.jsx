import React from 'react'
import color from 'color'
import { withRouter, Link } from 'react-router-dom'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import AnimateHeight from 'react-animate-height'

const qs = require('query-string')

const shouldDisplayAsActive = (location, idWorkspace, activeIdWorkspace, app) => {
  if (idWorkspace !== activeIdWorkspace) return false

  const filterType = qs.parse(location.search).type

  return filterType
    ? app.slug === `contents/${filterType}`
    : location.pathname.includes(app.route)
}

const buildLink = (route, search, idWorkspace, activeIdWorkspace) => {
  if (idWorkspace !== activeIdWorkspace) return route

  if (search === '') return route

  // to keep query param (like opened folder) we need to copy theses param.
  // But "type" already is in allowedApp.route, so we need to remove it before passing props.location.search
  let urlSearch = qs.parse(search)
  delete urlSearch.type
  urlSearch = qs.stringify(urlSearch, {encode: false})

  return `${route}${route.includes('?') ? '&' : '?'}${urlSearch}`
}

const WorkspaceListItem = props => {
  return (
    <li className='sidebar__content__navigation__workspace__item' data-cy='sidebar__content__navigation__workspace__item'>
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
          {props.label.substring(0, 2).toUpperCase()}
        </div>

        <div className='sidebar__content__navigation__workspace__item__name' title={props.label}>
          {props.label}
        </div>

        <div className='sidebar__content__navigation__workspace__item__icon'>
          <i className={classnames(props.isOpenInSidebar ? 'fa fa-chevron-up' : 'fa fa-chevron-down')} />
        </div>
      </div>

      <AnimateHeight duration={500} height={props.isOpenInSidebar ? 'auto' : 0}>
        <ul className='sidebar__content__navigation__workspace__item__submenu'>
          {props.allowedApp.map(aa =>
            <li key={aa.slug}>
              <Link to={buildLink(aa.route, props.location.search, props.idWs, props.activeIdWorkspace)}>
                <div className={classnames(
                  'sidebar__content__navigation__workspace__item__submenu__dropdown',
                  {'activeFilter': shouldDisplayAsActive(props.location, props.idWs, props.activeIdWorkspace, aa)}
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

export default withRouter(translate()(WorkspaceListItem))

WorkspaceListItem.propTypes = {
  label: PropTypes.string.isRequired,
  allowedApp: PropTypes.array,
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
