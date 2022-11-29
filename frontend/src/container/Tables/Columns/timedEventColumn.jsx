import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  TimedEvent,
  stringIncludes
} from 'tracim_frontend_lib'
import { getRevisionTypeLabel } from '../../../util/helper.js'

const timedEventColumn = (header, translate) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row.content, {
    header: () => (
      <span>{header}</span>
    ),
    id: 'lastModification',
    cell: props => (
      <TimedEvent
        customClass='contentListItem__modification'
        operation={getRevisionTypeLabel(props.getValue().currentRevisionType, translate)}
        date={props.getValue().modified}
        lang='fr'
        author={props.getValue().lastModifier}
      />
    ),
    className: 'TracimTable__styles__flex__2  TracimTable__hide__md',
    filter: (data, userFilter) => {
      if (!data.content.lastModifier) return false
      return stringIncludes(userFilter)(data.content.lastModifier.publicName)
    }
  })
}

export default timedEventColumn
