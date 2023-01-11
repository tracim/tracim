import React from 'react'
import classnames from 'classnames'
import { createColumnHelper } from '@tanstack/react-table'

import { getRevisionTypeLabel } from '../../helper.js'

import TimedEvent from '../../component/TimedEvent/TimedEvent.jsx'

const timedEventColumn = (settings, lang, t) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => {
    if (!row.content || !row.content.lastModifier) return ''
    return `${row.content.modified} ${row.content.lastModifier.publicName}`
  }, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: settings.id,
    cell: props => {
      if (!props.row.original.content) return null

      return (
        <TimedEvent
          customClass='timedEventColumn__modification'
          operation={getRevisionTypeLabel(props.row.original.content.currentRevisionType, t)}
          date={props.row.original.content.modified}
          lang={lang}
          author={props.row.original.content.lastModifier}
        />
      )
    },
    className: settings.className,
    style: classnames(settings.style),
    filterFn: 'includesString',
    sortingFn: 'alphanumeric'
  })
}

export default timedEventColumn
