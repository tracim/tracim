import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimTable,
  spaceLeaveButtonColumn,
  spaceNameColumn,
  spaceRoleDropdownColumn,
  spaceIdColumn,
  spaceMailNotificationColumn
} from 'tracim_frontend_lib'

const AdminSpacesUserConfigLeaveTable = (props) => {
  const columns = [
    spaceIdColumn(),
    spaceNameColumn(props.t('Space'), props.t('Sort by title')),
    spaceRoleDropdownColumn(props.onClickChangeRole)
  ]

  if (props.system.config.email_notification_activated) {
    columns.push(spaceMailNotificationColumn(props.t('Email notifications'), props.system, props.onChangeSubscriptionNotif))
  }
  columns.push(spaceLeaveButtonColumn(props.onLeaveSpaceClick, true, props.system, props.onlyManager))

  return (
    <TracimTable
      columns={columns}
      data={props.spaceList}
      emptyMessage={props.t('This user is not a member of any space yet')}
      filterable
      noHeader
      colored
      filterPlaceholder={props.t('Filter spaces')}
    />
  )
}

AdminSpacesUserConfigLeaveTable.propsType = {
  spaceList: PropTypes.array.isRequired,
  onLeaveSpaceClick: PropTypes.func.isRequired,
  onChangeSubscriptionNotif: PropTypes.func.isRequired,
  onClickChangeRole: PropTypes.func.isRequired,
  onlyManager: PropTypes.func.isRequired
}

const mapStateToProps = ({ system }) => ({ system })

export default connect(mapStateToProps)(translate()(AdminSpacesUserConfigLeaveTable))
