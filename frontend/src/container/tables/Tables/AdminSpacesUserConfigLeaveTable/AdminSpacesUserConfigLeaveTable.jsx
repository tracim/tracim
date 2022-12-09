import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'

import {
  TracimTable,
  spaceLeaveButtonColumn,
  spaceRoleDropdownColumn,
  spaceMailNotificationColumn,
  spanColumn,
  SORT_BY
} from 'tracim_frontend_lib'

const AdminSpacesUserConfigLeaveTable = (props) => {
  const columns = [
    spanColumn({
      header: props.t('ID'),
      tooltip: props.t('Sort by Id'),
      className: 'tracimTable__styles__flex__1'
    }, row => row.id, 'spaceId', SORT_BY.ID),

    spanColumn({
      header: props.t('Space'),
      tooltip: props.t('Sort by name'),
      className: 'tracimTable__styles__flex__1'
    }, row => row.label, 'spaceName', SORT_BY.LABEL),

    spaceRoleDropdownColumn({
      header: props.t('Role'),
      tooltip: props.t('Sort by role'),
      className: 'tracimTable__styles__flex__2'
    }, props.onClickChangeRole),

    spaceLeaveButtonColumn({
      className: 'tracimTable__styles__flex__1'
    }, props.onLeaveSpaceClick, true, props.system, props.onlyManager)
  ]

  if (props.system.config.email_notification_activated) {
    columns.splice(2, 0, spaceMailNotificationColumn({
      header: props.t('Email notif.'),
      tooltip: props.t('Email notifications'),
      className: 'tracimTable__styles__flex__1'
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
