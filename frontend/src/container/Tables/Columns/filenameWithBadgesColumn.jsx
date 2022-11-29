import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { FilenameWithBadges, stringIncludes } from 'tracim_frontend_lib'

const filenameWithBadgesColumn = (header) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'title',
    cell: props => (
      <FilenameWithBadges file={props.getValue().content} />
    ),
    className: 'TracimTable__styles__flex__4',
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.content.label)
    }
  })
}

export default filenameWithBadgesColumn
