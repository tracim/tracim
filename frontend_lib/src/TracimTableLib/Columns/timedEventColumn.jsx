import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'

import { getRevisionTypeLabel } from '../../helper.js'

import TimedEvent from '../../component/TimedEvent/TimedEvent.jsx'

const timedEventColumn = (settings, lang, t) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => {
    if (!row.content || !row.content.lastModifier) return undefined
    const date = new Date(row.content.modified)
    return `${date.getFullYear()} ${date.getMonth()} ${date.getDate()} ${row.content.lastModifier.publicName}`
  }, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: 'lastModification',
    cell: props => {
      if (!props.row.original.content) return null

      return (
        <TimedEvent
          customClass='contentListItem__modification'
          operation={getRevisionTypeLabel(props.row.original.content.currentRevisionType, t)}
          date={props.row.original.content.modified}
          lang={lang}
          author={props.row.original.content.lastModifier}
        />
      )
    },
    className: settings.className,
    filterFn: 'includesString',
    sortingFn: 'alphanumeric'
  })
}

export default timedEventColumn
