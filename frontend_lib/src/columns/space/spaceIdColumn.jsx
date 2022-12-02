import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { stringIncludes } from '../../helper'

const spaceIdColumn = (settings) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.id, {
    header: '',
    id: 'spaceId',
    cell: props => {
      return (
        <span>{props.getValue()}</span>
      )
    },
    className: settings.className,
    filter: (data, userFilter) => {
      return stringIncludes(userFilter)(data.id.toString())
    }
  })
}

spaceIdColumn.propsType = {}

spaceIdColumn.defaultProps = {}

export default spaceIdColumn
