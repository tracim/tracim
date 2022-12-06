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
    spaceIdColumn({
      header: props.t('ID'),
      tooltip: props.t('Sort by ID'),
      className: 'TracimTable__styles__flex__1'
    }),

    spaceNameColumn({
      header: props.t('Space'),
      tooltip: props.t('Sort by name'),
      className: 'TracimTable__styles__flex__1'
    }),

    spaceRoleDropdownColumn({
      header: props.t('Role'),
      tooltip: props.t('Sort by role'),
      className: 'TracimTable__styles__flex__2 TracimTable__styles__overflow__visible'
    }, props.onClickChangeRole),

    spaceLeaveButtonColumn({
      className: ' TracimTable__styles__flex__1'
    }, props.onLeaveSpaceClick, true, props.system, props.onlyManager)
  ]

  if (props.system.config.email_notification_activated) {
    columns.splice(2, 0, spaceMailNotificationColumn({
      header: props.t('Email notif.'),
      tooltip: props.t('Email notifications'),
      className: 'TracimTable__styles__flex__1'
    }, props.system, props.onChangeSubscriptionNotif))
  }

  return (
    <TracimTable
      columns={columns}
      data={props.spaceList}
      emptyMessage={props.t('This user is not a member of any space yet')}
      filterable
      sortable
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
