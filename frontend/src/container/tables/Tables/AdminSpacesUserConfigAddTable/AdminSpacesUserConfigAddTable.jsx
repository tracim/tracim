import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  TracimTable,
  spaceNameColumn,
  spaceAddButtonColumn,
  spaceIdColumn
} from 'tracim_frontend_lib'

const AdminSpacesUserConfigAddTable = (props) => {
  const columns = [
    spaceIdColumn({
      header: props.t('ID'),
      tooltip: props.t('Sort by Id'),
      className: 'tracimTable__styles__flex__1'
    }),

    spaceNameColumn({
      header: props.t('Space'),
      tooltip: props.t('Sort by name'),
      className: 'tracimTable__styles__flex__1'
    }),

    spaceAddButtonColumn({
      className: 'tracimTable__styles__flex__1'
    }, props.onAddSpaceClick)
  ]

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

AdminSpacesUserConfigAddTable.propsType = {
  spaceList: PropTypes.array.isRequired,
  onAddSpaceClick: PropTypes.func.isRequired
}

export default translate()(AdminSpacesUserConfigAddTable)
