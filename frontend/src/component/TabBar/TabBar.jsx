import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import Tab from './Tab.jsx'
import {
  PAGE,
  PageTitle,
  SPACE_TYPE_LIST
} from 'tracim_frontend_lib'

require('./TabBar.styl')

export const TabBar = props => {
  const spaceType = (
    SPACE_TYPE_LIST.find(type => type.slug === props.currentSpace.accessType) ||
    { faIcon: 'fas fa-spinner fa-spin', label: props.t('Unknown space type') }
  )
  return (
    <div className='tabBar'>
      <PageTitle
        title={props.currentSpace.label}
        icon={spaceType.faIcon}
        breadcrumbsList={props.breadcrumbs}
        iconTooltip={spaceType.label}
      />

      <div className='tabBar__tabs'>
        <Tab
          page={PAGE.WORKSPACE.DASHBOARD(props.currentSpace.id)}
          icon='fas fa-fw fa-tachometer-alt'
          label={props.t('Dashboard')}
        />

        {props.currentSpace.publicationEnabled && (
          <Tab
            page={PAGE.WORKSPACE.PUBLICATIONS(props.currentSpace.id)}
            icon='fas fa-fw fa-stream'
            label={props.t('News')}
          />
        )}

        <Tab
          page={PAGE.WORKSPACE.CONTENT_LIST(props.currentSpace.id)}
          icon='fas fa-fw fa-th'
          label={props.t('Contents')}
        />
      </div>
    </div>
  )
}

export default translate()(TabBar)

TabBar.propTypes = {
  currentSpace: PropTypes.object.isRequired,
  breadcrumbs: PropTypes.array.isRequired
}
