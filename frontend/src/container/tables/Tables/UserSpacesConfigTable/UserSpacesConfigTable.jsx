import React from 'react'
import PropTypes from 'prop-types'
import {
  TracimTable,
  spaceLeaveButton,
  spaceNameColumn,
  spaceUserRoleColumn
} from 'tracim_frontend_lib'

import { connect } from 'react-redux'
import { translate } from 'react-i18next'

const UserSpacesConfigTable = (props) => {
  const columns = [
    spaceNameColumn(props.t('Space')),
    spaceUserRoleColumn(props.t('Role')),
    spaceLeaveButton(props.onLeaveSpaceClick, props.admin, props.system, props.onlyManager)
  ]

  return (
    <TracimTable
      columns={columns}
      data={props.spaceList}
      noHeader
      emptyMessage={props.admin
        ? props.t('This user is not a member of any space yet')
        : props.t('You are not a member of any space yet')}
      filterable
      sortable
      filterPlaceholder={props.t('Filter spaces')}
      customRowClass='membersTable__row'
    />
  )
}

UserSpacesConfigTable.propsType = {
  spaceList: PropTypes.array.isRequired,
  onLeaveSpaceClick: PropTypes.func.isRequired,
  admin: PropTypes.bool.isRequired,
  onlyManager: PropTypes.func.isRequired
}

const mapStateToProps = ({ system }) => ({ system })

export default connect(mapStateToProps)(translate()(UserSpacesConfigTable))
