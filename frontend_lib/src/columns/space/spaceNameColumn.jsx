import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

const spaceNameColumn = (header) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.space.slug, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'spaceName',
    cell: props => {
      return (
        <span>{props.getValue()}</span>
      )
    }
  })
}

export default spaceNameColumn
