import React from 'react'
import { translate } from 'react-i18next'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import Tab from './Tab.jsx'
import {
  PageTitle,
  SPACE_TYPE_LIST
} from 'tracim_frontend_lib'
import { PAGE } from '../../util/helper.js'

require('./TabBar.styl')

export const TabBar = props => {
  const spaceType = (
    SPACE_TYPE_LIST.find(type => type.slug === props.currentSpace.accessType) ||
    { faIcon: 'spinner fa-spin', label: props.t('Unknown space type') }
  )
  return (
    <div className='tabBar'>
      <PageTitle
        title={props.currentSpace.label}
        icon={spaceType.faIcon}
        breadcrumbsList={props.breadcrumbs}
        iconTooltip={spaceType.label}
      />

      <Tab
        page={PAGE.WORKSPACE.DASHBOARD(props.currentSpace.id)}
        icon='tachometer'
        label={props.t('Dashboard')}
        active={props.location.pathname.includes(PAGE.WORKSPACE.DASHBOARD(props.currentSpace.id))}
      />

      <Tab
        page={PAGE.WORKSPACE.FEED(props.currentSpace.id)}
        icon='newspaper-o'
        label={props.t('Activity feed')}
        active={props.location.pathname.includes(PAGE.WORKSPACE.FEED(props.currentSpace.id))}
      />

      <Tab
        page={PAGE.WORKSPACE.CONTENT_LIST(props.currentSpace.id)}
        icon='th'
        label={props.t('All contents')}
        active={props.location.pathname.includes(PAGE.WORKSPACE.CONTENT_LIST(props.currentSpace.id))}
      />
    </div>
  )
}

export default withRouter(translate()(TabBar))

TabBar.propTypes = {
  currentSpace: PropTypes.object.isRequired,
  breadcrumbs: PropTypes.array.isRequired
}

TabBar.defaultProps = {
}
