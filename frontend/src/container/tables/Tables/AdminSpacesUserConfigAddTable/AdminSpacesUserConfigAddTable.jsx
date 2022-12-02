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
    spaceIdColumn(),
    spaceNameColumn(props.t('Space'), props.t('Sort by title')),
    spaceAddButtonColumn(props.onAddSpaceClick)
  ]

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

AdminSpacesUserConfigAddTable.propsType = {
  spaceList: PropTypes.array.isRequired,
  onAddSpaceClick: PropTypes.func.isRequired
}

export default translate()(AdminSpacesUserConfigAddTable)
